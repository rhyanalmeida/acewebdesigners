// Upload an export-instantly.mjs CSV into an Instantly campaign via the v2 bulk API
// (POST /api/v2/leads/add, ≤1,000 leads/request) — replaces the manual CSV upload.
//
//   node scripts/instantly-upload-leads.mjs --file instantly-<batch>.csv --campaign <id>
//   node scripts/instantly-upload-leads.mjs --file x.csv --campaign <id> --dry   # parse + count only
//
// Reads INSTANTLY_ADMIN_API_KEY (leads:all) from supabase/.env. Columns beyond
// email/first_name/company_name become custom variables ({{city}} {{state}} {{demo_url}}).
// skip_if_in_campaign keeps a re-run from double-adding; suppression is enforced upstream
// (export refuses suppressed rows) — never bypass that by hand-editing the CSV.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const FILE = opt('file'); const CAMPAIGN = opt('campaign'); const DRY = args.includes('--dry')
if (!FILE || !CAMPAIGN) { console.error('Usage: --file <csv> --campaign <id> [--dry]'); process.exit(1) }

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
const KEY = { ...loadDotEnv(path.join(ROOT, 'supabase', '.env')), ...process.env }.INSTANTLY_ADMIN_API_KEY
if (!KEY && !DRY) { console.error('INSTANTLY_ADMIN_API_KEY missing (supabase/.env)'); process.exit(1) }

// Minimal RFC-4180 CSV parse (export-instantly.mjs quotes only fields containing , " or newline).
function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else q = false } else field += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [head, ...body] = rows
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

const recs = parseCsv(fs.readFileSync(FILE, 'utf8'))
const leads = recs.map((r) => {
  const { email, first_name, company_name, ...rest } = r
  return { email, first_name, company_name, custom_variables: rest }
})
console.log(`${leads.length} leads parsed from ${FILE}`)
if (DRY) { console.log(JSON.stringify(leads[0], null, 2)); process.exit(0) }

for (let i = 0; i < leads.length; i += 1000) {
  const r = await fetch('https://api.instantly.ai/api/v2/leads/add', {
    method: 'POST',
    headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ campaign_id: CAMPAIGN, leads: leads.slice(i, i + 1000), skip_if_in_campaign: true, verify_leads_on_import: false }),
  })
  const txt = await r.text()
  if (!r.ok) { console.error(`POST /leads/add → ${r.status} ${txt.slice(0, 400)}`); process.exit(1) }
  const j = JSON.parse(txt)
  console.log(`uploaded=${j.leads_uploaded} duplicates=${j.duplicated_leads ?? j.duplicate_email_count} skipped=${j.skipped_count} invalid=${j.invalid_email_count} blocklist=${j.in_blocklist} remaining_in_plan=${j.remaining_in_plan}`)
}
