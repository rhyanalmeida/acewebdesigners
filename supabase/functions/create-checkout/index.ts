/**
 * `create-checkout` — create a Stripe Checkout session for an upfront deposit.
 *
 * Optional path to actually collect money (the result form can also record a
 * Purchase manually). Returns a hosted Checkout URL; the matching Purchase CAPI
 * fires from `stripe-webhook` on completion. No-ops (503) until Stripe is set up.
 *
 * POST { appointmentId, amount, currency?, description?, successUrl?, cancelUrl? }
 *   → { url }
 */

import Stripe from 'npm:stripe@17.0.0'
import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { sendGhlSms } from '../_shared/ghl.ts'

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const key = Deno.env.get('STRIPE_SECRET_KEY')
  if (!key) return json({ error: 'payments not configured' }, 503)

  let b: {
    appointmentId?: string
    amount?: number
    currency?: string
    description?: string
    successUrl?: string
    cancelUrl?: string
    /** When true, auto-text the link to the contact via GHL (no copy-paste). */
    send?: boolean
  }
  try {
    b = await req.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }
  if (!b.appointmentId || !(Number(b.amount) > 0)) {
    return json({ error: 'appointmentId and a positive amount are required' }, 400)
  }

  const { data: appt } = await admin()
    .from('appointments')
    .select('id, contacts:contact_id ( first_name, email, phone )')
    .eq('id', b.appointmentId)
    .maybeSingle()
  if (!appt) return json({ error: 'appointment not found' }, 404)
  const contact = (appt as { contacts?: { first_name?: string; email?: string; phone?: string } }).contacts

  const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() })
  const origin = req.headers.get('origin') || 'https://acewebdesigners.com'
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: (b.currency || 'usd').toLowerCase(),
            product_data: { name: b.description || 'Deposit — Ace Web Designers' },
            unit_amount: Math.round(Number(b.amount) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { appointment_id: b.appointmentId },
      client_reference_id: b.appointmentId,
      success_url: b.successUrl || `${origin}/?paid=1`,
      cancel_url: b.cancelUrl || `${origin}/?canceled=1`,
    })

    // Optional: auto-text the link to the client via GHL (no copy-paste).
    let sent = false
    let sendError: string | undefined
    if (b.send && session.url) {
      if (!contact?.phone && !contact?.email) {
        sendError = 'no phone or email on file'
      } else {
        const hi = contact?.first_name ? `Hi ${contact.first_name}, ` : 'Hi, '
        const message = `${hi}here's your secure payment link from Ace Web Designers: ${session.url}`
        const res = await sendGhlSms({ email: contact?.email, phone: contact?.phone, message })
        sent = res.sent
        sendError = res.error
      }
    }

    return json({ url: session.url, sent, sendError })
  } catch (err) {
    console.error('[create-checkout] stripe error', err)
    return json({ error: 'could not create checkout session' }, 502)
  }
})
