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

  const apptIdIn = pick('appointment_id', 'appt_id', 'our_appointment_id')
  const ghlContactId = pick('ghl_contact_id', 'contactId', 'contact_id')
  const email = (pick('email', 'contact_email') || '').toLowerCase()
  const supa = admin()

  // Link the message back to our customer. Priority: our appointment_id (echoed
  // by the GHL workflow) → email → most recent appointment for that contact.
  let contactId: string | undefined
  let appointmentId: string | undefined

  if (apptIdIn) {
    const { data } = await supa.from('appointments').select('id, contact_id').eq('id', apptIdIn).maybeSingle()
    const row = data as { id: string; contact_id: string } | null
    if (row) {
      appointmentId = row.id
      contactId = row.contact_id
    }
  }
  if (!contactId && email) {
    const { data: c } = await supa.from('contacts').select('id').eq('email', email).maybeSingle()
    const crow = c as { id: string } | null
    if (crow) {
      contactId = crow.id
      if (!appointmentId) {
        const { data: a } = await supa
          .from('appointments')
          .select('id')
          .eq('contact_id', crow.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        const arow = a as { id: string } | null
        if (arow) appointmentId = arow.id
      }
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
