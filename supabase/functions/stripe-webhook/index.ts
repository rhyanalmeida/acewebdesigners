/**
 * `stripe-webhook` — Stripe Checkout completion → Purchase CAPI.
 *
 * Verifies the Stripe signature, marks the appointment purchased, and fires a
 * Purchase to Meta reusing the lead's stored attribution. Uses event_id
 * `purchase_<appt>`, so it dedupes against a manual result-form Purchase.
 *
 * Configure in Stripe → Developers → Webhooks → endpoint
 *   $SUPABASE_URL/functions/v1/stripe-webhook   (event: checkout.session.completed)
 */

import Stripe from 'npm:stripe@17.0.0'
import { admin } from '../_shared/supabaseAdmin.ts'
import { sendCapiEvent } from '../_shared/meta.ts'
import { loadAppointmentIdentity } from '../_shared/identity.ts'

const reply = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405)
  const key = Deno.env.get('STRIPE_SECRET_KEY')
  const whSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!key || !whSecret) return reply({ error: 'not configured' }, 503)

  const sig = req.headers.get('stripe-signature') ?? ''
  const raw = await req.text()
  const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whSecret, undefined, Stripe.createSubtleCryptoProvider())
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', err)
    return reply({ error: 'bad signature' }, 400)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const appointmentId = session.metadata?.appointment_id || session.client_reference_id || ''
    const amount = (session.amount_total ?? 0) / 100
    const currency = (session.currency || 'usd').toUpperCase()

    if (appointmentId) {
      const supa = admin()
      await supa
        .from('appointments')
        .update({ purchased_at: new Date().toISOString(), value: amount, upfront_value: amount, status: 'showed' })
        .eq('id', appointmentId)

      const loaded = await loadAppointmentIdentity(appointmentId)
      if (loaded) {
        await sendCapiEvent({
          ...loaded.base,
          eventName: 'Purchase',
          eventId: `purchase_${appointmentId}`,
          actionSource: 'website',
          value: amount,
          currency,
          customData: { ...loaded.utm, stripe_session: session.id },
        })
      }
    }
  }

  return reply({ received: true })
})
