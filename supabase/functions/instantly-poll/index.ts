/**
 * `instantly-poll` — server-side replacement for scripts/instantly-poll.mjs (owner,
 * 2026-11-02: "fix the trigger so the PC doesn't have to be on"). Same algorithm, same
 * helpers (_shared/instantlyEvents.ts = Deno port of scripts/lib/instantly-events.mjs):
 *
 *   1. GET /emails?email_type=received since the watermark → mapReceivedEmail
 *   2. POST /leads/list bounced + unsubscribed → mapLead
 *   3. forward every unseen event to `instantly-webhook` (same shape a real webhook sends)
 *   4. send pass: reply in-thread with the demo link for every `auto_send_pending` row,
 *      then stamp `demo_link_sent` (exactly once — nothing is stamped unless Instantly
 *      accepted the send)
 *
 * State (reply watermark + forwarded-event keys) lives in `poll_state` ('instantly'),
 * not on a PC. Trigger: pg_cron every 15 min → POST { } with header
 * x-cron-key = CAPI_INTERNAL_SECRET (scripts/cron-jobs.sql). Deployed --no-verify-jwt.
 * Manual tick: same POST from anywhere with the key. `{ dry: true }` fetches + reports
 * but forwards/sends/saves nothing.
 *
 * Secrets: INSTANTLY_API_KEY (all:read), INSTANTLY_SENDER_API_KEY (emails:all — optional;
 * without it replies are still classified/built, just not auto-sent),
 * INSTANTLY_WEBHOOK_SECRET (already set for the webhook fn). Set them ONE AT A TIME with
 * `supabase secrets set KEY=value` — never `--env-file`, never mid-build.
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import {
  advanceWatermark,
  demoLinkReply,
  mapLead,
  mapReceivedEmail,
  selectNew,
  toWebhookBody,
  trimSeen,
  type PollEvent,
} from '../_shared/instantlyEvents.ts'

const API = 'https://api.instantly.ai/api/v2'
const PAGE = 100
const MAX_PAGES = 20 // rate limit is 20 req/min on /emails
const STATE_KEY = 'instantly'

interface State {
  replies_since: string | null
  seen: string[]
}

function env(k: string): string {
  return Deno.env.get(k) ?? ''
}

async function api(pathname: string, opts: { method?: string; body?: unknown; query?: Record<string, unknown> } = {}) {
  const url = new URL(API + pathname)
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v != null) url.searchParams.set(k, String(v))
  const r = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: { authorization: `Bearer ${env('INSTANTLY_API_KEY')}`, 'content-type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!r.ok) throw new Error(`${opts.method ?? 'GET'} ${pathname} → ${r.status} ${(await r.text()).slice(0, 200)}`)
  return (await r.json()) as { items?: Record<string, unknown>[]; next_starting_after?: string }
}

async function* paginate(fetchPage: (cursor?: string) => Promise<{ items?: Record<string, unknown>[]; next_starting_after?: string }>) {
  let cursor: string | undefined
  for (let i = 0; i < MAX_PAGES; i++) {
    const d = await fetchPage(cursor)
    const items = d.items ?? []
    for (const it of items) yield it
    cursor = d.next_starting_after
    if (!cursor || items.length < PAGE) return
  }
}

async function fetchReplies(since: string | null): Promise<PollEvent[]> {
  const out: PollEvent[] = []
  for await (const item of paginate((cursor) =>
    api('/emails', {
      query: { email_type: 'received', sort_order: 'asc', limit: PAGE, min_timestamp_created: since ?? undefined, starting_after: cursor },
    }),
  )) {
    const ev = mapReceivedEmail(item)
    if (ev) out.push(ev)
  }
  return out
}

async function fetchLeads(filter: string): Promise<PollEvent[]> {
  const out: PollEvent[] = []
  for await (const item of paginate((cursor) => api('/leads/list', { method: 'POST', body: { filter, limit: PAGE, starting_after: cursor } }))) {
    const ev = mapLead(item, filter)
    if (ev) out.push(ev)
  }
  return out
}

async function postWebhook(body: unknown): Promise<string> {
  const url = `${env('SUPABASE_URL')}/functions/v1/instantly-webhook`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-instantly-secret': env('INSTANTLY_WEBHOOK_SECRET') },
    body: JSON.stringify(body),
  })
  const txt = await r.text()
  if (!r.ok) throw new Error(`webhook ${r.status} ${txt.slice(0, 120)}`)
  return txt
}

async function sendDemoLinks(dry: boolean): Promise<{ sent: number; pending: number; skipped?: string }> {
  const senderKey = env('INSTANTLY_SENDER_API_KEY')
  // With the reply desk on, demo links are queued rows released by `reply-desk` (human-looking hold).
  if (env('REPLY_DESK_ENABLED') === 'true') return { sent: 0, pending: 0, skipped: 'reply-desk owns sends' }
  if (dry || !senderKey) return { sent: 0, pending: 0, skipped: !senderKey ? 'no INSTANTLY_SENDER_API_KEY' : 'dry' }
  const { items = [] } = JSON.parse(await postWebhook({ event_type: 'auto_send_pending' })) as {
    items?: { email: string; first_name?: string | null; business_name?: string | null; demo_url: string; reply_email_id: string; reply_eaccount: string; reply_subject?: string | null }[]
  }
  let sent = 0
  for (const p of items) {
    try {
      const subject = p.reply_subject && /^re:/i.test(p.reply_subject) ? p.reply_subject : `Re: ${p.reply_subject || `${p.business_name} homepage?`}`
      const r = await fetch(`${API}/emails/reply`, {
        method: 'POST',
        headers: { authorization: `Bearer ${senderKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ reply_to_uuid: p.reply_email_id, eaccount: p.reply_eaccount, subject, body: demoLinkReply(p) }),
      })
      if (!r.ok) throw new Error(`emails/reply ${r.status} ${(await r.text()).slice(0, 160)}`)
      await postWebhook({ event_type: 'demo_link_sent', lead_email: p.email })
      sent++
      console.log(`[instantly-poll] demo link sent → ${p.email}`)
    } catch (e) {
      console.error(`[instantly-poll] demo link send failed for ${p.email}:`, e)
    }
  }
  return { sent, pending: items.length - sent }
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  const want = env('CAPI_INTERNAL_SECRET')
  if (!want || req.headers.get('x-cron-key') !== want) return json({ error: 'forbidden' }, 403)
  if (!env('INSTANTLY_API_KEY') || !env('INSTANTLY_WEBHOOK_SECRET')) return json({ error: 'not configured' }, 503)

  let dry = false
  try {
    dry = Boolean(((await req.json()) as { dry?: boolean })?.dry)
  } catch {
    /* empty body is fine */
  }

  const supa = admin()
  const { data: st } = await supa.from('poll_state').select('value').eq('key', STATE_KEY).maybeSingle()
  const state: State = { replies_since: null, seen: [], ...((st as { value?: Partial<State> } | null)?.value ?? {}) }
  const since = state.replies_since ?? new Date(Date.now() - 24 * 3600e3).toISOString()
  const seen = new Set(state.seen)

  const [replies, bounces, unsubs] = await Promise.all([fetchReplies(since), fetchLeads('FILTER_VAL_BOUNCED'), fetchLeads('FILTER_VAL_UNSUBSCRIBED')])

  // Suppressions first so a bounced address never gets a reply-alert in the same tick.
  const fresh = selectNew([...bounces, ...unsubs, ...replies], seen)
  let ok = 0
  const failed: PollEvent[] = []
  for (const ev of fresh) {
    try {
      if (!dry) await postWebhook(toWebhookBody(ev))
      ok++
    } catch (e) {
      failed.push(ev)
      console.error(`[instantly-poll] forward failed ${ev.event_type} ${ev.lead_email}:`, e)
    }
  }
  for (const ev of failed) seen.delete(ev.key) // retry next tick

  const next: State = {
    replies_since: failed.some((e) => e.event_type === 'reply') ? since : advanceWatermark(since, replies),
    seen: trimSeen(seen),
  }
  if (!dry) await supa.from('poll_state').upsert({ key: STATE_KEY, value: next, updated_at: new Date().toISOString() })

  let send: { sent: number; pending: number; skipped?: string } = { sent: 0, pending: 0 }
  try {
    send = await sendDemoLinks(dry)
  } catch (e) {
    console.error('[instantly-poll] send pass failed:', e)
  }

  const summary = {
    ok: true,
    dry,
    replies: replies.length,
    bounced: bounces.length,
    unsub: unsubs.length,
    new: fresh.length,
    forwarded: ok,
    failed: failed.length,
    links_sent: send.sent,
    links_pending: send.pending,
    ...(send.skipped ? { send_skipped: send.skipped } : {}),
    since,
    next_since: next.replies_since,
  }
  console.log('[instantly-poll]', JSON.stringify(summary))
  return json(summary)
})
