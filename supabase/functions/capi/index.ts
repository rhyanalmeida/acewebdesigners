/**
 * `capi` — internal/manual Conversions API endpoint.
 *
 * Wraps _shared/meta.ts so you can fire a single CAPI event by hand — primarily
 * the verification step "does a server Lead land in Test Events?". Guarded by a
 * shared secret (CAPI_INTERNAL_SECRET) via the `x-capi-secret` header, so it
 * can't be POSTed by the public even though verify_jwt is off.
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
import { sendCapiEvent, type CapiEventName, type Dataset } from '../_shared/meta.ts'

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const expected = Deno.env.get('CAPI_INTERNAL_SECRET')
  if (!expected || req.headers.get('x-capi-secret') !== expected) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

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
