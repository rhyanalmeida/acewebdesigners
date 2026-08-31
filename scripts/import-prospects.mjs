// Import a scraped business CSV (Outscraper / Google-Maps export style) into the
// `prospects` table for the outbound cold-email funnel.
//
//   node scripts/import-prospects.mjs --file leads.csv --batch 2026-09-plumbers --trade plumber
//   node scripts/import-prospects.mjs --file leads.csv --batch b1 --trade roofer --test
//
// Compliance guards (CAN-SPAM / list hygiene):
//   • rows without an email are skipped (nothing to send to)
//   • emails already in `suppressions` (unsubscribed/bounced) are skipped
//   • non-US rows are skipped when the CSV has a country column (list stays US-only)
// Dedupe: upserts on gmaps_place_id when the CSV provides one (re-imports don't
// duplicate or reset a prospect's token/site state — only identity columns update).
//
// Uses the Supabase Management API (SUPABASE_ACCESS_TOKEN env var) to reveal the
// service key, then PostgREST — same access pattern as funnel-admin.mjs.

import fs from 'node:fs'

const REF = 'dwsmrruzufqpopdzlszw'
const URL = `https://${REF}.supabase.co`
const MGMT = process.env.SUPABASE_ACCESS_TOKEN
if (!MGMT) { console.error('SUPABASE_ACCESS_TOKEN not in env'); process.exit(1) }

// ── args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const opt = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const file = opt('file')
const batch = opt('batch')
const trade = opt('trade')
const isTest = args.includes('--test')
if (!file || !batch) {
  console.error('Usage: node scripts/import-prospects.mjs --file <csv> --batch <label> [--trade <slug>] [--test]')
  process.exit(1)
}

// ── tiny CSV parser (quoted fields, CRLF, embedded commas/newlines) ──────────
function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false
      } else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((f) => f !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((f) => f !== '')) rows.push(row) }
  return rows
}

/** First matching header (case/space-insensitive) from a list of candidates. */
function col(headers, ...names) {
  const norm = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
  for (const n of names) {
    const i = norm.indexOf(n.replace(/[^a-z0-9]/g, ''))
    if (i >= 0) return i
  }
  return -1
}

const US_STATES = new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '))

// ── load + map ───────────────────────────────────────────────────────────────
const rows = parseCsv(fs.readFileSync(file, 'utf8'))
if (rows.length < 2) { console.error('CSV has no data rows'); process.exit(1) }
const H = rows[0]
const c = {
  name: col(H, 'name', 'business name', 'company', 'title'),
  email: col(H, 'email', 'email 1', 'email_1'),
  phone: col(H, 'phone', 'phone number', 'phone 1'),
  first: col(H, 'first name', 'owner first name', 'contact first name'),
  last: col(H, 'last name', 'owner last name', 'contact last name'),
  city: col(H, 'city'),
  state: col(H, 'state', 'us state', 'region'),
  zip: col(H, 'zip', 'postal code', 'zipcode'),
  country: col(H, 'country', 'country code'),
  website: col(H, 'website', 'site', 'domain', 'url'),
  placeId: col(H, 'place id', 'google id', 'place_id', 'cid'),
  rating: col(H, 'rating', 'stars'),
  reviews: col(H, 'reviews', 'review count', 'reviews count'),
  type: col(H, 'type', 'category', 'main category'),
}
if (c.name < 0) { console.error(`No business-name column found. Headers: ${H.join(', ')}`); process.exit(1) }
const get = (r, i) => (i >= 0 ? (r[i] ?? '').trim() : '')

// ── supabase access ──────────────────────────────────────────────────────────
async function serviceKey() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${MGMT}` },
  })
  const arr = await r.json()
  const key = arr.find((k) => k.name === 'service_role')?.api_key
  if (!key) throw new Error('could not reveal service_role key')
  return key
}
const SVC = await serviceKey()
const rest = (path, init = {}) =>
  fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SVC,
      Authorization: `Bearer ${SVC}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

// suppression list (unsubscribes/bounces survive re-imports)
const supResp = await rest('suppressions?select=email')
const suppressed = new Set(((await supResp.json()) ?? []).map((s) => s.email.toLowerCase()))

// ── build prospect rows ──────────────────────────────────────────────────────
const seen = new Set() // in-file email dedupe
const prospects = []
let skipNoEmail = 0, skipSuppressed = 0, skipNonUs = 0, skipDup = 0

for (const r of rows.slice(1)) {
  const email = get(r, c.email).toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { skipNoEmail++; continue }
  if (suppressed.has(email)) { skipSuppressed++; continue }
  const country = get(r, c.country).toUpperCase()
  if (country && country !== 'US' && country !== 'USA' && country !== 'UNITED STATES') { skipNonUs++; continue }
  const state = get(r, c.state).toUpperCase()
  if (!country && state && state.length === 2 && !US_STATES.has(state)) { skipNonUs++; continue }
  if (seen.has(email)) { skipDup++; continue }
  seen.add(email)

  const placeId = get(r, c.placeId)
  prospects.push({
    business_name: get(r, c.name),
    business_type: trade || get(r, c.type) || null,
    first_name: get(r, c.first) || null,
    last_name: get(r, c.last) || null,
    email,
    phone: get(r, c.phone) || null,
    city: get(r, c.city) || null,
    state: state || null,
    zip: get(r, c.zip) || null,
    website: get(r, c.website) || null,
    gmaps_place_id: placeId || null,
    rating: Number(get(r, c.rating)) || null,
    review_count: parseInt(get(r, c.reviews), 10) || null,
    source: 'csv',
    batch,
    is_test: isTest,
  })
}

// ── upsert in chunks ─────────────────────────────────────────────────────────
// on_conflict=gmaps_place_id merges re-imports of the same place (NULL place ids
// never conflict, so those always insert).
let inserted = 0
for (let i = 0; i < prospects.length; i += 100) {
  const chunk = prospects.slice(i, i + 100)
  const resp = await rest('prospects?on_conflict=gmaps_place_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(chunk),
  })
  if (!resp.ok) {
    console.error(`chunk ${i / 100 + 1} failed (${resp.status}):`, (await resp.text()).slice(0, 400))
    process.exit(1)
  }
  inserted += chunk.length
  process.stdout.write(`\rupserted ${inserted}/${prospects.length}`)
}

console.log(`\n\nBatch "${batch}"${isTest ? ' (TEST)' : ''}: ${inserted} prospects upserted.`)
console.log(`Skipped — no/invalid email: ${skipNoEmail}, suppressed: ${skipSuppressed}, non-US: ${skipNonUs}, in-file dupes: ${skipDup}`)
console.log(`\nNext: node scripts/export-instantly.mjs --batch ${batch}`)
