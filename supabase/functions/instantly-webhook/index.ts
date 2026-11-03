/**
 * `instantly-webhook` — inbound events from Instantly.ai, the cold-email sender
 * for the outbound demo-site funnel. (Cold sends deliberately do NOT go through
 * GHL — LC Email bans scraped lists and a block would take down booking
 * comms. Instantly sends; only warm signals flow into GHL from here.)
 *
 * Fed by scripts/instantly-poll.mjs (Instantly webhooks are Hyper-Growth-only), URL:
 *   $SUPABASE_URL/functions/v1/instantly-webhook?secret=$INSTANTLY_WEBHOOK_SECRET
 * (query param because Instantly can't always set custom headers; the
 * x-instantly-secret header also works.)
 *
 * Handled event types (Instantly names vary by version — matched loosely):
 *   reply / interested   → prospects.replied_at + last_reply; hard rules (remove/hostile/no →
 *                          suppress, no alert). With REPLY_DESK_ENABLED=true the reply is logged to
 *                          outbound_replies and `reply-desk classify` decides (AI answer / hand-off).
 *                          Desk off: legacy — prospects.replied_at + last_reply (+ classification) + GHL
 *                          outbound-lead tag. A clear "yes" (replyClassifier.ts) also
 *                          fires the ONE demo build (same atomic none→generating gate
 *                          as demo-site) and marks the row auto_send — fully automated
 *                          reply → build → send-link loop (owner decision 2026-09-22).
 *   bounce               → suppress (reason 'bounce') + suppressions upsert
 *   unsubscribe          → suppress (reason 'unsubscribe') + suppressions upsert
 *   auto_send_pending    → (poller) list rows whose demo is deployed and link unsent
 *   demo_link_sent       → (poller) stamp demo_link_sent_at after the reply went out
 * Everything else is logged and acknowledged. Always 200 (after auth) so
 * Instantly never retry-storms us.
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { ghlSyncStage } from '../_shared/ghl.ts'
import { classifyReply, isTerminal } from '../_shared/replyClassifier.ts'

interface InstantlyEvent {
  event_type?: string
  eventType?: string
  lead_email?: string
  email?: string
  campaign_id?: string
  campaignId?: string
  reply_text?: string
  email_id?: string
  eaccount?: string
  subject?: string
  [k: string]: unknown
}

const SITE = 'https://acewebdesigners.com'

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
  const supa = admin()

  // ── Poller-facing actions (no lead email) ──────────────────────────────────
  if (type === 'auto_send_pending') {
    const { data } = await supa
      .from('prospects')
      .select('id, token, email, first_name, business_name, reply_email_id, reply_eaccount, reply_subject, preview_url')
      .eq('auto_send', true)
      .eq('site_status', 'deployed')
      .eq('suppressed', false)
      .is('demo_link_sent_at', null)
      .not('reply_email_id', 'is', null)
      .limit(20)
    const items = (data ?? []).map((p) => ({ ...p, demo_url: `${SITE}/demo/${p.token}`, token: undefined }))
    return json({ items })
  }
  if (type === 'demo_link_sent') {
    const email = String(ev.lead_email ?? ev.email ?? '').trim().toLowerCase()
    if (!email) return json({ received: true, skipped: 'no email' })
    await supa
      .from('prospects')
      .update({ demo_link_sent_at: new Date().toISOString() })
      .ilike('email', email)
      .is('demo_link_sent_at', null)
    return json({ received: true })
  }

  const email = String(ev.lead_email ?? ev.email ?? '').trim().toLowerCase()
  if (!email) return json({ received: true, skipped: 'no email' })

  const { data } = await supa
    .from('prospects')
    .select('id, token, is_test, suppressed, email, phone, first_name, last_name, business_name, business_type, city, state, replied_at, site_status')
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
        site_status: string | null
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

  /** Same one-build gate as demo-site: only the flip none→generating starts a build. */
  const startBuild = async (prospectId: string) => {
    const { data: won } = await supa
      .from('prospects')
      .update({ site_status: 'generating', site_error: null })
      .eq('id', prospectId)
      .eq('site_status', 'none')
      .select('id')
      .maybeSingle()
    if (!won) return false
    const task = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-site`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-key': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! },
      body: JSON.stringify({ prospectId }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const msg = `build start failed (${r.status}) ${(await r.text()).slice(0, 150)}`
          console.error('[instantly-webhook]', msg, prospectId)
          await supa.from('prospects').update({ site_status: 'failed', site_error: msg }).eq('id', prospectId)
        } else await r.body?.cancel()
      })
      .catch(async (err) => {
        await supa.from('prospects').update({ site_status: 'failed', site_error: String(err).slice(0, 280) }).eq('id', prospectId)
      })
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) EdgeRuntime.waitUntil(task)
    else await task
    return true
  }

  if (type.includes('bounce')) {
    await suppress('bounce')
  } else if (type.includes('unsub')) {
    await suppress('unsubscribe')
  } else if (type.includes('reply') || type.includes('interest')) {
    if (p) {
      const text = typeof ev.reply_text === 'string' ? ev.reply_text : ''
      const rule = text ? classifyReply(text) : 'unknown'
      const now = new Date().toISOString()
      const emailId = typeof ev.email_id === 'string' ? ev.email_id : null
      const eaccount = typeof ev.eaccount === 'string' ? ev.eaccount : null
      const subject = typeof ev.subject === 'string' ? ev.subject.slice(0, 200) : null
      await supa
        .from('prospects')
        .update({
          ...(p.replied_at ? {} : { replied_at: now }),
          ...(text ? { last_reply: text.slice(0, 2000), last_reply_at: now, reply_sentiment: rule, reply_email_id: emailId, reply_eaccount: eaccount, reply_subject: subject } : {}),
        })
        .eq('id', p.id)

      // Hard rules apply with or without the desk: remove/hostile/no = suppress, no build, no alert.
      if (isTerminal(rule)) {
        const reason = rule === 'hostile' ? 'hostile' : rule === 'remove' ? 'unsubscribe' : 'declined'
        await supa.from('suppressions').upsert({ email, reason }, { onConflict: 'email' })
        await supa.from('prospects').update({ suppressed: true, suppressed_reason: reason }).eq('id', p.id)
        if (emailId) await supa.from('outbound_replies').upsert({ prospect_id: p.id, direction: 'in', instantly_email_id: emailId, eaccount, subject, body: text.slice(0, 4000), intent: rule, status: 'suppressed', reason }, { onConflict: 'instantly_email_id', ignoreDuplicates: true })
        console.log(`[instantly-webhook] reply ${email} ${rule} → suppressed, no alert`)
        return json({ received: true, sentiment: rule, suppressed: true })
      }
      if (rule === 'ooo_auto') return json({ received: true, sentiment: rule, ignored: true })

      // ── Reply desk on: log the inbound row and let `reply-desk classify` decide ──
      if (Deno.env.get('REPLY_DESK_ENABLED') === 'true' && text) {
        const { data: row } = await supa
          .from('outbound_replies')
          .upsert({ prospect_id: p.id, direction: 'in', instantly_email_id: emailId ?? `${email}:${now}`, eaccount, subject, body: text.slice(0, 4000), status: 'queued' }, { onConflict: 'instantly_email_id', ignoreDuplicates: true })
          .select('id')
          .maybeSingle()
        if (row) {
          const task = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/reply-desk`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-internal-key': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! },
            body: JSON.stringify({ action: 'classify', replyId: (row as { id: string }).id }),
          })
            .then(async (r) => {
              if (!r.ok) console.error('[instantly-webhook] reply-desk classify', r.status, (await r.text()).slice(0, 150))
              else await r.body?.cancel()
            })
            .catch((e) => console.error('[instantly-webhook] reply-desk unreachable', e))
          if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) EdgeRuntime.waitUntil(task)
          else await task
        }
        console.log(`[instantly-webhook] reply ${email} rule=${rule} → reply-desk ${row ? 'queued' : 'duplicate'}`)
        return json({ received: true, sentiment: rule, desk: Boolean(row) })
      }

      // ── Legacy path (desk off): a clear "yes" builds + the poller sends the link ──
      const sentiment = rule
      const autoSend = sentiment === 'yes' && !p.is_test && !p.suppressed
      if (autoSend) await supa.from('prospects').update({ auto_send: true }).eq('id', p.id)
      let started = false
      if (autoSend && p.site_status === 'none') started = await startBuild(p.id)
      console.log(`[instantly-webhook] reply ${email} sentiment=${sentiment} auto_send=${autoSend} build_started=${started}`)

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
            preview_url: `${SITE}/demo/${p.token}`,
          },
        })
        if (ghlId) await supa.from('prospects').update({ ghl_contact_id: ghlId }).eq('id', p.id)
      }
      return json({ received: true, sentiment, auto_send: autoSend, build_started: started })
    } else {
      console.log(`[instantly-webhook] reply from unknown email ${email}`)
    }
  } else {
    console.log(`[instantly-webhook] unhandled event type "${type}" for ${email}`)
  }

  return json({ received: true })
})
