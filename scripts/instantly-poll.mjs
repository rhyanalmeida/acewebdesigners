// Poll Instantly.ai (v2 API) for replies / bounces / unsubscribes and replay them
// into the `instantly-webhook` Edge Function.
//
//   node scripts/instantly-poll.mjs            # normal tick (state + log updated)
//   node scripts/instantly-poll.mjs --dry      # fetch + print, POST nothing, save nothing
//   node scripts/instantly-poll.mjs --since 2026-09-01T00:00:00Z   # override reply watermark
//
// WHY THIS EXISTS: Instantly gates webhooks to the Hyper Growth plan ($97/mo). We are
// on Growth ($47) which includes the API, so a Windows scheduled task ("Instantly Poll",
// every 15 min) runs this instead. The Edge Function is unchanged and idempotent —
// a real webhook can replace this script later with zero server changes.
//
// Reads INSTANTLY_API_KEY (scope all:read) + INSTANTLY_WEBHOOK_SECRET from supabase/.env.
// State: %LOCALAPPDATA%\instantly-poll.json  (reply watermark + forwarded-event keys)
// Log:   %LOCALAPPDATA%\instantly-poll.log   (one line per tick, trimmed to 200 lines)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  mapReceivedEmail,
  mapLead,
  selectNew,
  advanceWatermark,
  trimSeen,
  toWebhookBody,
  demoLinkReply,
} from './lib/instantly-events.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://api.instantly.ai/api/v2'
const WEBHOOK = 'https://dwsmrruzufqpopdzlszw.supabase.co/functions/v1/instantly-webhook'
const STATE_DIR = process.env.LOCALAPPDATA || process.env.HOME || ROOT
const STATE_PATH = path.join(STATE_DIR, 'instantly-poll.json')
const LOG_PATH = path.join(STATE_DIR, 'instantly-poll.log')
const PAGE = 100
const MAX_PAGES = 20 // hard cap per source per tick (rate limit is 20 req/min on /emails)

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const sinceIdx = args.indexOf('--since')
const SINCE_OVERRIDE = sinceIdx >= 0 ? args[sinceIdx + 1] : undefined

function loadDotEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const env = { ...loadDotEnv(path.join(ROOT, 'supabase', '.env')), ...process.env }
const API_KEY = env.INSTANTLY_API_KEY
const SECRET = env.INSTANTLY_WEBHOOK_SECRET
// emails:all key — sends the demo-link reply once a "yes" prospect's site is deployed.
// Optional: without it replies are still classified/built, just not auto-sent.
const SENDER_KEY = env.INSTANTLY_SENDER_API_KEY
if (!API_KEY) die('INSTANTLY_API_KEY missing (supabase/.env)')
if (!SECRET && !DRY) die('INSTANTLY_WEBHOOK_SECRET missing (supabase/.env)')

function die(msg) {
  log(`FAIL ${msg}`)
  console.error(msg)
  process.exit(1)
}

function log(line) {
  const entry = `${new Date().toISOString()} ${line}`
  console.log(entry)
  if (DRY) return
  try {
    fs.appendFileSync(LOG_PATH, entry + '\n')
    const lines = fs.readFileSync(LOG_PATH, 'utf8').split('\n').filter(Boolean)
    if (lines.length > 200) fs.writeFileSync(LOG_PATH, lines.slice(-200).join('\n') + '\n')
  } catch {
    /* logging must never break the poll */
  }
}

function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))
    return { replies_since: s.replies_since ?? null, seen: Array.isArray(s.seen) ? s.seen : [] }
  } catch {
    return { replies_since: null, seen: [] }
  }
}

function saveState(state) {
  if (DRY) return
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
}

async function api(pathname, { method = 'GET', body, query } = {}) {
  const url = new URL(API + pathname)
  for (const [k, v] of Object.entries(query ?? {})) if (v != null) url.searchParams.set(k, String(v))
  const r = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) throw new Error(`${method} ${pathname} → ${r.status} ${(await r.text()).slice(0, 200)}`)
  return r.json()
}

/** Paginate a list endpoint; Instantly returns { items, next_starting_after }. */
async function* paginate(fetchPage) {
  let cursor
  for (let i = 0; i < MAX_PAGES; i++) {
    const d = await fetchPage(cursor)
    const items = d.items ?? []
    for (const it of items) yield it
    cursor = d.next_starting_after
    if (!cursor || items.length < PAGE) return
  }
}

async function fetchReplies(since) {
  const events = []
  for await (const item of paginate((cursor) =>
    api('/emails', {
      query: {
        email_type: 'received',
        sort_order: 'asc',
        limit: PAGE,
        min_timestamp_created: since ?? undefined,
        starting_after: cursor,
      },
    }),
  )) {
    const ev = mapReceivedEmail(item)
    if (ev) events.push(ev)
  }
  return events
}

async function fetchLeads(filter) {
  const events = []
  for await (const item of paginate((cursor) =>
    api('/leads/list', { method: 'POST', body: { filter, limit: PAGE, starting_after: cursor } }),
  )) {
    const ev = mapLead(item, filter)
    if (ev) events.push(ev)
  }
  return events
}

async function postWebhook(body) {
  const r = await fetch(`${WEBHOOK}?secret=${encodeURIComponent(SECRET)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const txt = await r.text()
  if (!r.ok) throw new Error(`webhook ${r.status} ${txt.slice(0, 120)}`)
  return txt
}

async function forward(ev) {
  if (DRY) return 'dry'
  return (await postWebhook(toWebhookBody(ev))).slice(0, 120)
}

/**
 * Send pass: for every "yes" prospect whose demo is now deployed and whose link has not
 * gone out, reply in the original thread from the inbox that received the reply, then
 * stamp demo_link_sent_at via the webhook so it is sent exactly once. Failures are
 * logged and retried next tick (nothing is stamped unless Instantly accepted the send).
 */
async function sendDemoLinks() {
  if (DRY || !SENDER_KEY) return { sent: 0, pending: 0, skipped: !SENDER_KEY ? 'no INSTANTLY_SENDER_API_KEY' : 'dry' }
  const { items = [] } = JSON.parse(await postWebhook({ event_type: 'auto_send_pending' }))
  let sent = 0
  for (const p of items) {
    try {
      const subject = p.reply_subject && /^re:/i.test(p.reply_subject) ? p.reply_subject : `Re: ${p.reply_subject || `${p.business_name} homepage?`}`
      const r = await fetch(`${API}/emails/reply`, {
        method: 'POST',
        headers: { authorization: `Bearer ${SENDER_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ reply_to_uuid: p.reply_email_id, eaccount: p.reply_eaccount, subject, body: demoLinkReply(p) }),
      })
      if (!r.ok) throw new Error(`emails/reply ${r.status} ${(await r.text()).slice(0, 160)}`)
      await postWebhook({ event_type: 'demo_link_sent', lead_email: p.email })
      sent++
      console.log(`  ✉ demo link sent → ${p.email} (${p.demo_url})`)
    } catch (e) {
      console.error(`  ✗ demo link send failed for ${p.email}: ${e.message}`)
    }
  }
  return { sent, pending: items.length - sent }
}

async function main() {
  const state = loadState()
  const since = SINCE_OVERRIDE ?? state.replies_since ?? new Date(Date.now() - 24 * 3600e3).toISOString()
  const seen = new Set(state.seen)

  const [replies, bounces, unsubs] = await Promise.all([
    fetchReplies(since),
    fetchLeads('FILTER_VAL_BOUNCED'),
    fetchLeads('FILTER_VAL_UNSUBSCRIBED'),
  ])

  // Suppressions first so a bounced address never gets a reply-alert in the same tick.
  const fresh = selectNew([...bounces, ...unsubs, ...replies], seen)
  let ok = 0
  const failed = []
  for (const ev of fresh) {
    try {
      const res = await forward(ev)
      ok++
      console.log(`  → ${ev.event_type} ${ev.lead_email} ${res}`)
    } catch (e) {
      failed.push(ev)
      console.error(`  ✗ ${ev.event_type} ${ev.lead_email}: ${e.message}`)
    }
  }
  // Un-see anything that failed so the next tick retries it.
  for (const ev of failed) seen.delete(ev.key)

  const next = {
    replies_since: failed.some((e) => e.event_type === 'reply') ? since : advanceWatermark(since, replies),
    seen: trimSeen(seen),
  }
  saveState(next)

  let send = { sent: 0, pending: 0 }
  try {
    send = await sendDemoLinks()
  } catch (e) {
    console.error(`  ✗ send pass: ${e.message}`)
  }
  log(
    `OK${DRY ? ' (dry)' : ''} seen replies=${replies.length} bounced=${bounces.length} unsub=${unsubs.length} ` +
      `new=${fresh.length} forwarded=${ok} failed=${failed.length} links_sent=${send.sent} links_pending=${send.pending}` +
      `${send.skipped ? ` (send skipped: ${send.skipped})` : ''} since=${since} → ${next.replies_since}`,
  )
  if (failed.length) process.exitCode = 2
}

main().catch((e) => die(e.message))
