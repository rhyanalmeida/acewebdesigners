/**
 * `book` — create a booking. The orchestrator that replaces GHL's calendar.
 *
 * Flow (booking is committed before external sinks so none can lose it):
 *   1. validate input + slot
 *   2. upsert contact (by email) with Meta attribution
 *   3. insert appointment (DB unique index prevents double-booking)
 *   4. fire server CAPI Lead (same event_id as the browser pixel → Meta dedupes)
 *   5. create Google Calendar event (best-effort)
 *   6. push to GHL to fire its messaging workflow (best-effort, isolated)
 *
 * POST { calendar, startISO, endISO, tz, email, firstName?, lastName?, name?,
 *        phone?, city?, state?, zip?, country?, fbc?, fbp?, fbclid?, eventId?,
 *        eventSourceUrl?, notes? }
 *   → { ok, appointmentId, startISO }  (409 if the slot was just taken)
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { sendCapiEvent } from '../_shared/meta.ts'
import { createEvent } from '../_shared/google.ts'
import { pushBooking } from '../_shared/ghl.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Extract utm_* params from the landing URL (for Meta custom_data + reporting). */
function parseUtm(url?: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!url) return out
  try {
    const sp = new URL(url).searchParams
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = sp.get(k)
      if (v) out[k] = v.slice(0, 256)
    }
  } catch {
    /* ignore bad URL */
  }
  return out
}

interface BookBody {
  calendar?: string
  startISO?: string
  endISO?: string
  tz?: string
  email?: string
  firstName?: string
  lastName?: string
  name?: string
  phone?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  fbc?: string
  fbp?: string
  fbclid?: string
  eventId?: string
  eventSourceUrl?: string
  notes?: string
  test?: boolean // routes CAPI to Test Events + skips GHL/messaging (never pollutes live data)
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  let b: BookBody
  try {
    b = (await req.json()) as BookBody
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  // ── validate ────────────────────────────────────────────────────────────────
  const calendar = b.calendar === 'main' ? 'main' : b.calendar === 'contractor' ? 'contractor' : null
  if (!calendar) return json({ error: "calendar must be 'main' or 'contractor'" }, 400)
  const email = (b.email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return json({ error: 'valid email required' }, 400)
  const startMs = b.startISO ? Date.parse(b.startISO) : NaN
  const endMs = b.endISO ? Date.parse(b.endISO) : NaN
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return json({ error: 'valid startISO/endISO required' }, 400)
  }
  if (startMs < Date.now()) return json({ error: 'slot is in the past' }, 400)
  const tz = b.tz || 'America/New_York'

  // name: prefer explicit first/last, else split combined
  let firstName = (b.firstName ?? '').trim()
  let lastName = (b.lastName ?? '').trim()
  if (!firstName && b.name) {
    const parts = b.name.trim().split(/\s+/)
    firstName = parts.shift() ?? ''
    lastName = parts.join(' ')
  }

  const startISO = new Date(startMs).toISOString()
  const endISO = new Date(endMs).toISOString()
  const supa = admin()

  // client identity for match quality
  const clientIp =
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  const clientUa = req.headers.get('user-agent') ?? undefined
  const utm = parseUtm(b.eventSourceUrl)

  // ── 2) upsert contact ─────────────────────────────────────────────────────────
  const contactRow = {
    email,
    phone: b.phone ?? null,
    first_name: firstName || null,
    last_name: lastName || null,
    city: b.city ?? null,
    state: b.state ?? null,
    zip: b.zip ?? null,
    country: b.country ?? 'US',
    fbc: b.fbc ?? null,
    fbp: b.fbp ?? null,
    fbclid: b.fbclid ?? null,
  }
  const { data: contact, error: contactErr } = await supa
    .from('contacts')
    .upsert(contactRow, { onConflict: 'email' })
    .select('id')
    .single()
  if (contactErr || !contact) {
    console.error('[book] contact upsert failed', contactErr?.message)
    return json({ error: 'could not save contact' }, 500)
  }
  const contactId = contact.id as string

  // ── 3) insert appointment (unique index guards double-booking) ────────────────
  const eventId = b.eventId || crypto.randomUUID()
  const { data: appt, error: apptErr } = await supa
    .from('appointments')
    .insert({
      contact_id: contactId,
      calendar,
      start_ts: startISO,
      end_ts: endISO,
      tz,
      status: 'booked',
      event_id: eventId,
      notes: b.notes ?? null,
      client_ip: clientIp ?? null,
      client_user_agent: clientUa ?? null,
      event_source_url: b.eventSourceUrl ?? null,
      utm: Object.keys(utm).length ? utm : null,
    })
    .select('id')
    .single()
  if (apptErr) {
    if ((apptErr as { code?: string }).code === '23505') {
      return json({ error: 'That time was just booked — please pick another slot.' }, 409)
    }
    console.error('[book] appointment insert failed', apptErr.message)
    return json({ error: 'could not save appointment' }, 500)
  }
  const appointmentId = appt.id as string

  // ── 4) CAPI Lead (same event_id as the browser pixel → Meta dedupes) ──────────
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
      appointmentId,
      // Test bookings route to Meta Test Events only — never counted as live.
      testEventCode: b.test ? (Deno.env.get('META_TEST_EVENT_CODE') || 'TEST') : undefined,
    })
  } catch (err) {
    console.error('[book] CAPI Lead failed (booking kept)', err)
  }

  // ── 5) Google Calendar (best-effort) ──────────────────────────────────────────
  try {
    const gcalId = await createEvent({
      calendar,
      summary: `Meeting — ${firstName} ${lastName}`.trim(),
      description: `Email: ${email}\nPhone: ${b.phone ?? '—'}\nBooked via acewebdesigners.com`,
      startISO,
      endISO,
      tz,
      attendeeEmail: email,
    })
    if (gcalId) await supa.from('appointments').update({ gcal_event_id: gcalId }).eq('id', appointmentId)
  } catch (err) {
    console.error('[book] gcal create failed (booking kept)', err)
  }

  // ── 6) GHL messaging relay (best-effort, isolated) ────────────────────────────
  // Fires the GHL workflow (Inbound Webhook) so it sends confirmations/reminders.
  // We pass appointmentId so GHL can echo it back to ghl-webhook for tracking.
  // Skipped for test bookings so we never text/email real people during testing.
  if (!b.test) try {
    await pushBooking({
      appointmentId,
      contactId,
      eventId,
      email,
      phone: b.phone,
      firstName,
      lastName,
      city: b.city,
      state: b.state,
      zip: b.zip,
      country: b.country,
      startISO,
      endISO,
      tz,
      title: calendar === 'contractor' ? 'Free Design Meeting' : 'Discovery Call',
    })
  } catch (err) {
    console.error('[book] ghl relay failed (booking kept)', err)
  }

  return json({ ok: true, appointmentId, startISO })
})
