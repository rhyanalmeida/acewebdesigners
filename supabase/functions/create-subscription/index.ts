/**
 * `create-subscription` — create a Stripe **subscription** Checkout session for
 * the self-serve restaurant "Build Your Site" funnel.
 *
 * Unlike `create-checkout` (one-time deposit tied to an appointment), this is a
 * recurring monthly plan tied to a CONTACT (the visitor configured a site in the
 * wizard and never booked a call). On completion `stripe-webhook` fires a
 * Purchase to Meta against that contact's stored attribution.
 *
 * The client sends a plan KEY ('starter' | 'pro' | 'premium'); the Stripe Price
 * ID is resolved here from Edge secrets (STRIPE_PRICE_STARTER / _PRO / _PREMIUM)
 * so no price ids ship in the bundle.
 *
 * POST { plan, contactId, email, config?, successUrl?, cancelUrl?, test? }
 *   → { url }
 */

import Stripe from 'npm:stripe@17.0.0'
import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'

const PLAN_PRICE_ENV: Record<string, string> = {
  starter: 'STRIPE_PRICE_STARTER',
  pro: 'STRIPE_PRICE_PRO',
  premium: 'STRIPE_PRICE_PREMIUM',
}

interface Body {
  plan?: string
  contactId?: string
  email?: string
  config?: Record<string, unknown> // wizard selections (restaurantName, cuisine, sections, themeId)
  successUrl?: string
  cancelUrl?: string
  test?: boolean
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const key = Deno.env.get('STRIPE_SECRET_KEY')
  if (!key) return json({ error: 'payments not configured' }, 503)

  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  const plan = (b.plan ?? '').toLowerCase()
  const priceEnv = PLAN_PRICE_ENV[plan]
  if (!priceEnv) return json({ error: 'unknown plan' }, 400)
  const priceId = Deno.env.get(priceEnv)
  if (!priceId) return json({ error: `price not configured (${priceEnv})` }, 503)
  if (!b.contactId) return json({ error: 'contactId required' }, 400)

  // Confirm the contact exists (and grab its email for prefill).
  const supa = admin()
  const { data: contact } = await supa
    .from('contacts')
    .select('id, email')
    .eq('id', b.contactId)
    .maybeSingle()
  if (!contact) return json({ error: 'contact not found' }, 404)

  const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient() })
  const origin = req.headers.get('origin') || 'https://acewebdesigners.com'

  // Stripe metadata values must be strings ≤500 chars.
  const configStr = b.config ? JSON.stringify(b.config).slice(0, 500) : ''

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: (b.email || (contact as { email?: string }).email) ?? undefined,
      client_reference_id: b.contactId,
      metadata: {
        kind: 'restaurant_subscription',
        contact_id: b.contactId,
        plan,
        is_test: b.test ? 'true' : 'false',
        config: configStr,
      },
      // Mirror metadata onto the Subscription so it's available on later invoices.
      subscription_data: {
        metadata: { kind: 'restaurant_subscription', contact_id: b.contactId, plan },
      },
      allow_promotion_codes: true,
      success_url: b.successUrl || `${origin}/buildyoursite?subscribed=1`,
      cancel_url: b.cancelUrl || `${origin}/buildyoursite?canceled=1`,
    })
    return json({ url: session.url })
  } catch (err) {
    console.error('[create-subscription] stripe error', err)
    return json({ error: 'could not create subscription checkout' }, 502)
  }
})
