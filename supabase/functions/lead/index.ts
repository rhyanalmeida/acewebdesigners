/**
 * `lead` — capture a lead at the gate-form step (BEFORE the calendar).
 *
 * The funnel's first conversion: the visitor gives name/email/phone and we fire
 * `Lead`. This is split out from `book` so an interested visitor who never picks
 * a slot is still a tracked Lead with full, durable attribution.
 *
 * Flow:
 *   1. validate email
 *   2. upsert contact (durable attribution: fbc/fbp/fbclid + ip/ua/url/utm)
 *   3. fire server CAPI Lead (same event_id as the browser pixel → Meta dedupes)
 *
 * POST { calendar, firstName?, lastName?, name?, email, phone?, fbc?, fbp?,
 *        fbclid?, eventId?, eventSourceUrl?, landingUrl?, utm?, test? }
 *   → { ok, contactId }
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { sendCapiEvent } from '../_shared/meta.ts'
import { upsertContact } from '../_shared/contacts.ts'
import { mergeAttribution, parseAttribution, withDefaultAdIds } from '../_shared/attribution.ts'
import { ghlSyncStage } from '../_shared/ghl.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LeadBody {
  calendar?: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  businessName?: string
  businessType?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  fbc?: string
  fbp?: string
  fbclid?: string
  eventId?: string
  eventSourceUrl?: string
  landingUrl?: string
  utm?: Record<string, string> // client-captured first-touch attribution
  test?: boolean
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  let b: LeadBody
  try {
    b = (await req.json()) as LeadBody
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  const calendar =
    b.calendar === 'main'
      ? 'main'
      : b.calendar === 'contractor'
        ? 'contractor'
        : b.calendar === 'restaurant'
          ? 'restaurant'
          : null
  if (!calendar) return json({ error: "calendar must be 'main', 'contractor', or 'restaurant'" }, 400)
  const email = (b.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return json({ error: 'valid email required' }, 400)

  // name: prefer explicit first/last, else split combined
  let firstName = (b.firstName ?? '').trim()
  let lastName = (b.lastName ?? '').trim()
  if (!firstName && b.name) {
    const parts = b.name.trim().split(/\s+/)
    firstName = parts.shift() ?? ''
    lastName = parts.join(' ')
  }

  // client identity for match quality (captured server-side, can't be spoofed)
  const clientIp =
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  const clientUa = req.headers.get('user-agent') ?? undefined
  const landingUrl = b.landingUrl || b.eventSourceUrl
  const utm = withDefaultAdIds(mergeAttribution(b.utm, parseAttribution(landingUrl)), landingUrl)

  const supa = admin()
  const contactId = await upsertContact(supa, {
    email,
    phone: b.phone,
    firstName,
    lastName,
    businessName: b.businessName,
    businessType: b.businessType,
    city: b.city,
    state: b.state,
    zip: b.zip,
    country: b.country,
    fbc: b.fbc,
    fbp: b.fbp,
    fbclid: b.fbclid,
    clientIp,
    clientUserAgent: clientUa,
    landingUrl,
    utm,
  })
  if (!contactId) return json({ error: 'could not save contact' }, 500)

  // CAPI Lead — same event_id as the browser pixel so Meta dedupes the pair.
  const eventId = b.eventId || crypto.randomUUID()
  try {
    await sendCapiEvent({
      eventName: 'Lead',
      eventId,
      dataset: calendar,
      actionSource: 'website',
      eventSourceUrl: b.eventSourceUrl,
      email,
      phone: b.phone,
      firstName,
      lastName,
      city: b.city,
      state: b.state,
      zip: b.zip,
      country: b.country,
      externalId: contactId,
      fbc: b.fbc,
      fbp: b.fbp,
      fbclid: b.fbclid,
      clientIpAddress: clientIp,
      clientUserAgent: clientUa,
      customData: utm,
      contactId,
      // Test leads route to Meta Test Events only — never counted as live.
      testEventCode: b.test ? (Deno.env.get('META_TEST_EVENT_CODE') || 'TEST') : undefined,
    })
  } catch (err) {
    console.error('[lead] CAPI Lead failed (contact kept)', err)
  }

  // ── GHL: upsert enriched contact + funnel-lead tag (skipped for test) ─────────
  // Fires whatever GHL workflow is bound to the funnel-lead tag (e.g. nurture).
  if (!b.test) try {
    await ghlSyncStage({
      stage: 'lead',
      funnel: calendar === 'restaurant' ? 'restaurant' : 'default',
      email,
      phone: b.phone,
      firstName,
      lastName,
      businessName: b.businessName,
      city: b.city,
      state: b.state,
      zip: b.zip,
      country: b.country,
      attribution: { fbc: b.fbc, fbp: b.fbp, fbclid: b.fbclid, clientIp, clientUserAgent: clientUa, landingUrl, utm },
    })
  } catch (err) {
    console.error('[lead] ghl sync failed (lead kept)', err)
  }

  return json({ ok: true, contactId })
})
