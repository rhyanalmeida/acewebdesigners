// Seed/refresh the niche_playbooks knowledge base by running generate-brief's
// research stage (Claude Sonnet 5 + web search) for each contractor trade.
// Mints a short-lived admin session (same mechanism as funnel-admin.mjs) and
// calls the generate-brief fn synchronously per trade — each call takes ~1-2 min
// and costs ~$0.15-0.35 in API + search usage.
//
//   node scripts/seed-niche-playbooks.mjs           — research trades missing/stale rows
//   node scripts/seed-niche-playbooks.mjs --force   — re-research everything
//   node scripts/seed-niche-playbooks.mjs plumber   — research just one trade
const REF = 'dwsmrruzufqpopdzlszw'
const URL = `https://${REF}.supabase.co`
const ADMIN_EMAIL = 'hello@acewebdesigners.com'
const MGMT = process.env.SUPABASE_ACCESS_TOKEN
if (!MGMT) { console.error('SUPABASE_ACCESS_TOKEN not in env'); process.exit(1) }

const TRADES = [
  'general contractor',
  'remodeler',
  'roofer',
  'plumber',
  'electrician',
  'hvac',
  'landscaper',
  'painter',
  'concrete',
  'flooring',
  'handyman',
]

async function keys() {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${MGMT}` },
  })
  const arr = await r.json()
  return {
    anon: arr.find((k) => k.name === 'anon')?.api_key,
    service: arr.find((k) => k.name === 'service_role')?.api_key,
  }
}

async function mintSession(service, anon) {
  const g = await fetch(`${URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: ADMIN_EMAIL }),
  })
  const gj = await g.json()
  const otp = gj.email_otp || gj.properties?.email_otp
  if (!otp) throw new Error('no email_otp from generate_link: ' + JSON.stringify(gj).slice(0, 300))
  const v = await fetch(`${URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: ADMIN_EMAIL, token: otp }),
  })
  const vj = await v.json()
  if (!vj.access_token) throw new Error('no access_token from verify: ' + JSON.stringify(vj).slice(0, 300))
  return vj.access_token
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const only = args.filter((a) => !a.startsWith('--'))
const trades = only.length ? only : TRADES

const { anon, service } = await keys()
const jwt = await mintSession(service, anon)

let failed = 0
for (const trade of trades) {
  process.stdout.write(`researching "${trade}" ... `)
  const t0 = Date.now()
  try {
    const r = await fetch(`${URL}/functions/v1/generate-brief`, {
      method: 'POST',
      headers: { apikey: anon, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'research', trade, force }),
    })
    const j = await r.json().catch(() => null)
    const secs = Math.round((Date.now() - t0) / 1000)
    if (r.ok && j?.ok) {
      console.log(j.skipped ? `skipped (${j.skipped})` : `ok → ${j.playbook} (${j.pricing} pricing rows, ${j.sources} sources) in ${secs}s`)
    } else {
      failed++
      console.log(`FAILED (${r.status}) ${JSON.stringify(j).slice(0, 200)}`)
    }
  } catch (err) {
    failed++
    console.log(`FAILED ${err}`)
  }
}
console.log(failed ? `\ndone with ${failed} failure(s) — re-run to retry` : '\nall playbooks seeded')
process.exit(failed ? 1 : 0)
