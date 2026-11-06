#!/usr/bin/env node
// verify-emails.mjs — MillionVerifier pass (single-email API v3) over a leads CSV before import.
//
//   node scripts/verify-emails.mjs --in leads/x.enriched.csv [--out leads/x.enriched.verified.csv]
//                                  [--limit N] [--dry] [--concurrency 5] [--timeout 20] [--force]
//
// Adds two columns: verify_result (ok | catch_all | unknown | error | disposable | invalid) and
// verify_quality (good | bad | risky) — MillionVerifier's own vocabulary, confirmed 2026-11-04
// against https://developer.millionverifier.com/ and the documented API_KEY_FOR_TEST key: the
// endpoint is GET https://api.millionverifier.com/api/v3/?api=KEY&email=X&timeout=S (timeout
// 2–60 s), it always answers HTTP 200 with {email, quality, result, resultcode, subresult, free,
// role, didyoumean, credits, executiontime, error, livemode}, and key / credit problems arrive
// as result:"error" + error:"Apikey not found" rather than an HTTP status. Live samples
// (owner, 2026-11-04): a placeholder → result=invalid quality=bad subresult=no_mailbox; a
// catch-all domain → result=catch_all quality=risky role=true. A NON-EMPTY `error` field is a
// request-level problem (bad key, no credits) → the run stops and exits 2; it is never a
// per-address verdict.
// import-prospects.mjs --verify then imports only `ok` and parks `catch_all` for a later wave.
//
// • MILLIONVERIFIER_API_KEY from supabase/.env (local scripts only — never an Edge secret).
// • Cache leads/.verify-cache.json keyed by email (leads/ is gitignored): a re-run, or a second
//   CSV carrying the same address, costs 0 credits. `error` results are never cached;
//   --force re-verifies cached addresses.
// • Blank / unparseable / junk emails (lib/email-quality.mjs) are never sent — the importer
//   drops them anyway — and keep blank result columns. 1 credit per API call.
// • --dry: no API calls, nothing written; prints what would be verified and the credit cost.
// • --limit N: at most N API calls this run (cached hits are free and don't count).
// Exit 1 on a missing key (unless --dry), 2 if the API rejects the key / runs out of credits
// (partial results are still written and cached, so re-running continues where it stopped).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsv, toCsv, findColumn } from './lib/csv.mjs'
import { cleanEmail, isJunkEmail } from './lib/email-quality.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && i + 1 < args.length ? args[i + 1] : d }
const IN = opt('in')
const OUT = opt('out', IN ? IN.replace(/\.csv$/i, '') + '.verified.csv' : undefined)
const LIMIT = Math.max(0, Number(opt('limit', 0)) || 0)
const CONC = Math.max(1, Number(opt('concurrency', 5)) || 5)
const TIMEOUT = Math.min(60, Math.max(2, Number(opt('timeout', 20)) || 20))
const DRY = args.includes('--dry')
const FORCE = args.includes('--force')
if (!IN) { console.error('Usage: node scripts/verify-emails.mjs --in <csv> [--out <csv>] [--limit N] [--dry] [--concurrency 5] [--timeout 20] [--force]'); process.exit(1) }
if (!fs.existsSync(IN)) { console.error(`not found: ${IN}`); process.exit(1) }

function loadDotEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('='); if (eq < 0) continue
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}
const KEY = { ...loadDotEnv(path.join(ROOT, 'supabase', '.env')), ...process.env }.MILLIONVERIFIER_API_KEY
if (!KEY && !DRY) {
  console.error('MILLIONVERIFIER_API_KEY is missing. Add it to supabase/.env (MillionVerifier → API page) — it is a local-script key, never an Edge secret. Use --dry to preview without a key.')
  process.exit(1)
}

// ── cache ───────────────────────────────────────────────────────────────────
const CACHE_PATH = path.join(ROOT, 'leads', '.verify-cache.json')
function loadCache() {
  try {
    const j = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
    return j && typeof j === 'object' && !Array.isArray(j) ? j : {}
  } catch { return {} }
}
function saveCache(cache) {
  if (DRY) return
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true })
  const tmp = `${CACHE_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(cache))
  fs.renameSync(tmp, CACHE_PATH)
}

// ── load csv + plan ─────────────────────────────────────────────────────────
const rows = parseCsv(fs.readFileSync(IN, 'utf8'))
if (rows.length < 2) { console.error('CSV has no data rows'); process.exit(1) }
const H = rows[0].map((h) => h.trim())
const iEmail = findColumn(H, 'email', 'email 1', 'email_1', 'emails/0')
if (iEmail < 0) { console.error(`no email column found. Headers: ${H.join(', ')}`); process.exit(1) }
let iRes = H.indexOf('verify_result')
let iQual = H.indexOf('verify_quality')
if (iRes < 0) { iRes = H.length; H.push('verify_result') }
if (iQual < 0) { iQual = H.length; H.push('verify_quality') }
rows[0] = H
for (const r of rows.slice(1)) while (r.length < H.length) r.push('')
const apply = (row, entry) => { row[iRes] = entry.result ?? ''; row[iQual] = entry.quality ?? '' }

const cache = loadCache()
const stats = { blank: 0, invalid: 0, junk: 0, cached: 0 }
const pending = new Map() // email → row indexes
for (let i = 1; i < rows.length; i++) {
  const raw = (rows[i][iEmail] ?? '').trim()
  if (!raw) { stats.blank++; continue }
  const email = cleanEmail(raw)
  if (!email) { stats.invalid++; continue }
  if (isJunkEmail(email)) { stats.junk++; continue }
  const hit = !FORCE && cache[email]
  if (hit) { stats.cached++; apply(rows[i], hit); continue }
  if (!pending.has(email)) pending.set(email, [])
  pending.get(email).push(i)
}
const queue = [...pending.keys()]
const capped = LIMIT > 0 ? queue.slice(0, LIMIT) : queue
console.log(
  `${rows.length - 1} rows · blank ${stats.blank} · invalid ${stats.invalid} · junk ${stats.junk} · cached ${stats.cached} · ` +
    `to verify ${queue.length} unique${LIMIT ? ` (capped at ${capped.length})` : ''} → ~${capped.length} credits`,
)
if (DRY) {
  for (const e of capped.slice(0, 25)) console.log(`  would verify ${e}`)
  if (capped.length > 25) console.log(`  … and ${capped.length - 25} more`)
  console.log(`(--dry) no API calls, nothing written. Output would go to ${OUT}`)
  process.exit(0)
}

// ── verify ──────────────────────────────────────────────────────────────────
const API = 'https://api.millionverifier.com/api/v3/'
/** One API call (one retry on a network failure). Returns { data } or { network: message }. */
async function verifyOne(email) {
  const url = `${API}?api=${encodeURIComponent(KEY)}&email=${encodeURIComponent(email)}&timeout=${TIMEOUT}`
  let lastErr = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), (TIMEOUT + 15) * 1000)
    try {
      const r = await fetch(url, { signal: ac.signal })
      const text = await r.text()
      try { return { data: JSON.parse(text) } } catch { throw new Error(`non-JSON ${r.status}: ${text.slice(0, 120)}`) }
    } catch (e) {
      lastErr = e.message
    } finally {
      clearTimeout(t)
    }
  }
  return { network: lastErr }
}

let fatal = null, calls = 0, creditsLeft = null
const todo = [...capped]
async function worker() {
  while (todo.length && !fatal) {
    const email = todo.shift()
    const { data, network } = await verifyOne(email)
    calls++
    // A non-empty `error` from the API is request-level (bad key, no credits): stop everything.
    if (data && typeof data.error === 'string' && data.error.trim()) { fatal = data.error.trim(); todo.length = 0; return }
    const entry = data
      ? {
          result: data.result ?? 'error',
          quality: data.quality ?? '',
          subresult: data.subresult ?? '',
          free: !!data.free,
          role: !!data.role,
          didyoumean: data.didyoumean || '',
          at: new Date().toISOString(),
        }
      : { result: 'error', quality: '', subresult: `network: ${network}`, at: new Date().toISOString() }
    if (entry.result !== 'error') cache[email] = entry
    for (const i of pending.get(email)) apply(rows[i], entry)
    if (data && typeof data.credits === 'number') creditsLeft = data.credits
    if (calls % 25 === 0) { saveCache(cache); process.stdout.write(`  ${calls}/${capped.length} verified\r`) }
  }
}
await Promise.all(Array.from({ length: CONC }, worker))
saveCache(cache)
fs.writeFileSync(OUT, toCsv(rows))

const tally = {}
for (const r of rows.slice(1)) { const k = r[iRes] || '(blank)'; tally[k] = (tally[k] ?? 0) + 1 }
console.log(`\n${calls} API calls · ${stats.cached} from cache · wrote → ${OUT}`)
console.log('verify_result: ' + Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · '))
if (creditsLeft != null) console.log(`MillionVerifier credits left: ${creditsLeft}`)
if (fatal) {
  console.error(`\nMillionVerifier rejected the run: ${fatal}. Partial results saved; re-run to continue (the cache keeps what succeeded).`)
  process.exit(2)
}
console.log(`\nNext: node scripts/import-prospects.mjs --file ${OUT} --batch <label> --verify`)
