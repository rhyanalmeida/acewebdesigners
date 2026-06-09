#!/usr/bin/env node
/**
 * verify-offline-capi.mjs — prove the OFFLINE conversions work end-to-end.
 *
 * CompleteRegistration (Showed) and Purchase (closed) go to Meta as
 * action_source:'system_generated', so they don't stream into the Test Events
 * tab the way the website Lead does. This script fires a paired test
 * CompleteRegistration + Purchase at the guarded `capi` endpoint and reads back
 * Meta's own answer — `events_received: 1` with empty `messages[]` is the
 * definitive "Meta accepted it" signal (the same JSON the engine stores in
 * capi_events.meta_response).
 *
 * Safe to re-run: every event_id is unique (no dedup), and with a
 * META_TEST_EVENT_CODE the events go to TEST mode (not counted in real
 * reporting / attribution).
 *
 * Reads config from process.env, then .env.local (VITE_SUPABASE_*), then
 * supabase/.env (CAPI_INTERNAL_SECRET, META_TEST_EVENT_CODE). Override any with
 * env vars, e.g.:  TEST_EVENT_CODE=TEST12345 node scripts/verify-offline-capi.mjs
 *
 * After it passes, confirm attribution in Events Manager -> dataset
 * 4230021860577001 -> Overview/Activity (received counts + Event Match Quality
 * for CompleteRegistration & Purchase climb within ~20 min), and in /admin's
 * "Recent CAPI events" log.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(rel) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2].replace(/^["']|["']$/g, '') // strip quotes
    v = v.replace(/\s+#.*$/, '').trim() // strip trailing comments
    out[m[1]] = v
  }
  return out
}

// precedence: process.env > .env.local > supabase/.env
const cfg = { ...loadEnvFile('supabase/.env'), ...loadEnvFile('.env.local'), ...process.env }

const SUPABASE_URL = cfg.VITE_SUPABASE_URL || cfg.SUPABASE_URL || ''
const ANON = cfg.VITE_SUPABASE_ANON_KEY || cfg.SUPABASE_ANON_KEY || ''
const SECRET = cfg.CAPI_INTERNAL_SECRET || ''
const TEST_CODE = cfg.TEST_EVENT_CODE || cfg.META_TEST_EVENT_CODE || ''

const missing = []
if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL (.env.local)')
if (!ANON) missing.push('VITE_SUPABASE_ANON_KEY (.env.local)')
if (!SECRET) missing.push('CAPI_INTERNAL_SECRET (supabase/.env)')
if (missing.length) {
  console.error('Missing config:\n  - ' + missing.join('\n  - '))
  process.exit(2)
}
if (!TEST_CODE) {
  console.warn(
    '⚠  No TEST_EVENT_CODE / META_TEST_EVENT_CODE set — events will be sent as LIVE, not test.\n' +
      '   Get a code from Events Manager -> dataset -> Test Events, then re-run with it set.\n',
  )
}

const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/capi`
const stamp = Date.now()

// A realistic synthetic identity so match quality is non-trivial. fbc/fbp are
// the click identifiers; PII is hashed server-side before it reaches Meta.
const identity = {
  email: 'capi.verify@example.com',
  phone: '+17744467375',
  firstName: 'Capi',
  lastName: 'Verify',
  city: 'Worcester',
  state: 'MA',
  zip: '01601',
  country: 'US',
  fbc: `fb.1.${stamp}.IwAR_verify_${stamp}`,
  fbp: `fb.1.${stamp}.${Math.floor(Math.random() * 1e10)}`,
}

const events = [
  { eventName: 'CompleteRegistration', eventId: `verify_cr_${stamp}` },
  { eventName: 'Purchase', eventId: `verify_purchase_${stamp}`, value: 500, currency: 'USD' },
]

async function fire(ev) {
  const body = {
    ...identity,
    ...ev,
    eventSourceUrl: 'https://acewebdesigners.com/contractorlanding',
    ...(TEST_CODE ? { testEventCode: TEST_CODE } : {}),
  }
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: ANON,
      authorization: `Bearer ${ANON}`,
      'x-capi-secret': SECRET,
    },
    body: JSON.stringify(body),
  })
  let json
  try { json = await resp.json() } catch { json = { error: 'non-JSON response' } }
  return { httpStatus: resp.status, json }
}

console.log(`Endpoint:   ${endpoint}`)
console.log(`Test mode:  ${TEST_CODE ? `yes (code ${TEST_CODE})` : 'NO — live events'}\n`)

let allOk = true
for (const ev of events) {
  const { httpStatus, json } = await fire(ev)
  // result envelope from the capi function: { ok, status, metaResponse, ... }
  const meta = json?.metaResponse ?? {}
  const received = typeof meta?.events_received === 'number' ? meta.events_received : null
  const metaMsgs = Array.isArray(meta?.messages) ? meta.messages : []
  const accepted = json?.ok === true && received === 1 && metaMsgs.length === 0

  if (!accepted) allOk = false
  console.log(`${accepted ? '✅' : '❌'} ${ev.eventName}  (event_id=${ev.eventId})`)
  console.log(`     http ${httpStatus} · function ok=${json?.ok}`)
  console.log(`     events_received=${received ?? 'n/a'} · messages=${JSON.stringify(metaMsgs)}`)
  if (meta?.fbtrace_id) console.log(`     fbtrace_id=${meta.fbtrace_id}`)
  if (!accepted) console.log(`     raw: ${JSON.stringify(json).slice(0, 500)}`)
  console.log('')
}

if (allOk) {
  console.log('PASS — Meta accepted both offline events (events_received: 1, no messages).')
  console.log('Next: confirm match quality in Events Manager -> Overview/Activity (~20 min)')
  console.log('      and the rows in /admin -> Website -> Recent CAPI events (status=sent).')
  process.exit(0)
} else {
  console.error('FAIL — at least one offline event was not accepted. See raw output above.')
  console.error('Check: META_CAPI_TOKEN valid + bound to the dataset? capi function deployed?')
  process.exit(1)
}
