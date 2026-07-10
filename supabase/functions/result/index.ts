/**
 * `result` — admin "results" a meeting: No-Show / Showed / Purchase.
 *
 * Fires the matching Meta event, REUSING the original lead's attribution (IP/UA/
 * UTM/fbc/fbp + PII) so the later event matches as well as the booking Lead did:
 *   - showed   → CompleteRegistration                 (event_id cr_<appt>)
 *   - purchase → CompleteRegistration + Purchase       (event_id purchase_<appt>)
 *               value = upfront; recurring + plan + predicted LTV in custom_data
 *   - no_show  → status only (no Meta event)
 *
 * Idempotent: event_ids derive from the appointment id, so re-results / Stripe
 * overlaps dedupe in capi_events. Admin-only (requireAdmin).
 *
 * POST { appointmentId, result, upfront?, recurring?, recurringInterval?, plan?, notes?, test? }
 * `test: true` marks the appointment (and its capi_events) is_test, routes this
 * result's Meta events to Test Events, and skips GHL — for dry-runs on a live booking.
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'
import { sendCapiEvent } from '../_shared/meta.ts'
import { loadAppointmentIdentity } from '../_shared/identity.ts'
import { ghlSyncStage } from '../_shared/ghl.ts'
import type { GhlAttribution } from '../_shared/ghl.ts'

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const adminUser = await requireAdmin(req)
  if (!adminUser) return json({ error: 'unauthorized' }, 401)

  let b: {
    appointmentId?: string
    result?: 'showed' | 'no_show' | 'purchase'
    upfront?: number
    recurring?: number
    recurringInterval?: 'monthly' | 'annual' | 'one_time'
    plan?: string
    notes?: string
    test?: boolean
  }
  try {
    b = await req.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }
  if (!b.appointmentId || !['showed', 'no_show', 'purchase'].includes(b.result ?? '')) {
    return json({ error: 'appointmentId and a valid result are required' }, 400)
  }

  const supa = admin()
  const loaded = await loadAppointmentIdentity(b.appointmentId)
  if (!loaded) return json({ error: 'appointment not found' }, 404)

  const now = new Date().toISOString()
  const baseUpdate = { result_notes: b.notes ?? null, resulted_at: now, resulted_by: adminUser.email }
  // Results on a TEST booking stay test-coded — they must never count as live.
  // An admin can also flag a live booking as test at result time (b.test).
  const isTest = loaded.isTest || b.test === true
  if (b.test && !loaded.isTest) {
    await supa.from('appointments').update({ is_test: true }).eq('id', b.appointmentId)
    await supa.from('capi_events').update({ is_test: true }).eq('appointment_id', b.appointmentId)
  }
  const testCode = isTest ? (Deno.env.get('META_TEST_EVENT_CODE') || 'TEST') : undefined

  // ── No-Show: status only ────────────────────────────────────────────────────
  if (b.result === 'no_show') {
    await supa.from('appointments').update({ status: 'no_show', ...baseUpdate }).eq('id', b.appointmentId)
    return json({ ok: true, result: 'no_show', capi: 'none' })
  }

  // ── Showed (also implied by Purchase) → CompleteRegistration ─────────────────
  await supa.from('appointments').update({ status: 'showed', ...baseUpdate }).eq('id', b.appointmentId)
  const capi: Record<string, unknown> = {}
  capi.completeRegistration = await sendCapiEvent({
    ...loaded.base,
    eventName: 'CompleteRegistration',
    eventId: `cr_${b.appointmentId}`,
    actionSource: 'system_generated', // offline: showed up on a call / marked in CRM
    customData: loaded.utm,
    testEventCode: testCode,
  })

  // Reusable GHL contact identity + base attribution (replayed from the lead).
  const ghlContact = {
    email: loaded.base.email,
    phone: loaded.base.phone,
    firstName: loaded.base.firstName,
    lastName: loaded.base.lastName,
    city: loaded.base.city,
    state: loaded.base.state,
    zip: loaded.base.zip,
    country: loaded.base.country,
  }
  const baseAttr: GhlAttribution = {
    fbc: loaded.base.fbc,
    fbp: loaded.base.fbp,
    fbclid: loaded.base.fbclid,
    clientIp: loaded.base.clientIpAddress,
    clientUserAgent: loaded.base.clientUserAgent,
    utm: loaded.utm,
  }

  // ── GHL: funnel-showed tag (skipped for test bookings) ───────────────────────
  if (!isTest) try {
    await ghlSyncStage({ stage: 'showed', ...ghlContact, attribution: baseAttr })
  } catch (err) {
    console.error('[result] ghl showed sync failed', err)
  }

  // ── Purchase → upfront value + recurring/plan/LTV in custom_data ─────────────
  if (b.result === 'purchase') {
    const upfront = Math.max(Number(b.upfront) || 0, 0)
    const recurring = Math.max(Number(b.recurring) || 0, 0)
    const interval = b.recurringInterval ?? 'monthly'
    const annualRecurring = interval === 'monthly' ? recurring * 12 : interval === 'annual' ? recurring : 0
    const predictedLtv = Math.round((upfront + annualRecurring) * 100) / 100

    await supa
      .from('appointments')
      .update({
        purchased_at: now,
        value: upfront,
        upfront_value: upfront,
        recurring_value: recurring,
        recurring_interval: interval,
        plan_name: b.plan ?? null,
      })
      .eq('id', b.appointmentId)

    capi.purchase = await sendCapiEvent({
      ...loaded.base,
      eventName: 'Purchase',
      eventId: `purchase_${b.appointmentId}`,
      actionSource: 'system_generated', // offline: closed on a call / in the CRM
      value: upfront,
      currency: 'USD',
      customData: {
        ...loaded.utm,
        recurring_value: recurring,
        recurring_interval: interval,
        predicted_ltv: predictedLtv,
        ...(b.plan ? { content_name: b.plan } : {}),
      },
      testEventCode: testCode,
    })

    // ── GHL: funnel-purchased tag + deal value/plan custom fields ──────────────
    if (!isTest) try {
      await ghlSyncStage({
        stage: 'purchased',
        ...ghlContact,
        attribution: {
          ...baseAttr,
          dealValue: upfront,
          recurringValue: recurring,
          recurringInterval: interval,
          planName: b.plan,
        },
      })
    } catch (err) {
      console.error('[result] ghl purchased sync failed', err)
    }
  }

  return json({ ok: true, result: b.result, capi })
})
