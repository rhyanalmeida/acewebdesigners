// Backfill prospects.first_name for rows that have none, using scripts/lib/first-name.mjs
// (email-derived, validated name → else trimmed business name), and optionally push the same
// value onto leads already sitting in an Instantly campaign.
//
//   node scripts/backfill-first-names.mjs --batch 2026-09-newengland-gc --dry
//   node scripts/backfill-first-names.mjs --batch 2026-09-newengland-gc
//   node scripts/backfill-first-names.mjs --batch b1 --instantly <campaign-id>   # also PATCH Instantly leads
//
// Only touches rows whose first_name is NULL/blank — a real scraped name is never overwritten.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNames, greetingName } from './lib/first-name.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REF = 'dwsmrruzufqpopdzlszw'
const URL = `https://${REF}.supabase.co`
const MGMT = process.env.SUPABASE_ACCESS_TOKEN
if (!MGMT) { console.error('SUPABASE_ACCESS_TOKEN not in env'); process.exit(1) }
const args = process.argv.slice(2)
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const BATCH = opt('batch'); const CAMPAIGN = opt('instantly'); const DRY = args.includes('--dry')
if (!BATCH) { console.error('Usage: --batch <label> [--instantly <campaign-id>] [--dry]'); process.exit(1) }

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
const IKEY = { ...loadDotEnv(path.join(ROOT, 'supabase', '.env')), ...process.env }.INSTANTLY_ADMIN_API_KEY
if (CAMPAIGN && !IKEY && !DRY) { console.error('INSTANTLY_ADMIN_API_KEY missing'); process.exit(1) }

const r0 = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${MGMT}` } })
const SVC = (await r0.json()).find((k) => k.name === 'service_role')?.api_key
if (!SVC) throw new Error('could not reveal service_role key')
const rest = (p, init = {}) => fetch(`${URL}/rest/v1/${p}`, { ...init, headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } })

const NAMES = loadNames(fs.readFileSync(path.join(ROOT, 'scripts', 'data', 'first-names.txt'), 'utf8'))
const resp = await rest(`prospects?select=id,email,business_name,first_name&batch=eq.${encodeURIComponent(BATCH)}&email=not.is.null&order=created_at.asc`)
if (!resp.ok) { console.error(`query failed (${resp.status})`, (await resp.text()).slice(0, 300)); process.exit(1) }
const rows = (await resp.json()).filter((p) => !(p.first_name ?? '').trim())
console.log(`${rows.length} rows in "${BATCH}" without a first name`)

let fromEmail = 0
const plan = rows.map((p) => {
  const name = greetingName({ email: p.email, businessName: p.business_name, names: NAMES })
  if (name !== p.business_name && !p.business_name?.startsWith(name)) fromEmail++
  return { ...p, name }
})
console.log(`email-derived ≈ ${fromEmail}, business-name fallback ≈ ${plan.length - fromEmail}`)
if (DRY) { for (const p of plan) console.log(`${p.email.padEnd(44)} → ${p.name}`); process.exit(0) }

for (const p of plan) {
  const u = await rest(`prospects?id=eq.${p.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ first_name: p.name }) })
  if (!u.ok) { console.error(`DB patch failed for ${p.email}: ${u.status}`); process.exit(1) }
}
console.log(`DB: first_name set on ${plan.length} rows`)

if (CAMPAIGN) {
  const byEmail = new Map(plan.map((p) => [p.email.toLowerCase(), p.name]))
  let after; let patched = 0; let seen = 0
  for (;;) {
    const r = await fetch('https://api.instantly.ai/api/v2/leads/list', { method: 'POST', headers: { authorization: `Bearer ${IKEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ campaign: CAMPAIGN, limit: 100, ...(after ? { starting_after: after } : {}) }) })
    if (!r.ok) { console.error(`leads/list → ${r.status} ${(await r.text()).slice(0, 300)}`); process.exit(1) }
    const j = await r.json()
    for (const l of j.items ?? []) {
      seen++
      const name = byEmail.get((l.email ?? '').toLowerCase())
      if (!name || l.first_name === name) continue
      const u = await fetch(`https://api.instantly.ai/api/v2/leads/${l.id}`, { method: 'PATCH', headers: { authorization: `Bearer ${IKEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ first_name: name }) })
      if (!u.ok) { console.error(`lead PATCH ${l.email} → ${u.status} ${(await u.text()).slice(0, 200)}`); process.exit(1) }
      patched++
    }
    if (!j.next_starting_after) break
    after = j.next_starting_after
  }
  console.log(`Instantly: ${patched} of ${seen} campaign leads renamed`)
}
