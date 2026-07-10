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
import { loadAppointmentIdentity, loadContactIdentity } from '../_shared/identity.ts'
import { ghlSyncStage } from '../_shared/ghl.ts'

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
    const amount = (session.amount_total ?? 0) / 100
    const currency = (session.currency || 'usd').toUpperCase()

    // ── Restaurant self-serve subscription (no appointment) ──────────────────
    // Tied to a contact via metadata; fire Purchase from the contact's stored
    // attribution. Dedup key is the subscription id so renewals can't re-fire.
    if (session.mode === 'subscription' || session.metadata?.kind === 'restaurant_subscription') {
      const contactId = session.metadata?.contact_id || session.client_reference_id || ''
      const subId = typeof session.subscription === 'string' ? session.subscription : session.id
      const plan = session.metadata?.plan || ''
      const isTest = session.metadata?.is_test === 'true'
      if (contactId) {
        const loaded = await loadContactIdentity(contactId)
        if (loaded) {
          await sendCapiEvent({
            ...loaded.base,
            dataset: 'restaurant', // isolated funnel → restaurant dataset, not main
            eventName: 'Purchase',
            eventId: `purchase_sub_${subId}`,
            actionSource: 'system_generated', // payment closed via Stripe, off the page
            value: amount,
            currency,
            customData: { ...loaded.utm, plan, stripe_session: session.id, subscription: subId },
            // Test subscriptions route to Meta Test Events only — never counted live.
            testEventCode: isTest ? (Deno.env.get('META_TEST_EVENT_CODE') || 'TEST') : undefined,
          })

          // GHL: funnel-purchased → onboarding workflow (restaurant GHL account).
          // Skipped for test subscriptions, exactly like the contractor flow.
          if (!isTest) try {
            await ghlSyncStage({
              stage: 'purchased',
              funnel: 'restaurant',
              email: loaded.base.email,
              phone: loaded.base.phone,
              firstName: loaded.base.firstName,
              lastName: loaded.base.lastName,
              city: loaded.base.city,
              state: loaded.base.state,
              zip: loaded.base.zip,
              country: loaded.base.country,
              attribution: {
                fbc: loaded.base.fbc,
                fbp: loaded.base.fbp,
                fbclid: loaded.base.fbclid,
                clientIp: loaded.base.clientIpAddress,
                clientUserAgent: loaded.base.clientUserAgent,
                utm: loaded.utm,
                dealValue: amount,
              },
            })
          } catch (err) {
            console.error('[stripe-webhook] ghl subscription sync failed', err)
          }
        } else {
          console.error('[stripe-webhook] subscription contact identity load failed', contactId)
        }
      }
      return reply({ received: true })
    }

    const appointmentId = session.metadata?.appointment_id || session.client_reference_id || ''

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
          actionSource: 'system_generated', // offline: payment closed via CRM/Stripe
          value: amount,
          currency,
          customData: { ...loaded.utm, stripe_session: session.id },
          // Test bookings stay test-coded end-to-end.
          testEventCode: loaded.isTest ? (Deno.env.get('META_TEST_EVENT_CODE') || 'TEST') : undefined,
        })

        // GHL: funnel-purchased tag (idempotent with the result-form Purchase;
        // tags don't double-apply). Skipped for test bookings.
        if (!loaded.isTest) try {
          await ghlSyncStage({
            stage: 'purchased',
            email: loaded.base.email,
            phone: loaded.base.phone,
            firstName: loaded.base.firstName,
            lastName: loaded.base.lastName,
            city: loaded.base.city,
            state: loaded.base.state,
            zip: loaded.base.zip,
            country: loaded.base.country,
            attribution: {
              fbc: loaded.base.fbc,
              fbp: loaded.base.fbp,
              fbclid: loaded.base.fbclid,
              clientIp: loaded.base.clientIpAddress,
              clientUserAgent: loaded.base.clientUserAgent,
              utm: loaded.utm,
              dealValue: amount,
            },
          })
        } catch (err) {
          console.error('[stripe-webhook] ghl purchased sync failed', err)
        }
      } else {
        // No identity → no event fired. Record the failure so the admin
        // dashboard surfaces it instead of losing the conversion silently.
        console.error('[stripe-webhook] identity load failed — recording error row', appointmentId)
        const errRow = {
          event_id: `purchase_${appointmentId}`,
          event_name: 'Purchase',
          action_source: 'system_generated',
          appointment_id: appointmentId,
          value: amount,
          status: 'error',
          meta_response: { error: 'identity load failed (appointment/contact missing)', stripe_session: session.id },
        }
        const { error: insErr } = await supa.from('capi_events').insert(errRow)
        // 23503: appointment row truly missing → keep the audit row without the FK.
        // 23505: already claimed → leave the existing row alone.
        if (insErr && (insErr as { code?: string }).code === '23503') {
          await supa.from('capi_events').insert({ ...errRow, appointment_id: null })
        }
      }
    }
  }

  return reply({ received: true })
})
