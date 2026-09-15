// Export a prospects batch as an Instantly-ready CSV for the outbound funnel.
//
//   node scripts/export-instantly.mjs --batch 2026-09-plumbers
//   node scripts/export-instantly.mjs --batch b1 --campaign <instantly-campaign-id>
//   node scripts/export-instantly.mjs --batch b1 --no-stamp     (dry export)
//
// Emits email,first_name,company_name,city,state,demo_url — upload to an
// Instantly campaign and use {{demo_url}} in the email body. Only exports rows
// that are: in the batch, not suppressed, not test, not yet emailed (emailed_at
// null). Suppression is re-checked at export time (an unsub that arrived after
// import is honored). By default stamps emailed_at + instantly_campaign_id on
// the exported rows so re-running never double-exports; --no-stamp skips that.
//
// COLD-EMAIL RULES (CAN-SPAM + deliverability — see CLAUDE.md outbound funnel):
// send ONLY from the warmed lookalike sending domains configured in Instantly
// (never acewebdesigners.com or GHL), include the physical postal address in the
// template footer, and keep Instantly's unsubscribe link in every email.

import fs from 'node:fs'

const REF = 'dwsmrruzufqpopdzlszw'
const URL = `https://${REF}.supabase.co`
const SITE = 'https://acewebdesigners.com'
const MGMT = process.env.SUPABASE_ACCESS_TOKEN
if (!MGMT) { console.error('SUPABASE_ACCESS_TOKEN not in env'); process.exit(1) }

const args = process.argv.slice(2)
const opt = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const batch = opt('batch')
const campaign = opt('campaign')
const stamp = !args.includes('--no-stamp')
if (!batch) {
  console.error('Usage: node scripts/export-instantly.mjs --batch <label> [--campaign <id>] [--no-stamp]')
  process.exit(1)
}

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

const q =
  `prospects?select=id,token,email,first_name,business_name,city,state` +
  `&batch=eq.${encodeURIComponent(batch)}&suppressed=is.false&is_test=is.false` +
  `&emailed_at=is.null&email=not.is.null&order=created_at.asc`
const resp = await rest(q)
if (!resp.ok) { console.error(`query failed (${resp.status}):`, (await resp.text()).slice(0, 300)); process.exit(1) }
const rows = await resp.json()
if (!rows.length) { console.log(`No un-emailed, non-suppressed prospects in batch "${batch}".`); process.exit(0) }

const esc = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
// Merge-field fallbacks are baked in HERE rather than relying on Instantly's
// per-variable fallback UI: scraped data often lacks a first name or city, and a
// template line like "Hi ," or "customers in  can't" would go out otherwise.
const FALLBACK_FIRST_NAME = 'there'
const FALLBACK_CITY = 'your area'
const lines = ['email,first_name,company_name,city,state,demo_url']
for (const p of rows) {
  lines.push(
    [
      p.email,
      (p.first_name ?? '').trim() || FALLBACK_FIRST_NAME,
      p.business_name,
      (p.city ?? '').trim() || FALLBACK_CITY,
      p.state ?? '',
      `${SITE}/demo/${p.token}`,
    ]
      .map(esc)
      .join(','),
  )
}
const out = `instantly-${batch}.csv`
fs.writeFileSync(out, lines.join('\n') + '\n')
console.log(`Wrote ${rows.length} leads → ${out}`)

if (stamp) {
  const ids = rows.map((p) => p.id)
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200)
    const patch = await rest(`prospects?id=in.(${chunk.join(',')})`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        emailed_at: new Date().toISOString(),
        ...(campaign ? { instantly_campaign_id: campaign } : {}),
      }),
    })
    if (!patch.ok) { console.error(`stamp failed (${patch.status}):`, (await patch.text()).slice(0, 300)); process.exit(1) }
  }
  console.log(`Stamped emailed_at${campaign ? ' + campaign id' : ''} on ${ids.length} rows.`)
} else {
  console.log('(--no-stamp: rows left unmarked — they will export again next run)')
}
console.log('\nUpload to Instantly → campaign → leads, map demo_url, use {{demo_url}} in the template.')
