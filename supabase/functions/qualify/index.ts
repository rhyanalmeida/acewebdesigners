/**
 * `qualify` — capture qualifying answers AFTER the booking is confirmed.
 *
 * Poor initial qualification is the biggest documented driver of no-shows, but the
 * gate form is deliberately minimal (the old 6-field gate converted at 0.2%) and the
 * confirm step already converts booked-from-lead at 100%. So the questions are asked
 * on the DONE screen: the appointment is already saved, nothing here can cost a booking.
 *
 * The `appointmentId` uuid returned by `book` is the capability token — unguessable,
 * scoped to exactly one appointment — so this needs no new auth surface.
 *
 * Flow (each sink independently try-wrapped; a failed sink never fails the request):
 *   1. resolve the appointment → contact
 *   2. write contacts.years_in_business / has_website
 *   3. append a readable line to appointments.notes
 *   4. mirror into GHL custom fields (NO tag change — would re-enter workflows)
 *   5. append to the Google Calendar invite, which is where the call gets prepped from
 *
 * Test appointments write the DB rows and skip every external sink, per the
 * standing test-mode invariant.
 *
 * POST { appointmentId, yearsInBusiness?, hasWebsite? } → { ok }
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { ghlUpdateContactFields } from '../_shared/ghl.ts'
import { appendEventDescription } from '../_shared/google.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface QualifyBody {
  appointmentId?: string
  yearsInBusiness?: string
  hasWebsite?: string
}

/** Trim + cap — these are free-text columns fed by a <select>, so bound the input. */
const clean = (v?: string) => {
  const s = (v ?? '').trim()
  return s ? s.slice(0, 120) : undefined
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  let b: QualifyBody
  try {
    b = (await req.json()) as QualifyBody
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  const appointmentId = (b.appointmentId ?? '').trim()
  if (!UUID_RE.test(appointmentId)) return json({ error: 'valid appointmentId required' }, 400)

  const yearsInBusiness = clean(b.yearsInBusiness)
  const hasWebsite = clean(b.hasWebsite)
  if (!yearsInBusiness && !hasWebsite) return json({ error: 'nothing to save' }, 400)

  const supa = admin()

  // ── 1) resolve appointment → contact ────────────────────────────────────────
  const { data: appt, error: apptErr } = await supa
    .from('appointments')
    .select('id, contact_id, calendar, is_test, notes, gcal_event_id, contacts(email, phone)')
    .eq('id', appointmentId)
    .single()
  if (apptErr || !appt) return json({ error: 'appointment not found' }, 404)

  const contact = (appt.contacts ?? {}) as { email?: string; phone?: string }

  // ── 2) persist on the contact (the durable record) ──────────────────────────
  const patch: Record<string, string> = {}
  if (yearsInBusiness) patch.years_in_business = yearsInBusiness
  if (hasWebsite) patch.has_website = hasWebsite
  if (appt.contact_id) {
    const { error } = await supa.from('contacts').update(patch).eq('id', appt.contact_id)
    if (error) {
      console.error('[qualify] contact update failed', error.message)
      return json({ error: 'could not save answers' }, 500)
    }
  }

  // ── 3) append to the appointment's notes ────────────────────────────────────
  const summary = [
    yearsInBusiness ? `In business: ${yearsInBusiness}` : null,
    hasWebsite ? `Website now: ${hasWebsite}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  try {
    const prior = (appt.notes as string | null) ?? ''
    await supa
      .from('appointments')
      .update({ notes: prior ? `${prior}\n${summary}` : summary })
      .eq('id', appointmentId)
  } catch (err) {
    console.error('[qualify] notes append failed', err)
  }

  // Test bookings stop here — no GHL, no Google. Same invariant as `book`.
  if (appt.is_test) {
    console.log(`[qualify] test appointment ${appointmentId} — external sinks skipped`)
    return json({ ok: true, test: true })
  }

  // ── 4) GHL custom fields (no tag change) ────────────────────────────────────
  try {
    await ghlUpdateContactFields({
      email: contact.email,
      phone: contact.phone,
      qualifiers: { years_in_business: yearsInBusiness, has_website: hasWebsite },
    })
  } catch (err) {
    console.error('[qualify] ghl update failed', err)
  }

  // ── 5) surface it on the calendar invite ────────────────────────────────────
  try {
    const cal = appt.calendar === 'main' ? 'main' : 'contractor'
    if (appt.gcal_event_id) await appendEventDescription(cal, appt.gcal_event_id as string, summary)
  } catch (err) {
    console.error('[qualify] calendar append failed', err)
  }

  console.log(`[qualify] saved for appointment=${appointmentId} — ${summary}`)
  return json({ ok: true })
})
