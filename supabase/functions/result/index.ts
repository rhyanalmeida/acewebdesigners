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
 * POST { appointmentId, result, upfront?, recurring?, recurringInterval?, plan?, notes? }
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'
import { sendCapiEvent } from '../_shared/meta.ts'
import { loadAppointmentIdentity } from '../_shared/identity.ts'

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
    actionSource: 'system_generated',
    customData: loaded.utm,
  })

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
      actionSource: 'system_generated',
      value: upfront,
      currency: 'USD',
      customData: {
        ...loaded.utm,
        recurring_value: recurring,
        recurring_interval: interval,
        predicted_ltv: predictedLtv,
        ...(b.plan ? { content_name: b.plan } : {}),
      },
    })
  }

  return json({ ok: true, result: b.result, capi })
})
