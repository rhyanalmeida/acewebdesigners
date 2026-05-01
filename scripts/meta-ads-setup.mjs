// Create a Meta lead-gen campaign + ad set as PAUSED drafts via the Marketing API.
// You upload the video as a new ad inside the ad set; everything else is decided.
//
// Usage:
//   node scripts/meta-ads-setup.mjs           # idempotent create
//   node scripts/meta-ads-setup.mjs --delete  # tear down what we created
//
// Required env (from .env.local — gitignored):
//   META_ADS_TOKEN          System User token with ads_management permission
//   META_AD_ACCOUNT_ID      e.g. act_1234567890123456 (with the act_ prefix)
//   META_DATASET_ID         the contractor pixel/dataset id (default: 4230021860577001)

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// ──────────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────────

const API_VERSION = 'v21.0'
const API_BASE = `https://graph.facebook.com/${API_VERSION}`

const CAMPAIGN_NAME = 'Contractor Lead Gen — Free Website Offer'
const ADSET_NAME = 'Contractors — US — Advantage+ Audience — $20/day'
const DAILY_BUDGET_CENTS = 2000 // $20.00

// ──────────────────────────────────────────────────────────────────────────────
// .env.local loader (no dotenv dep — keep it tight)
// ──────────────────────────────────────────────────────────────────────────────

function loadEnvLocal() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const envPath = path.join(here, '..', '.env.local')
  try {
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const [, key, val] = m
      if (!process.env[key]) process.env[key] = val.replace(/^["']|["']$/g, '').replace(/\s+#.*$/, '').trim()
    }
  } catch {
    // No .env.local — fall through; user can also set env directly.
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Marketing API helper
// ──────────────────────────────────────────────────────────────────────────────

async function fb(path, { method = 'GET', body } = {}) {
  const url = `${API_BASE}${path}`
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) {
    // Marketing API takes form-encoded for writes; fields with objects must be JSON-stringified.
    const params = new URLSearchParams()
    params.set('access_token', process.env.META_ADS_TOKEN)
    for (const [k, v] of Object.entries(body)) {
      params.set(k, typeof v === 'string' ? v : JSON.stringify(v))
    }
    opts.body = params
    opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'
  } else {
    opts.headers = { Authorization: `Bearer ${process.env.META_ADS_TOKEN}` }
  }
  const res = await fetch(url, opts)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`Meta API ${res.status}: ${JSON.stringify(json.error || json)}`)
    err.meta = json
    err.status = res.status
    throw err
  }
  return json
}

// ──────────────────────────────────────────────────────────────────────────────
// Idempotent lookup helpers
// ──────────────────────────────────────────────────────────────────────────────

async function findCampaignByName(adAccount, name) {
  const r = await fb(`/${adAccount}/campaigns?fields=id,name,status&limit=200`)
  return (r.data || []).find((c) => c.name === name) || null
}

async function findAdSetByName(adAccount, name) {
  const r = await fb(`/${adAccount}/adsets?fields=id,name,status,campaign_id&limit=200`)
  return (r.data || []).find((s) => s.name === name) || null
}

// ──────────────────────────────────────────────────────────────────────────────
// Main flows
// ──────────────────────────────────────────────────────────────────────────────

async function setup() {
  const adAccount = process.env.META_AD_ACCOUNT_ID
  const datasetId = process.env.META_DATASET_ID || '4230021860577001'

  console.log(`[setup] ad account: ${adAccount}`)
  console.log(`[setup] dataset:    ${datasetId}`)

  // 1. Campaign
  let campaign = await findCampaignByName(adAccount, CAMPAIGN_NAME)
  if (campaign) {
    console.log(`[setup] campaign exists: ${campaign.id} (status=${campaign.status})`)
  } else {
    const r = await fb(`/${adAccount}/campaigns`, {
      method: 'POST',
      body: {
        name: CAMPAIGN_NAME,
        objective: 'OUTCOME_LEADS',
        status: 'PAUSED',
        special_ad_categories: [],
        buying_type: 'AUCTION',
        // Required by Meta when not using a campaign-level budget.
        // false = each ad set has its own independent budget (we want $20/day on the one ad set).
        is_adset_budget_sharing_enabled: false,
      },
    })
    campaign = { id: r.id, name: CAMPAIGN_NAME, status: 'PAUSED' }
    console.log(`✓ Campaign created: ${campaign.id}`)
  }

  // 2. Ad set
  let adset = await findAdSetByName(adAccount, ADSET_NAME)
  if (adset) {
    console.log(`[setup] ad set exists: ${adset.id} (status=${adset.status})`)
  } else {
    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const r = await fb(`/${adAccount}/adsets`, {
      method: 'POST',
      body: {
        name: ADSET_NAME,
        campaign_id: campaign.id,
        status: 'PAUSED',
        daily_budget: DAILY_BUDGET_CENTS,
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'OFFSITE_CONVERSIONS',
        promoted_object: { pixel_id: datasetId, custom_event_type: 'LEAD' },
        targeting: {
          geo_locations: { countries: ['US'] },
          age_min: 25,
          age_max: 65,
          targeting_automation: { advantage_audience: 1 },
          publisher_platforms: ['facebook', 'instagram'],
          facebook_positions: ['feed', 'story', 'facebook_reels'],
          instagram_positions: ['stream', 'story', 'reels', 'explore'],
          device_platforms: ['mobile', 'desktop'],
        },
        start_time: startTime,
      },
    })
    adset = { id: r.id, name: ADSET_NAME, status: 'PAUSED' }
    console.log(`✓ Ad set created: ${adset.id}`)
  }

  console.log('\n──────────────────────────────────────────────────────')
  console.log(' ✓ Setup complete. Both campaign + ad set are PAUSED.')
  console.log('──────────────────────────────────────────────────────')
  console.log(`Campaign:  ${campaign.id}`)
  console.log(`Ad set:    ${adset.id}`)
  console.log('\nNext: upload your contractor video as a new ad in this ad set:')
  console.log(`  1. https://www.facebook.com/adsmanager/manage/ads?act=${adAccount.replace(/^act_/, '')}`)
  console.log(`  2. Find ad set "${ADSET_NAME}" → Create Ad`)
  console.log('  3. Single Video → upload your MP4')
  console.log('  4. Headline: "Free Custom Website for Contractors"')
  console.log('  5. Primary text: your hook (see plan for guidance)')
  console.log('  6. CTA: "Book Now"')
  console.log('  7. Destination URL:')
  console.log('     https://acewebdesigners.com/contractorlanding?utm_source=meta&utm_medium=cpc&utm_campaign=contractor_leadgen')
  console.log('  8. Save & Publish the ad')
  console.log('  9. Flip ad set + campaign to Active to start spending $20/day')
}

/**
 * Look up a Meta targeting term (interest / job title / behavior) by name.
 * Returns { id, name } of the top match, or null if Meta has no record.
 *
 * Behaviors aren't searchable via /search; pass the known stable ID directly.
 */
async function searchTargeting(type, query) {
  try {
    const r = await fb(`/search?type=${type}&q=${encodeURIComponent(query)}&limit=5`)
    const top = (r.data || [])[0]
    return top ? { id: top.id, name: top.name } : null
  } catch (err) {
    console.warn(`[targeting] search "${query}" failed:`, err.message)
    return null
  }
}

/**
 * Tighten the existing ad set's targeting to seed Advantage+'s algo toward
 * paying contracting business owners (vs. freebie hunters / W-2 employees).
 *
 * Idempotent: re-running just re-PUTs the same shape.
 */
async function updateTargeting() {
  const adAccount = process.env.META_AD_ACCOUNT_ID
  const adset = await findAdSetByName(adAccount, ADSET_NAME)
  if (!adset) {
    console.error(`No ad set named "${ADSET_NAME}" — run setup first.`)
    process.exit(1)
  }
  console.log(`[update-targeting] ad set: ${adset.id}`)

  // Look up interests / job titles by name (Meta IDs differ per locale).
  // Each lookup is best-effort — if Meta has no record we just drop it from
  // the suggestions and Advantage+ still works.
  console.log('[update-targeting] resolving targeting IDs from Meta…')
  const construction = await searchTargeting('adinterest', 'Construction')
  const homeImprovement = await searchTargeting('adinterest', 'Home improvement')
  const jobOwner = await searchTargeting('adworkposition', 'Owner')
  const jobFounder = await searchTargeting('adworkposition', 'Founder')
  const jobPresident = await searchTargeting('adworkposition', 'President')
  const jobCeo = await searchTargeting('adworkposition', 'CEO')

  // Behavior with stable global ID. Meta deprecated detailed targeting
  // EXCLUSIONS for ad sets in 2024 — Job hunting exclusion no longer allowed.
  // Advantage+ Audience handles negative inference automatically.
  const SMB_OWNERS_BEHAVIOR = { id: '6002714898572', name: 'Small business owners' }

  const interests = [construction, homeImprovement].filter(Boolean)
  const work_positions = [jobOwner, jobFounder, jobPresident, jobCeo].filter(Boolean)

  // Meta requires multi-criteria targeting packaged in flexible_spec when
  // mixing interests/behaviors/work_positions with Advantage+ on; flat
  // top-level fields conflict with the spec.
  const flexibleGroup = {}
  if (interests.length) flexibleGroup.interests = interests
  if (work_positions.length) flexibleGroup.work_positions = work_positions
  flexibleGroup.behaviors = [SMB_OWNERS_BEHAVIOR]

  // With Advantage+ Audience ON, Meta caps age controls (min ≤ 25, max ≥ 65).
  // Keep the broad range; the interests/work_positions/behaviors below are
  // what actually steer Meta's algo toward established contractors.
  const targeting = {
    geo_locations: { countries: ['US'] },
    age_min: 25,
    age_max: 65,
    targeting_automation: { advantage_audience: 1 },
    publisher_platforms: ['facebook', 'instagram'],
    facebook_positions: ['feed', 'story', 'facebook_reels'],
    instagram_positions: ['stream', 'story', 'reels', 'explore'],
    device_platforms: ['mobile', 'desktop'],
    flexible_spec: [flexibleGroup],
  }

  console.log('[update-targeting] applying:')
  console.log(`  age:       ${targeting.age_min}-${targeting.age_max}`)
  console.log(`  interests: ${interests.map((i) => i.name).join(', ') || '(none resolved)'}`)
  console.log(`  positions: ${work_positions.map((j) => j.name).join(', ') || '(none resolved)'}`)
  console.log(`  behaviors: ${(flexibleGroup.behaviors || []).map((b) => b.name).join(', ')}`)
  console.log('  exclude:   (Meta deprecated detailed exclusions — Advantage+ handles negative inference)')

  await fb(`/${adset.id}`, { method: 'POST', body: { targeting } })
  console.log(`✓ Ad set ${adset.id} targeting updated.`)
}

async function teardown() {
  const adAccount = process.env.META_AD_ACCOUNT_ID
  const adset = await findAdSetByName(adAccount, ADSET_NAME)
  if (adset) {
    await fb(`/${adset.id}`, { method: 'DELETE' })
    console.log(`✓ Deleted ad set ${adset.id}`)
  }
  const campaign = await findCampaignByName(adAccount, CAMPAIGN_NAME)
  if (campaign) {
    await fb(`/${campaign.id}`, { method: 'DELETE' })
    console.log(`✓ Deleted campaign ${campaign.id}`)
  }
  if (!adset && !campaign) console.log('Nothing to delete.')
}

// ──────────────────────────────────────────────────────────────────────────────
// Entry
// ──────────────────────────────────────────────────────────────────────────────

loadEnvLocal()

if (!process.env.META_ADS_TOKEN) {
  console.error('Missing META_ADS_TOKEN. Add it to .env.local. See plan for how to mint a System User token.')
  process.exit(1)
}
if (!process.env.META_AD_ACCOUNT_ID) {
  console.error('Missing META_AD_ACCOUNT_ID. Add it to .env.local (with the act_ prefix).')
  process.exit(1)
}

const action = process.argv.includes('--delete')
  ? teardown
  : process.argv.includes('--update-targeting')
    ? updateTargeting
    : setup

action().catch((err) => {
  console.error('\n[meta-ads-setup] failed:', err.message)
  if (err.meta) console.error('Full Meta error:', JSON.stringify(err.meta, null, 2))
  process.exit(1)
})
