/**
 * `instantly-webhook` — inbound events from Instantly.ai, the cold-email sender
 * for the outbound demo-site funnel. (Cold sends deliberately do NOT go through
 * GHL — LC Email bans scraped lists and a block would take down booking
 * comms. Instantly sends; only warm signals flow into GHL from here.)
 *
 * Configure in Instantly → campaign → integrations/webhooks, URL:
 *   $SUPABASE_URL/functions/v1/instantly-webhook?secret=$INSTANTLY_WEBHOOK_SECRET
 * (query param because Instantly can't always set custom headers; the
 * x-instantly-secret header also works.)
 *
 * Handled event types (Instantly names vary by version — matched loosely):
 *   reply / interested   → prospects.replied_at + GHL outbound-lead tag
 *   bounce               → suppress (reason 'bounce') + suppressions upsert
 *   unsubscribe          → suppress (reason 'unsubscribe') + suppressions upsert
 * Everything else is logged and acknowledged. Always 200 (after auth) so
 * Instantly never retry-storms us.
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { ghlSyncStage } from '../_shared/ghl.ts'

interface InstantlyEvent {
  event_type?: string
  eventType?: string
  lead_email?: string
  email?: string
  campaign_id?: string
  campaignId?: string
  [k: string]: unknown
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const secret = Deno.env.get('INSTANTLY_WEBHOOK_SECRET')
  if (!secret) return json({ error: 'not configured' }, 503)
  const given =
    req.headers.get('x-instantly-secret') ?? new URL(req.url).searchParams.get('secret') ?? ''
  if (given !== secret) return json({ error: 'unauthorized' }, 401)

  let ev: InstantlyEvent
  try {
    ev = (await req.json()) as InstantlyEvent
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  const type = String(ev.event_type ?? ev.eventType ?? '').toLowerCase()
  const email = String(ev.lead_email ?? ev.email ?? '').trim().toLowerCase()
  if (!email) return json({ received: true, skipped: 'no email' })

  const supa = admin()
  const { data } = await supa
    .from('prospects')
    .select('id, token, is_test, suppressed, email, phone, first_name, last_name, business_name, business_type, city, state, replied_at')
    .ilike('email', email)
    .maybeSingle()
  const p = data as
    | {
        id: string
        token: string
        is_test: boolean
        suppressed: boolean
        email: string | null
        phone: string | null
        first_name: string | null
        last_name: string | null
        business_name: string
        business_type: string | null
        city: string | null
        state: string | null
        replied_at: string | null
      }
    | null

  const suppress = async (reason: 'bounce' | 'unsubscribe') => {
    await supa.from('suppressions').upsert({ email, reason }, { onConflict: 'email' })
    if (p) {
      await supa
        .from('prospects')
        .update({ suppressed: true, suppressed_reason: reason })
        .eq('id', p.id)
    }
    console.log(`[instantly-webhook] suppressed ${email} (${reason})`)
  }

  if (type.includes('bounce')) {
    await suppress('bounce')
  } else if (type.includes('unsub')) {
    await suppress('unsubscribe')
  } else if (type.includes('reply') || type.includes('interest')) {
    if (p) {
      if (!p.replied_at) {
        await supa.from('prospects').update({ replied_at: new Date().toISOString() }).eq('id', p.id)
      }
      // Tag is additive + idempotent in GHL — a second reply won't re-trigger workflows.
      if (!p.is_test) {
        const ghlId = await ghlSyncStage({
          stage: 'lead',
          funnel: 'outbound',
          email: p.email ?? email,
          phone: p.phone ?? undefined,
          firstName: p.first_name ?? undefined,
          lastName: p.last_name ?? undefined,
          businessName: p.business_name,
          city: p.city ?? undefined,
          state: p.state ?? undefined,
          qualifiers: {
            business_type: p.business_type ?? undefined,
            preview_url: `https://acewebdesigners.com/demo/${p.token}`,
          },
        })
        if (ghlId) await supa.from('prospects').update({ ghl_contact_id: ghlId }).eq('id', p.id)
      }
    } else {
      console.log(`[instantly-webhook] reply from unknown email ${email}`)
    }
  } else {
    console.log(`[instantly-webhook] unhandled event type "${type}" for ${email}`)
  }

  return json({ received: true })
})
