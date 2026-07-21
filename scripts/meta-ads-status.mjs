// Pull a quick status snapshot for the contractor lead-gen campaign.
// Usage: node scripts/meta-ads-status.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const API_BASE = 'https://graph.facebook.com/v21.0'
// Match by id, not name — names get edited in Ads Manager (the campaign was
// renamed "Free Website Offer For Contractors (6/1/26)" which broke name-matching).
const CAMPAIGN_ID = '120241554190170259'
const ADSET_ID = '120242709687340259'
// Ads are listed from the ad set, never hardcoded — a pinned ad id silently reports a
// PAUSED creative after every relaunch (it did, for the 7/21 captioned ad).

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

const c = await fb(`/${CAMPAIGN_ID}?fields=id,name,status,effective_status`)
const s = await fb(`/${ADSET_ID}?fields=id,name,status,effective_status,daily_budget,bid_strategy`).catch(() => null)
const adList = await fb(
  `/${ADSET_ID}/ads?fields=id,name,status,effective_status,creative{url_tags}&limit=50`,
).catch(() => ({ data: [] }))
const ads = adList.data || []

/** Per-ad last-7d insights, so a relaunch is judged on the ad that's actually running. */
const adInsights = Object.fromEntries(
  await Promise.all(
    ads.map(async (a) => {
      const r = await fb(
        `/${a.id}/insights?fields=spend,impressions,clicks,actions&date_preset=last_7d`,
      ).catch(() => ({ data: [] }))
      return [a.id, r.data?.[0] || {}]
    }),
  ),
)

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
  console.log('  daily budget:      ', s.daily_budget ? `$${(Number(s.daily_budget) / 100).toFixed(2)}` : 'n/a (campaign budget)')
  console.log('  bid strategy:      ', s.bid_strategy || 'n/a')
}
console.log(`Ads in ad set: ${ads.length}`)
for (const a of ads) {
  const ai = adInsights[a.id] || {}
  const adLeads = (ai.actions || []).find((x) => x.action_type === 'lead')?.value || '0'
  const live = a.effective_status === 'ACTIVE'
  console.log(`  ${live ? '▶' : '⏸'} ${a.name}`)
  console.log('     id:              ', a.id)
  console.log('     status:          ', a.status, `(effective: ${a.effective_status})`)
  console.log('     UTM url_tags:    ', a.creative?.url_tags ? 'SET ✓' : 'MISSING — set in Ads Manager → Tracking')
  console.log('     last 7d:         ', `$${ai.spend || '0.00'} · ${ai.impressions || 0} impr · ${ai.clicks || 0} clicks · ${adLeads} leads`)
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
