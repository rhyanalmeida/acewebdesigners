/**
 * `ghl-webhook` — visibility into the kept GHL messaging workflow.
 *
 * Add a "Webhook" action to your GHL workflow (alongside each send) pointing
 * here. Each call is logged to ghl_messages and shown in the admin dashboard,
 * so you can confirm confirmation/reminder messages are actually firing.
 *
 * Guarded by GHL_WEBHOOK_SECRET (header `x-ghl-secret` or body `secret`). Always
 * returns 200 so it never blocks the GHL workflow (fail-open logging).
 *
 * Suggested GHL custom data: { secret, channel, message_type, status,
 * contact_id (GHL contact id) }. We also stash the whole body in `detail`.
 */

import { admin } from '../_shared/supabaseAdmin.ts'

const ok = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return ok({ ok: true })
  if (req.method !== 'POST') return ok({ ok: true })

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return ok({ ok: true })
  }

  const expected = Deno.env.get('GHL_WEBHOOK_SECRET')
  if (expected) {
    const headerSecret = req.headers.get('x-ghl-secret') ?? ''
    const bodySecret = String((body as { secret?: unknown }).secret ?? '')
    if (headerSecret !== expected && bodySecret !== expected) {
      console.warn('[ghl-webhook] bad secret')
      return ok({ ok: true }) // fail-open: don't reveal, don't block
    }
  }

  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = (body as Record<string, unknown>)[k]
      if (v !== undefined && v !== null && v !== '') return String(v)
    }
    return undefined
  }

  const ghlContactId = pick('contact_id', 'contactId', 'ghl_contact_id')
  const supa = admin()

  // Best-effort: map back to our appointment/contact via the stored GHL contact id.
  let contactId: string | undefined
  let appointmentId: string | undefined
  if (ghlContactId) {
    const { data } = await supa
      .from('appointments')
      .select('id, contact_id')
      .eq('ghl_contact_id', ghlContactId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const row = data as { id: string; contact_id: string } | null
    if (row) {
      appointmentId = row.id
      contactId = row.contact_id
    }
  }

  try {
    await supa.from('ghl_messages').insert({
      ghl_contact_id: ghlContactId ?? null,
      contact_id: contactId ?? null,
      appointment_id: appointmentId ?? null,
      channel: pick('channel', 'type') ?? null,
      message_type: pick('message_type', 'messageType', 'workflow', 'event') ?? null,
      status: pick('status', 'delivery_status') ?? 'sent',
      detail: body,
    })
  } catch (err) {
    console.error('[ghl-webhook] insert failed', err)
  }

  return ok({ ok: true })
})
