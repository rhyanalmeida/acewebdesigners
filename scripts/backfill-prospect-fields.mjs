#!/usr/bin/env node
// One-off repair (2026-11-04): import-prospects.mjs's header matcher never lowercased the names it
// was given, so camelCase Apify columns (categoryName / totalScore / reviewsCount) silently missed →
// every restaurant prospect imported with business_type/rating NULL and generate-site built them as
// "general contracting". Re-reads the source CSVs and fills ONLY the null fields, matched by email.
//   node scripts/backfill-prospect-fields.mjs --file leads/x.csv [--file leads/y.csv] [--dry]
import fs from 'node:fs'
const args = process.argv.slice(2)
const files = args.flatMap((a, i) => (a === '--file' ? [args[i + 1]] : []))
const dry = args.includes('--dry')
const REF = 'dwsmrruzufqpopdzlszw'
const MGMT = process.env.SUPABASE_ACCESS_TOKEN
if (!files.length || !MGMT) { console.error('need --file <csv> and SUPABASE_ACCESS_TOKEN'); process.exit(1) }

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += ch }
    else if (ch === '"') q = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (ch !== '\r') cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}
const byEmail = new Map()
for (const f of files) {
  const rows = parseCsv(fs.readFileSync(f, 'utf8'))
  const H = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
  const ix = (n) => H.indexOf(n)
  const iE = ix('emails0'), iT = ix('categoryname'), iR = ix('totalscore'), iC = ix('reviewscount')
  for (const r of rows.slice(1)) {
    const email = (r[iE] ?? '').trim().toLowerCase()
    if (!email) continue
    byEmail.set(email, { type: (r[iT] ?? '').trim() || null, rating: Number(r[iR]) || null, reviews: parseInt(r[iC], 10) || null })
  }
}
console.log(`${byEmail.size} emails with category/rating in the CSVs`)
const esc = (s) => `'${String(s).replace(/'/g, "''")}'`
const values = [...byEmail].map(([e, v]) => `(${esc(e)}, ${v.type ? esc(v.type) : 'null'}, ${v.rating ?? 'null'}, ${v.reviews ?? 'null'})`)
const sql = `update prospects p set
  business_type = coalesce(p.business_type, v.t),
  rating = coalesce(p.rating, v.r),
  review_count = coalesce(p.review_count, v.c),
  updated_at = now()
from (values ${values.join(',\n')}) as v(e, t, r, c)
where lower(p.email) = v.e and (p.business_type is null or p.rating is null or p.review_count is null)
returning p.id`
if (dry) { console.log(sql.slice(0, 1200)); process.exit(0) }
const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: 'POST', headers: { Authorization: `Bearer ${MGMT}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: sql }),
})
const out = await res.json()
console.log(Array.isArray(out) ? `updated ${out.length} prospects` : out)
