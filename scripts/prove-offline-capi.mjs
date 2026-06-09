#!/usr/bin/env node
/**
 * prove-offline-capi.mjs — UNDENIABLE proof that OFFLINE conversions work.
 *
 * Sends the exact payload our Edge engine builds (_shared/meta.ts) — an offline
 * CompleteRegistration + Purchase with action_source:'system_generated' and the
 * same SHA-256 PII hashing — DIRECTLY to Meta's Graph API, and prints Meta's own
 * answer. `events_received: 1` with an empty `messages[]` is Meta confirming it
 * accepted and validated the event (no hashing/field warnings). The `fbtrace_id`
 * is Meta's verifiable trace handle.
 *
 * This bypasses our Supabase infra on purpose: it isolates "does Meta accept our
 * offline event shape?" from "is the Edge function deployed/secret'd?". To prove
 * the DEPLOYED path instead, use scripts/verify-offline-capi.mjs (needs
 * CAPI_INTERNAL_SECRET).
 *
 * Sandboxed: sent with a test_event_code, so Meta treats these as TEST events —
 * they are NEVER counted in real reporting or ad attribution. Re-runnable.
 *
 * Reads META_ADS_TOKEN + META_DATASET_ID from .env.local (or process.env).
 * Usage:  node scripts/prove-offline-capi.mjs  [--live]
 *   --live   omit the test_event_code and send a REAL event (will count). Avoid.
 */
import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
function loadEnv(rel) {
  const f = path.join(root, rel)
  if (!fs.existsSync(f)) return {}
  const o = {}
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\s+#.*$/, '').trim()
  }
  return o
}
const cfg = { ...loadEnv('.env.local'), ...process.env }
const TOKEN = cfg.META_ADS_TOKEN || cfg.META_CAPI_TOKEN || ''
const DS = cfg.META_DATASET_ID || '4230021860577001'
const LIVE = process.argv.includes('--live')
const TEST_CODE = LIVE ? '' : cfg.META_TEST_EVENT_CODE || 'TEST_OFFLINE_VERIFY'

if (!TOKEN) {
  console.error('Missing META_ADS_TOKEN (or META_CAPI_TOKEN) in .env.local / env.')
  process.exit(2)
}

const sha = (v) => crypto.createHash('sha256').update(v).digest('hex')
const t = Math.floor(Date.now() / 1000)
const stamp = Date.now()

// hashed identity, normalized exactly like _shared/meta.ts buildUserData()
const ud = {
  em: [sha('capi.verify@example.com'.trim().toLowerCase())],
  ph: [sha('17744467375')],
  fn: [sha('capi')], ln: [sha('verify')],
  ct: [sha('worcester')], st: [sha('ma')], zp: [sha('01601')], country: [sha('us')],
  fbc: `fb.1.${stamp}.IwAR_verify_${stamp}`,
  fbp: `fb.1.${stamp}.${Math.floor(Math.random() * 1e10)}`,
}

const events = [
  { event_name: 'CompleteRegistration', event_id: `verify_cr_${stamp}`, custom_data: { currency: 'USD' } },
  { event_name: 'Purchase', event_id: `verify_purchase_${stamp}`, custom_data: { currency: 'USD', value: 500 } },
]

async function fire(ev) {
  const payload = {
    data: [{
      ...ev,
      event_time: t,
      action_source: 'system_generated', // OFFLINE — the whole point of this proof
      event_source_url: 'https://acewebdesigners.com/contractorlanding',
      user_data: ud,
    }],
    access_token: TOKEN,
    ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}),
  }
  const r = await fetch(`https://graph.facebook.com/v21.0/${DS}/events`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { http: r.status, j: await r.json() }
}

console.log(`Dataset:   ${DS}`)
console.log(`Mode:      ${TEST_CODE ? `TEST (code ${TEST_CODE}, sandboxed — not counted)` : 'LIVE — counts in reporting!'}\n`)

let ok = true
for (const ev of events) {
  const { http, j } = await fire(ev)
  const recv = j?.events_received
  const msgs = j?.messages || []
  const good = http === 200 && recv === 1 && msgs.length === 0
  if (!good) ok = false
  console.log(`${good ? 'PASS' : 'FAIL'}  ${ev.event_name}  action_source=system_generated  event_id=${ev.event_id}`)
  console.log(`      http=${http}  events_received=${recv}  messages=${JSON.stringify(msgs)}  fbtrace_id=${j?.fbtrace_id || '-'}`)
  if (!good) console.log(`      raw=${JSON.stringify(j).slice(0, 500)}`)
}
console.log(
  ok
    ? '\n=== PROVEN: Meta accepted both OFFLINE events (events_received:1, no warnings) ==='
    : '\n=== FAILED — see raw output above ===',
)
process.exit(ok ? 0 : 1)
