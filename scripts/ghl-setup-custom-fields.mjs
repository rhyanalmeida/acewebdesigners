// One-time GHL setup: ensure the contact custom fields we mirror attribution into
// exist in the sub-account, then print the GHL_CUSTOM_FIELD_IDS map to set as an
// Edge secret. Idempotent — matches existing fields by name, creates the missing.
//
// Usage:  node scripts/ghl-setup-custom-fields.mjs
// Reads GHL_API_TOKEN + GHL_LOCATION_ID from supabase/.env (Node 18+, global fetch).
//
// After running:
//   supabase secrets set GHL_CUSTOM_FIELD_IDS='{...the printed JSON...}'
// ghl.ts only sends a custom field when its key appears in that map (no-op if unset).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_PATH = path.join(__dirname, '..', 'supabase', '.env')
const GHL_API = 'https://services.leadconnectorhq.com'
const VERSION = '2021-07-28'

// our_key (matches ghl.ts buildGhlCustomFields) → GHL field display name + type
const FIELDS = [
  { key: 'fbc', name: 'FB Click ID (fbc)', dataType: 'TEXT' },
  { key: 'fbp', name: 'FB Browser ID (fbp)', dataType: 'TEXT' },
  { key: 'fbclid', name: 'FB Click fbclid', dataType: 'TEXT' },
  { key: 'client_ip', name: 'Client IP Address', dataType: 'TEXT' },
  { key: 'client_user_agent', name: 'Client User Agent', dataType: 'LARGE_TEXT' },
  { key: 'landing_url', name: 'Landing URL', dataType: 'LARGE_TEXT' },
  { key: 'utm_source', name: 'UTM Source', dataType: 'TEXT' },
  { key: 'utm_medium', name: 'UTM Medium', dataType: 'TEXT' },
  { key: 'utm_campaign', name: 'UTM Campaign', dataType: 'TEXT' },
  { key: 'utm_content', name: 'UTM Content', dataType: 'TEXT' },
  { key: 'utm_term', name: 'UTM Term', dataType: 'TEXT' },
  { key: 'campaign_id', name: 'Meta Campaign ID', dataType: 'TEXT' },
  { key: 'adset_id', name: 'Meta Ad Set ID', dataType: 'TEXT' },
  { key: 'ad_id', name: 'Meta Ad ID', dataType: 'TEXT' },
  { key: 'deal_value', name: 'Deal Value (upfront)', dataType: 'NUMERICAL' },
  { key: 'recurring_value', name: 'Recurring Value', dataType: 'NUMERICAL' },
  { key: 'recurring_interval', name: 'Recurring Interval', dataType: 'TEXT' },
  { key: 'plan_name', name: 'Plan Name', dataType: 'TEXT' },
]

function readEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    out[m[1]] = m[2].replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const env = readEnv(ENV_PATH)
const TOKEN = process.env.GHL_API_TOKEN || env.GHL_API_TOKEN
const LOCATION = process.env.GHL_LOCATION_ID || env.GHL_LOCATION_ID
if (!TOKEN || !LOCATION) {
  console.error('Missing GHL_API_TOKEN or GHL_LOCATION_ID (set in supabase/.env or the environment).')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Version: VERSION,
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

async function listFields() {
  const resp = await fetch(`${GHL_API}/locations/${LOCATION}/customFields?model=contact`, { headers })
  if (!resp.ok) throw new Error(`list customFields ${resp.status}: ${(await resp.text()).slice(0, 300)}`)
  const data = await resp.json()
  return data.customFields || data.customField || []
}

async function createField(f) {
  const resp = await fetch(`${GHL_API}/locations/${LOCATION}/customFields`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: f.name, dataType: f.dataType, model: 'contact' }),
  })
  if (!resp.ok) throw new Error(`create "${f.name}" ${resp.status}: ${(await resp.text()).slice(0, 300)}`)
  const data = await resp.json()
  return data.customField || data
}

const existing = await listFields()
const byName = new Map(existing.map((c) => [(c.name || '').trim().toLowerCase(), c]))
const idMap = {}

for (const f of FIELDS) {
  const hit = byName.get(f.name.toLowerCase())
  if (hit?.id) {
    idMap[f.key] = hit.id
    console.log(`  ✓ exists   ${f.key.padEnd(20)} "${f.name}"  id=${hit.id}`)
    continue
  }
  const created = await createField(f)
  idMap[f.key] = created.id
  console.log(`  + created  ${f.key.padEnd(20)} "${f.name}"  id=${created.id}`)
}

console.log('\nGHL_CUSTOM_FIELD_IDS (set as an Edge secret):\n')
console.log(JSON.stringify(idMap))
console.log('\n  supabase secrets set GHL_CUSTOM_FIELD_IDS=' + JSON.stringify(JSON.stringify(idMap)))
