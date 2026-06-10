/**
 * `capi` — internal/manual Conversions API endpoint.
 *
 * Two modes:
 *  1. MANUAL SEND (scripts/verification) — fire a single CAPI event by hand,
 *     primarily the proof step "does a server Lead land in Test Events?".
 *     Guarded by CAPI_INTERNAL_SECRET via the `x-capi-secret` header ONLY —
 *     admins cannot forge arbitrary events from the dashboard.
 *  2. RETRY — POST { retryEventId } re-fires a failed/pending capi_events row
 *     from the appointment's stored attribution (same event_id → Meta dedupes).
 *     Authorized by the secret OR an allow-listed admin JWT (the dashboard's
 *     Retry button); requireAdmin validates the token itself (verify_jwt off).
 *
 * The real booking/payment paths import sendCapiEvent() directly — they do NOT
 * call this HTTP endpoint.
 *
 * Example (Test Events):
 *   curl -X POST "$SUPABASE_URL/functions/v1/capi" \
 *     -H "apikey: $ANON" -H "x-capi-secret: $CAPI_INTERNAL_SECRET" \
 *     -H "content-type: application/json" \
 *     -d '{"eventName":"Lead","email":"t@example.com","phone":"+17744467375",
 *          "fbp":"fb.1.123.456","testEventCode":"TEST12345"}'
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'
import { loadAppointmentIdentity } from '../_shared/identity.ts'
import { sendCapiEvent, type CapiEventName, type CapiInput, type Dataset } from '../_shared/meta.ts'

const round2 = (n: number) => Math.round(n * 100) / 100

/** Re-fire a capi_events row from stored appointment data (same event_id). */
async function retryEvent(eventId: string): Promise<Response> {
  const supa = admin()
  const { data: row } = await supa
    .from('capi_events')
    .select('event_id, event_name, appointment_id, status, value, is_test')
    .eq('event_id', eventId)
    .maybeSingle()
  if (!row) return json({ ok: false, error: 'event not found' }, 404)
  if (row.status === 'sent') return json({ ok: true, status: 200, deduped: true })
  if (!row.appointment_id) {
    return json({ ok: false, error: 'cannot retry: no appointment linked (manual event)' }, 422)
  }

  const loaded = await loadAppointmentIdentity(row.appointment_id as string)
  if (!loaded) return json({ ok: false, error: 'cannot retry: appointment identity missing' }, 422)

  const eventName = row.event_name as CapiEventName
  const input: CapiInput = {
    ...loaded.base,
    eventName,
    eventId: row.event_id as string,
    actionSource: eventName === 'Lead' ? 'website' : 'system_generated',
    customData: { ...loaded.utm },
    testEventCode: row.is_test || loaded.isTest ? (Deno.env.get('META_TEST_EVENT_CODE') || 'TEST') : undefined,
  }

  if (eventName === 'Purchase') {
    // Rebuild value/custom_data exactly like `result` does, from the appointment.
    const { data: appt } = await supa
      .from('appointments')
      .select('upfront_value, recurring_value, recurring_interval, plan_name')
      .eq('id', row.appointment_id)
      .maybeSingle()
    const upfront = Number(appt?.upfront_value ?? row.value) || 0
    const recurring = Number(appt?.recurring_value) || 0
    const interval = (appt?.recurring_interval as string) || 'monthly'
    const annualRecurring = interval === 'monthly' ? recurring * 12 : interval === 'annual' ? recurring : 0
    input.value = upfront
    input.currency = 'USD'
    input.customData = {
      ...loaded.utm,
      recurring_value: recurring,
      recurring_interval: interval,
      predicted_ltv: round2(upfront + annualRecurring),
      ...(appt?.plan_name ? { content_name: appt.plan_name } : {}),
    }
  }

  const result = await sendCapiEvent(input)
  return json(result, result.ok ? 200 : result.status)
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  const expected = Deno.env.get('CAPI_INTERNAL_SECRET')
  const hasSecret = Boolean(expected) && req.headers.get('x-capi-secret') === expected

  // ── retry mode: secret OR allow-listed admin JWT ─────────────────────────────
  if (typeof body.retryEventId === 'string' && body.retryEventId) {
    if (!hasSecret && !(await requireAdmin(req))) return json({ ok: false, error: 'unauthorized' }, 401)
    return retryEvent(body.retryEventId)
  }

  // ── manual send: secret only ─────────────────────────────────────────────────
  if (!hasSecret) return json({ ok: false, error: 'unauthorized' }, 401)

  const eventName = (body.eventName as CapiEventName) || 'Lead'
  if (!['Lead', 'CompleteRegistration', 'Purchase'].includes(eventName)) {
    return json({ error: 'eventName must be Lead | CompleteRegistration | Purchase' }, 400)
  }

  const result = await sendCapiEvent({
    eventName,
    eventId: (body.eventId as string) || `manual_${eventName}_${Date.now()}`,
    dataset: (body.dataset as Dataset) || 'contractor',
    email: body.email as string | undefined,
    phone: body.phone as string | undefined,
    firstName: body.firstName as string | undefined,
    lastName: body.lastName as string | undefined,
    city: body.city as string | undefined,
    state: body.state as string | undefined,
    zip: body.zip as string | undefined,
    country: body.country as string | undefined,
    fbc: body.fbc as string | undefined,
    fbp: body.fbp as string | undefined,
    fbclid: body.fbclid as string | undefined,
    value: typeof body.value === 'number' ? body.value : undefined,
    currency: body.currency as string | undefined,
    eventSourceUrl: body.eventSourceUrl as string | undefined,
    testEventCode: body.testEventCode as string | undefined,
  })

  return json(result, result.ok ? 200 : result.status)
})
