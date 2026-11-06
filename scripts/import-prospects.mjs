// Import a scraped business CSV (Outscraper / Google-Maps export style) into the
// `prospects` table for the outbound cold-email funnel.
//
//   node scripts/import-prospects.mjs --file leads.csv --batch 2026-09-plumbers --trade plumber
//   node scripts/import-prospects.mjs --file leads.csv --batch b1 --trade roofer --test
//   node scripts/import-prospects.mjs --file leads.verified.csv --batch b1 --verify     # MillionVerifier "ok" only
//   node scripts/import-prospects.mjs --file leads.csv --batch b1 --dry                 # counts only, touches nothing
//
// Compliance guards (CAN-SPAM / list hygiene):
//   • rows without an email are skipped (nothing to send to)
//   • every email is normalised by lib/email-quality.mjs `cleanEmail` (HTML entities, mailto:,
//     trailing "\" / "\\n" leaks …) and junk is skipped by `isJunkEmail` (form placeholders,
//     site-builder / font / hosting / platform domains, chain corporate domains, asset names,
//     no-reply) — 2026-11-04: every one of the first restaurant bounces was one of these
//   • an email that sits on 2+ different businesses is skipped (`findSharedEmails` — a web
//     agency's address scraped off its clients' sites, not the restaurant's)
//   • --verify: the CSV must carry a `verify_result` column (scripts/verify-emails.mjs writes it;
//     verification is NOT run inline so credits are spent in one explicit, cached step). Only
//     `ok` is imported (override: --verify-accept ok,catch_all); `catch_all` rows are written to
//     <file>.catchall.csv for a later low-volume wave; invalid / unknown / disposable / error skip
//   • emails already in `suppressions` (unsubscribed/bounced) are skipped
//   • non-US rows are skipped when the CSV has a country column (list stays US-only)
// Dedupe: upserts on gmaps_place_id when the CSV provides one (re-imports don't
// duplicate or reset a prospect's token/site state — only identity columns update).
// --dry: parse + filter + print every count and touch nothing — no Supabase call at all, so
// the suppression check is the one guard a dry run cannot apply.
//
// Uses the Supabase Management API (SUPABASE_ACCESS_TOKEN env var) to reveal the
// service key, then PostgREST — same access pattern as funnel-admin.mjs.

import fs from 'node:fs'
import { cleanEmail, isJunkEmail, findSharedEmails } from './lib/email-quality.mjs'

const REF = 'dwsmrruzufqpopdzlszw'
const URL = `https://${REF}.supabase.co`

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
const isDry = args.includes('--dry')
const verifyGate = args.includes('--verify')
const verifyAccept = new Set((opt('verify-accept') ?? 'ok').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))
if (!file || !batch) {
  console.error('Usage: node scripts/import-prospects.mjs --file <csv> --batch <label> [--trade <slug>] [--test] [--verify [--verify-accept ok,catch_all]] [--dry]')
  process.exit(1)
}
const MGMT = process.env.SUPABASE_ACCESS_TOKEN
if (!MGMT && !isDry) { console.error('SUPABASE_ACCESS_TOKEN not in env'); process.exit(1) }

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
const esc = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }

/** First matching header (case/space-insensitive) from a list of candidates. */
function col(headers, ...names) {
  const norm = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
  for (const n of names) {
    const i = norm.indexOf(n.toLowerCase().replace(/[^a-z0-9]/g, ''))
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
  email: col(H, 'email', 'email 1', 'email_1', 'emails/0'), // Apify contact-details export → emails/0
  phone: col(H, 'phone', 'phone number', 'phone 1'),
  first: col(H, 'first name', 'owner first name', 'contact first name'),
  last: col(H, 'last name', 'owner last name', 'contact last name'),
  city: col(H, 'city'),
  state: col(H, 'state', 'us state', 'region'),
  zip: col(H, 'zip', 'postal code', 'zipcode'),
  country: col(H, 'country', 'country code'),
  website: col(H, 'website', 'site', 'domain', 'url'),
  placeId: col(H, 'place id', 'google id', 'place_id', 'cid'),
  type: col(H, 'type', 'category', 'main category', 'categoryName'),
  rating: col(H, 'rating', 'stars', 'totalScore'),
  reviews: col(H, 'reviews', 'review count', 'reviews count', 'reviewsCount'),
  verifyResult: col(H, 'verify_result'),
  // personalization from enrich-haiku.mjs (migration 0018) — only sent when the CSV carries them
  cuisine: col(H, 'cuisine'),
  dishes: col(H, 'dishes'),
  hook: col(H, 'hook'),
  firstLine: col(H, 'first_line', 'first line'),
  ownerEvidence: col(H, 'owner_evidence'),
}
if (c.name < 0) { console.error(`No business-name column found. Headers: ${H.join(', ')}`); process.exit(1) }
if (verifyGate && c.verifyResult < 0) {
  console.error(`--verify needs a verify_result column. Run first: node scripts/verify-emails.mjs --in ${file}`)
  process.exit(1)
}
const get = (r, i) => (i >= 0 ? (r[i] ?? '').trim() : '')

// ── email hygiene pre-pass ───────────────────────────────────────────────────
// Clean once; the shared-email (agency) check needs the whole file before any row is judged.
const data = rows.slice(1)
const emails = data.map((r) => cleanEmail(get(r, c.email)))
const shared = findSharedEmails(
  data.map((r, i) => ({ email: emails[i], placeId: get(r, c.placeId), website: get(r, c.website), name: get(r, c.name) })),
)

// ── supabase access (skipped entirely with --dry) ────────────────────────────
async function serviceKey() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${MGMT}` },
  })
  const arr = await r.json()
  const key = arr.find((k) => k.name === 'service_role')?.api_key
  if (!key) throw new Error('could not reveal service_role key')
  return key
}
let rest = null
let suppressed = new Set()
if (!isDry) {
  const SVC = await serviceKey()
  rest = (path, init = {}) =>
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
  suppressed = new Set(((await supResp.json()) ?? []).map((s) => s.email.toLowerCase()))
}

// ── build prospect rows ──────────────────────────────────────────────────────
const seen = new Set() // in-file email dedupe
const prospects = []
const catchall = []
const skip = { noEmail: 0, invalidEmail: 0, junk: 0, shared: 0, suppressed: 0, nonUs: 0, dup: 0 }
const verifyCounts = {}

for (let i = 0; i < data.length; i++) {
  const r = data[i]
  const email = emails[i]
  if (!get(r, c.email)) { skip.noEmail++; continue }
  if (!email) { skip.invalidEmail++; continue }
  if (isJunkEmail(email)) { skip.junk++; continue }
  if (shared.has(email)) { skip.shared++; continue }
  if (verifyGate) {
    const vr = get(r, c.verifyResult).toLowerCase() || '(blank)'
    verifyCounts[vr] = (verifyCounts[vr] ?? 0) + 1
    if (!verifyAccept.has(vr)) {
      if (vr === 'catch_all') catchall.push(r)
      continue
    }
  }
  if (suppressed.has(email)) { skip.suppressed++; continue }
  const country = get(r, c.country).toUpperCase()
  if (country && country !== 'US' && country !== 'USA' && country !== 'UNITED STATES') { skip.nonUs++; continue }
  const state = get(r, c.state).toUpperCase()
  if (!country && state && state.length === 2 && !US_STATES.has(state)) { skip.nonUs++; continue }
  if (seen.has(email)) { skip.dup++; continue }
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
    // personalization columns exist only after migration 0018 — include a key only when the CSV has a value
    ...(get(r, c.cuisine) ? { cuisine: get(r, c.cuisine) } : {}),
    ...(get(r, c.dishes) ? { dishes: get(r, c.dishes) } : {}),
    ...(get(r, c.hook) ? { hook: get(r, c.hook) } : {}),
    ...(get(r, c.firstLine) ? { first_line: get(r, c.firstLine) } : {}),
    ...(get(r, c.ownerEvidence) ? { owner_evidence: get(r, c.ownerEvidence) } : {}),
  })
}

// ── catch-all wave file ──────────────────────────────────────────────────────
const catchallPath = file.replace(/\.csv$/i, '') + '.catchall.csv'
if (verifyGate && catchall.length && !verifyAccept.has('catch_all')) {
  if (isDry) console.log(`(--dry) would write ${catchall.length} catch_all rows → ${catchallPath}`)
  else {
    fs.writeFileSync(catchallPath, [H, ...catchall].map((r) => r.map(esc).join(',')).join('\n') + '\n')
    console.log(`Wrote ${catchall.length} catch_all rows → ${catchallPath} (later wave: --verify --verify-accept catch_all)`)
  }
}

// ── upsert in chunks ─────────────────────────────────────────────────────────
// on_conflict=gmaps_place_id merges re-imports of the same place (NULL place ids
// never conflict, so those always insert).
let inserted = 0
if (!isDry) {
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
}

console.log(
  `\n\nBatch "${batch}"${isTest ? ' (TEST)' : ''}${isDry ? ' (DRY RUN)' : ''}: ${isDry ? `${prospects.length} prospects would be upserted` : `${inserted} prospects upserted`}.`,
)
console.log(
  `Skipped — no email: ${skip.noEmail}, invalid email: ${skip.invalidEmail}, junk email: ${skip.junk}, shared/agency email: ${skip.shared}, ` +
    `suppressed: ${skip.suppressed}${isDry ? ' (not checked in --dry)' : ''}, non-US: ${skip.nonUs}, in-file dupes: ${skip.dup}`,
)
if (verifyGate) {
  const parts = Object.entries(verifyCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`)
  console.log(`--verify (accepting ${[...verifyAccept].join(',')}): ${parts.join(' · ') || 'no rows reached the gate'}`)
}
if (!isDry) console.log(`\nNext: node scripts/export-instantly.mjs --batch ${batch}`)
