// Pull a quick status snapshot for the contractor lead-gen campaign.
// Usage: node scripts/meta-ads-status.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const API_BASE = 'https://graph.facebook.com/v21.0'
const CAMPAIGN_NAME = 'Contractor Lead Gen — Free Website Offer'
const ADSET_NAME = 'Contractors — US — Advantage+ Audience — $20/day'

function loadEnvLocal() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  try {
    const raw = readFileSync(path.join(here, '..', '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\s+#.*$/, '').trim()
    }
  } catch {}
}

async function fb(p) {
  const url = `${API_BASE}${p}${p.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(process.env.META_ADS_TOKEN)}`
  const r = await fetch(url)
  const j = await r.json()
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(j.error || j)}`)
  return j
}

loadEnvLocal()
if (!process.env.META_ADS_TOKEN || !process.env.META_AD_ACCOUNT_ID) {
  console.error('Missing META_ADS_TOKEN or META_AD_ACCOUNT_ID — see .env.local')
  process.exit(1)
}

const adAccount = process.env.META_AD_ACCOUNT_ID

const campaigns = (await fb(`/${adAccount}/campaigns?fields=id,name,status,effective_status&limit=200`)).data || []
const c = campaigns.find((x) => x.name === CAMPAIGN_NAME)
if (!c) {
  console.log('Campaign not found. Did you run scripts/meta-ads-setup.mjs?')
  process.exit(0)
}

const adsets = (await fb(`/${adAccount}/adsets?fields=id,name,status,effective_status,daily_budget,bid_strategy&limit=200`)).data || []
const s = adsets.find((x) => x.name === ADSET_NAME)

const insights = await fb(
  `/${c.id}/insights?fields=spend,impressions,clicks,actions,cost_per_action_type&date_preset=last_7d`,
).catch(() => ({ data: [] }))
const i = insights.data?.[0] || {}
const leads = (i.actions || []).find((a) => a.action_type === 'lead')?.value || '0'
const cpl = (i.cost_per_action_type || []).find((a) => a.action_type === 'lead')?.value || 'n/a'

console.log('Campaign:', c.name)
console.log('  id:                ', c.id)
console.log('  status:            ', c.status, `(effective: ${c.effective_status})`)
console.log('Ad set:  ', s?.name || '(none)')
if (s) {
  console.log('  id:                ', s.id)
  console.log('  status:            ', s.status, `(effective: ${s.effective_status})`)
  console.log('  daily budget:      ', s.daily_budget ? `$${(Number(s.daily_budget) / 100).toFixed(2)}` : 'n/a')
  console.log('  bid strategy:      ', s.bid_strategy)
}
console.log('Last 7d:')
console.log('  spend:             ', i.spend ? `$${i.spend}` : '$0.00')
console.log('  impressions:       ', i.impressions || '0')
console.log('  clicks:            ', i.clicks || '0')
console.log('  leads:             ', leads)
console.log('  cost per lead:     ', cpl)

if (s && s.effective_status !== 'ACTIVE' && c.effective_status !== 'ACTIVE') {
  console.log('\nNote: campaign + ad set are PAUSED. No spend until you activate.')
}
