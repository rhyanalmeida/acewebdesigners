#!/usr/bin/env node
// instantly-remove-leads.mjs — pull a list of (junk) emails out of an Instantly campaign and,
// optionally, mark the matching `prospects` rows suppressed so export-instantly.mjs never
// re-exports them.
//
//   node scripts/instantly-remove-leads.mjs --campaign <id> --emails-file junk.txt               # DRY (default)
//   node scripts/instantly-remove-leads.mjs --campaign <id> --emails-file junk.csv --live        # delete
//   node scripts/instantly-remove-leads.mjs --campaign <id> --emails-file junk.txt --live --mark-junk
//
// --emails-file  .txt = one address per line (# comments ok) · .csv = its email column
//                (email / lead_email / emails/0). Every value goes through cleanEmail, so the raw
//                DB forms ("x@y.com\", "x@y.com\\n\") resolve to the address Instantly holds.
// Lookup        POST /api/v2/leads/list { campaign, contacts: [email], limit: 5 } — `contacts` is
//                the documented exact-email filter (developer.instantly.ai, read 2026-11-04);
//                falls back to { campaign, search: email, limit: 20 } (word / prefix match). Every
//                hit is compared exactly (after cleanEmail) before it counts, so a prefix match
//                can never delete the wrong lead.
// Delete        DELETE /api/v2/leads/{id} (scope leads:delete / leads:all) with
//                INSTANTLY_ADMIN_API_KEY from supabase/.env. 429 → backoff + retry.
// --mark-junk   PATCH prospects via PostgREST (service key revealed with SUPABASE_ACCESS_TOKEN,
//                same pattern as import-prospects.mjs) → suppressed=true,
//                suppressed_reason='junk-email' for email ILIKE '<email>%' (catches the rows that
//                still carry the trailing backslash). NOT added to `suppressions`: junk is not an
//                opt-out, and the importer's isJunkEmail keeps it from coming back.
// SAFETY        Dry unless --live is passed; --dry beats --live. A dry run does the read-only
//                lookups (so it lists lead ids) and makes zero writes anywhere.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsv, findColumn } from './lib/csv.mjs'
import { cleanEmail } from './lib/email-quality.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const API = 'https://api.instantly.ai/api/v2'
const REF = 'dwsmrruzufqpopdzlszw'
const SUPA = `https://${REF}.supabase.co`

const args = process.argv.slice(2)
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined }
const CAMPAIGN = opt('campaign')
const FILE = opt('emails-file')
const LIVE = args.includes('--live') && !args.includes('--dry')
const MARK = args.includes('--mark-junk')
if (!CAMPAIGN || !FILE) {
  console.error('Usage: node scripts/instantly-remove-leads.mjs --campaign <id> --emails-file <txt|csv> [--live] [--mark-junk] [--dry]')
  process.exit(1)
}
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(CAMPAIGN)) {
  console.error(`--campaign must be an Instantly campaign uuid, got "${CAMPAIGN}"`)
  process.exit(1)
}
if (!fs.existsSync(FILE)) { console.error(`not found: ${FILE}`); process.exit(1) }

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
const env = { ...loadDotEnv(path.join(ROOT, 'supabase', '.env')), ...process.env }
const KEY = env.INSTANTLY_ADMIN_API_KEY
const MGMT = process.env.SUPABASE_ACCESS_TOKEN
if (!KEY && LIVE) { console.error('INSTANTLY_ADMIN_API_KEY missing (supabase/.env)'); process.exit(1) }
if (MARK && LIVE && !MGMT) { console.error('--mark-junk --live needs SUPABASE_ACCESS_TOKEN in the environment'); process.exit(1) }

// ── input ────────────────────────────────────────────────────────────────────
function readEmails(file) {
  const text = fs.readFileSync(file, 'utf8')
  let raws
  if (/\.csv$/i.test(file)) {
    const rows = parseCsv(text)
    const i = findColumn(rows[0] ?? [], 'email', 'lead_email', 'emails/0', 'email 1')
    if (i < 0) { console.error(`no email column in ${file}. Headers: ${(rows[0] ?? []).join(', ')}`); process.exit(1) }
    raws = rows.slice(1).map((r) => r[i] ?? '')
  } else {
    // a comment is "#" at line start or after whitespace — never inside an address
    // (entity-encoded ones like "&#105;nfo&#64;…" carry "#")
    raws = text.split(/\r?\n/).map((l) => l.replace(/(^|\s)#.*$/, '').trim())
  }
  const emails = new Set(), bad = []
  for (const r of raws) {
    if (!r.trim()) continue
    const e = cleanEmail(r)
    if (e) emails.add(e); else bad.push(r.trim())
  }
  return { emails: [...emails], bad }
}

// ── instantly ────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((res) => setTimeout(res, ms))
async function api(pathname, { method = 'GET', body } = {}) {
  for (let attempt = 0; ; attempt++) {
    // Instantly (Fastify) rejects a body-less request that still carries a JSON content-type
    // (FST_ERR_CTP_EMPTY_JSON_BODY), so DELETE sends no content-type at all.
    const r = await fetch(API + pathname, {
      method,
      headers: { authorization: `Bearer ${KEY}`, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (r.status === 429 && attempt < 3) { await sleep(2000 * (attempt + 1)); continue }
    const txt = await r.text()
    if (!r.ok) throw new Error(`${method} ${pathname} → ${r.status} ${txt.slice(0, 200)}`)
    return txt ? JSON.parse(txt) : {}
  }
}
const STATUS = { 1: 'active', 2: 'paused', 3: 'completed', '-1': 'bounced', '-2': 'unsubscribed', '-3': 'skipped' }
async function findLeads(email) {
  const exact = (items) =>
    (items ?? []).filter((l) => cleanEmail(l.email) === email && (!l.campaign || String(l.campaign) === CAMPAIGN))
  let hits = exact((await api('/leads/list', { method: 'POST', body: { campaign: CAMPAIGN, contacts: [email], limit: 5 } })).items)
  if (!hits.length) hits = exact((await api('/leads/list', { method: 'POST', body: { campaign: CAMPAIGN, search: email, limit: 20 } })).items)
  return hits
}

// ── supabase (only for --mark-junk --live) ───────────────────────────────────
async function serviceKey() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${MGMT}` } })
  const key = (await r.json()).find?.((k) => k.name === 'service_role')?.api_key
  if (!key) throw new Error('could not reveal service_role key')
  return key
}

// ── main ─────────────────────────────────────────────────────────────────────
const { emails, bad } = readEmails(FILE)
console.log(
  `${emails.length} address(es) from ${FILE}${bad.length ? ` · ${bad.length} unparseable skipped (${bad.slice(0, 5).join(', ')})` : ''}` +
    ` · campaign ${CAMPAIGN} · ${LIVE ? 'LIVE' : 'DRY RUN — pass --live to delete'}`,
)
if (!emails.length) process.exit(0)

const found = [], missing = []
if (!KEY) {
  console.log('(no INSTANTLY_ADMIN_API_KEY — lead ids not resolved; listing the addresses only)')
  for (const e of emails) console.log(`  would remove ${e}`)
} else {
  for (const email of emails) {
    try {
      const hits = await findLeads(email)
      if (hits.length) for (const l of hits) found.push({ email, id: l.id, status: l.status })
      else missing.push(email)
    } catch (e) {
      console.error(`  ✗ lookup ${email}: ${e.message}`)
      missing.push(email)
    }
    await sleep(120)
  }
  for (const f of found) console.log(`  ${LIVE ? 'deleting' : 'would delete'} ${f.id}  ${f.email}  (${STATUS[String(f.status)] ?? `status ${f.status}`})`)
  if (missing.length) console.log(`  not in campaign (${missing.length}): ${missing.join(', ')}`)
}

let deleted = 0, failed = 0
if (LIVE) {
  for (const f of found) {
    try { await api(`/leads/${f.id}`, { method: 'DELETE' }); deleted++ }
    catch (e) { failed++; console.error(`  ✗ delete ${f.email} (${f.id}): ${e.message}`) }
    await sleep(120)
  }
}

let marked = 0
if (MARK) {
  if (!LIVE) console.log(`would mark ${emails.length} email(s) suppressed (junk-email) in prospects`)
  else {
    const SVC = await serviceKey()
    for (const email of emails) {
      const r = await fetch(`${SUPA}/rest/v1/prospects?email=ilike.${encodeURIComponent(email + '*')}&select=id,email`, {
        method: 'PATCH',
        headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ suppressed: true, suppressed_reason: 'junk-email' }),
      })
      if (!r.ok) { failed++; console.error(`  ✗ mark ${email}: ${r.status} ${(await r.text()).slice(0, 200)}`); continue }
      const hit = await r.json()
      marked += hit.length
      for (const p of hit) console.log(`  marked ${p.email}`)
    }
    console.log(`marked ${marked} prospect row(s) suppressed (junk-email)`)
  }
}

console.log(`\n${LIVE ? '' : '(dry) '}leads found ${found.length} · deleted ${deleted} · not found ${missing.length} · failed ${failed}${MARK && LIVE ? ` · prospects marked ${marked}` : ''}`)
if (failed) process.exitCode = 2
