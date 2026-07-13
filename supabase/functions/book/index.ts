/**
 * `book` — create a booking. The orchestrator that replaces GHL's calendar.
 *
 * Flow (booking is committed before external sinks so none can lose it):
 *   1. validate input + verify the slot against live availability (server picks end_ts)
 *   2. upsert contact (by email) with durable Meta attribution
 *   3. insert appointment (DB overlap-exclusion constraint prevents double-booking)
 *   4. fire server CAPI Schedule (same event_id as the browser pixel → Meta dedupes;
 *      the Lead already fired at the gate-form step via the `lead` function)
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
import { computeOpenSlots } from '../_shared/availability.ts'
import { sendCapiEvent } from '../_shared/meta.ts'
import { createEvent } from '../_shared/google.ts'
import { createGhlAppointment, ghlSyncStage, pushLegacyBooking } from '../_shared/ghl.ts'
import { upsertContact } from '../_shared/contacts.ts'
import { mergeAttribution, parseAttribution, withDefaultAdIds } from '../_shared/attribution.ts'
import { netlifyConfigured } from '../_shared/netlify.ts'

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  if (!Number.isFinite(startMs)) return json({ error: 'valid startISO required' }, 400)
  if (startMs < Date.now()) return json({ error: 'slot is in the past' }, 400)
  const tz = b.tz || 'America/New_York'
  const startISO = new Date(startMs).toISOString()

  // Validate the requested start against LIVE open slots and take the slot's end
  // from the server — never trust the client's endISO. This rejects off-grid,
  // out-of-window, inside-lead-time, or already-busy times before we touch the
  // DB. (The DB overlap-exclusion constraint is still the hard race backstop.)
  let endISO: string
  try {
    const { slots } = await computeOpenSlots({ calendar })
    const match = slots.find((s) => s.startISO === startISO)
    if (!match) {
      return json({ error: 'That time is no longer available — please pick another slot.' }, 409)
    }
    endISO = match.endISO
  } catch (err) {
    console.error('[book] slot validation failed', err)
    return json({ error: 'could not verify availability' }, 500)
  }

  // name: prefer explicit first/last, else split combined
  let firstName = (b.firstName ?? '').trim()
  let lastName = (b.lastName ?? '').trim()
  if (!firstName && b.name) {
    const parts = b.name.trim().split(/\s+/)
    firstName = parts.shift() ?? ''
    lastName = parts.join(' ')
  }

  const supa = admin()

  // client identity for match quality
  const clientIp =
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  const clientUa = req.headers.get('user-agent') ?? undefined
  const landingUrl = b.landingUrl || b.eventSourceUrl
  const utm = withDefaultAdIds(mergeAttribution(b.utm, parseAttribution(landingUrl)), landingUrl)

  // ── 2) upsert contact (durable attribution; idempotent with the lead step) ────
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

  // ── 3) insert appointment (overlap-exclusion constraint guards double-booking) ─
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
      is_test: b.test === true,
      notes: b.notes ?? null,
      client_ip: clientIp ?? null,
      client_user_agent: clientUa ?? null,
      event_source_url: b.eventSourceUrl ?? null,
      utm: Object.keys(utm).length ? utm : null,
    })
    .select('id')
    .single()
  if (apptErr) {
    // 23505 = unique_violation (legacy index); 23P01 = exclusion_violation
    // (the appointments_no_overlap range constraint). Both mean the slot's gone.
    const code = (apptErr as { code?: string }).code
    if (code === '23505' || code === '23P01') {
      return json({ error: 'That time was just booked — please pick another slot.' }, 409)
    }
    console.error('[book] appointment insert failed', apptErr.message)
    return json({ error: 'could not save appointment' }, 500)
  }
  const appointmentId = appt.id as string

  // ── 4) CAPI Schedule (same event_id as the browser pixel → Meta dedupes) ──────
  // The `Lead` already fired at the gate-form step; booking a slot is `Schedule`.
  try {
    await sendCapiEvent({
      eventName: 'Schedule',
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

  // ── 5) Google Calendar (best-effort; skipped for test bookings) ───────────────
  if (!b.test) try {
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

  // ── 6) GHL relay (best-effort, isolated; skipped for test bookings) ───────────
  // (a) upsert the enriched contact + funnel-booked tag, (b) create a real GHL
  // appointment so GHL-native Appointment-Created + reminder workflows fire, and
  // (c) the legacy inbound-webhook (behind GHL_LEGACY_WEBHOOK) so existing
  // confirmations/reminders never lapse during cutover.
  const title = calendar === 'contractor' ? 'Free Design Meeting' : 'Discovery Call'
  if (!b.test) try {
    const ghlContactId = await ghlSyncStage({
      stage: 'booked',
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
    if (ghlContactId) await createGhlAppointment({ contactId: ghlContactId, startISO, endISO, title })
    // We pass appointmentId so GHL can echo it back to ghl-webhook for tracking.
    await pushLegacyBooking({
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
      title,
    })
  } catch (err) {
    console.error('[book] ghl relay failed (booking kept)', err)
  }

  // ── 7) queue the auto-generated preview website (never blocks) ────────────────
  // Real bookings are marked 'queued'; the scheduled Claude Code routine (hourly,
  // runs on the owner's subscription) picks them up, writes the multi-page site,
  // and deploys it to Netlify. If ANTHROPIC_API_KEY is ever set, the generate-site
  // Edge fn also fires immediately (API path) — the routine skips non-queued rows.
  if (!b.test && netlifyConfigured()) {
    try {
      await supa.from('appointments').update({ site_status: 'queued' }).eq('id', appointmentId)
      if (Deno.env.get('ANTHROPIC_API_KEY')) {
        const trigger = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-site`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-internal-key': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          },
          body: JSON.stringify({ appointmentId }),
        }).then(
          (r) => r.body?.cancel(),
          (e) => console.error('[book] generate-site trigger failed', e),
        )
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) EdgeRuntime.waitUntil(trigger)
      }
    } catch (err) {
      console.error('[book] generate-site queue failed (booking kept)', err)
    }
  }

  return json({ ok: true, appointmentId, startISO })
})
