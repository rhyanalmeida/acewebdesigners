// Create the Meta ad: upload your contractor video → create AdCreative with the
// copy from docs/contractor-ad-creative.md → attach as a PAUSED Ad inside the
// existing ad set. After this runs you only need to flip Active to spend.
//
// Usage:
//   node scripts/meta-ads-create-ad.mjs <path-to-video.mp4>
//
// Optional flags:
//   --page <id_or_name>   Override which Facebook Page the ad runs from
//                         (default: auto-pick page matching "Ace Web Designers")
//   --instagram <id>      Override Instagram account id
//   --skip-video          Use an existing uploaded video by ID (--video-id required)
//   --video-id <id>       Reuse a previously uploaded video (skips upload)
//
// Required env (.env.local):
//   META_ADS_TOKEN, META_AD_ACCOUNT_ID, META_DATASET_ID

import { readFileSync, statSync, createReadStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const API_VERSION = 'v21.0'
const API_BASE = `https://graph.facebook.com/${API_VERSION}`
const ADSET_NAME = 'Contractors — US — Advantage+ Audience — $20/day'
const AD_NAME = 'Contractor Free Website — Video v1'

// Copy lifted from docs/contractor-ad-creative.md (keep in sync if you edit there).
const PRIMARY_TEXT = `Most contractors are losing $50k+ in jobs every year because their website looks like it's from 2005. We design a custom website for your contracting business — and you don't pay a dollar until you love it.

30-min call. Real designer (not a sales rep). For established US contractors only.

Book your free consultation below ↓`

const HEADLINE = 'Free Website for Contractors'
const DESCRIPTION = 'Real designer · No payment until you love it'
const CTA_TYPE = 'BOOK_TRAVEL' // Meta's "Book Now" enum is BOOK_TRAVEL despite the name
const DESTINATION_URL =
  'https://acewebdesigners.com/contractorlanding?utm_source=meta&utm_medium=cpc&utm_campaign=contractor_leadgen&utm_content=video_v1'

// ──────────────────────────────────────────────────────────────────────────────

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

async function fbGet(p) {
  const sep = p.includes('?') ? '&' : '?'
  const url = `${API_BASE}${p}${sep}access_token=${encodeURIComponent(process.env.META_ADS_TOKEN)}`
  const r = await fetch(url)
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(`Meta GET ${p} → ${r.status}: ${JSON.stringify(j.error || j)}`), { meta: j })
  return j
}

async function fbPost(p, body, { multipart } = {}) {
  const url = `${API_BASE}${p}`
  let opts
  if (multipart) {
    const form = new FormData()
    form.set('access_token', process.env.META_ADS_TOKEN)
    for (const [k, v] of Object.entries(body)) {
      if (v && typeof v === 'object' && v.constructor.name === 'Blob') form.set(k, v, body._filename || 'video.mp4')
      else if (v != null) form.set(k, typeof v === 'string' ? v : JSON.stringify(v))
    }
    opts = { method: 'POST', body: form }
  } else {
    const params = new URLSearchParams()
    params.set('access_token', process.env.META_ADS_TOKEN)
    for (const [k, v] of Object.entries(body)) {
      if (v != null) params.set(k, typeof v === 'string' ? v : JSON.stringify(v))
    }
    opts = { method: 'POST', body: params, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  }
  const r = await fetch(url, opts)
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(`Meta POST ${p} → ${r.status}: ${JSON.stringify(j.error || j)}`), { meta: j })
  return j
}

// ──────────────────────────────────────────────────────────────────────────────
// Page resolution
// ──────────────────────────────────────────────────────────────────────────────

async function resolvePage(adAccount, override) {
  const r = await fbGet(`/${adAccount}/promote_pages?fields=id,name,instagram_business_account&limit=200`)
  const pages = r.data || []
  if (pages.length === 0) {
    // Fall back to /me/accounts which lists Pages the token's user manages
    const me = await fbGet('/me/accounts?fields=id,name,instagram_business_account&limit=200')
    pages.push(...(me.data || []))
  }
  if (pages.length === 0) throw new Error('No Facebook Pages found for this token. Token needs pages_show_list + the user must manage at least one Page.')

  let chosen
  if (override) {
    chosen = pages.find((p) => p.id === override || p.name?.toLowerCase().includes(override.toLowerCase()))
    if (!chosen) throw new Error(`Page "${override}" not found among: ${pages.map((p) => p.name).join(', ')}`)
  } else {
    chosen = pages.find((p) => /ace\s*web\s*designers/i.test(p.name || '')) || pages[0]
  }
  return chosen
}

async function findAdSetByName(adAccount, name) {
  const r = await fbGet(`/${adAccount}/adsets?fields=id,name,status&limit=200`)
  return (r.data || []).find((s) => s.name === name) || null
}

// ──────────────────────────────────────────────────────────────────────────────
// Video upload + processing wait
// ──────────────────────────────────────────────────────────────────────────────

async function uploadVideo(adAccount, videoPath) {
  const stats = statSync(videoPath)
  console.log(`[upload] ${path.basename(videoPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)

  // For files <50MB use simple upload. Larger files require chunked session API
  // (skipped here — guidance below if needed).
  if (stats.size > 50 * 1024 * 1024) {
    throw new Error(`Video is ${(stats.size / 1024 / 1024).toFixed(0)}MB. Files >50MB need Meta's chunked upload session — re-encode smaller, or implement /uploads session here.`)
  }

  const buf = readFileSync(videoPath)
  // Use Blob for FormData compatibility
  const blob = new Blob([buf], { type: 'video/mp4' })
  const r = await fbPost(`/${adAccount}/advideos`, { source: blob, _filename: path.basename(videoPath) }, { multipart: true })
  console.log(`✓ Video uploaded: ${r.id}`)
  return r.id
}

async function waitForVideoReady(videoId, timeoutMs = 5 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs
  let lastStatus = ''
  while (Date.now() < deadline) {
    const r = await fbGet(`/${videoId}?fields=status,published`)
    const s = r.status?.video_status || r.status
    if (s !== lastStatus) {
      console.log(`[video] status: ${s}`)
      lastStatus = s
    }
    if (s === 'ready') return
    if (s === 'error') throw new Error('Meta rejected the video. Check format / codec / dimensions.')
    await new Promise((res) => setTimeout(res, 5000))
  }
  throw new Error(`Video processing timed out after ${timeoutMs / 1000}s (id ${videoId})`)
}

// ──────────────────────────────────────────────────────────────────────────────
// Creative + Ad
// ──────────────────────────────────────────────────────────────────────────────

async function getVideoThumbnail(videoId) {
  // Meta auto-generates 5-10 thumbnail candidates after processing.
  // Pick the preferred one (or first), use its uri as image_url.
  const r = await fbGet(`/${videoId}/thumbnails`)
  const thumbs = r.data || []
  if (!thumbs.length) throw new Error(`Video ${videoId} has no thumbnails yet (may need more processing time)`)
  const preferred = thumbs.find((t) => t.is_preferred) || thumbs[0]
  return preferred.uri
}

async function createAdCreative(adAccount, page, videoId) {
  const thumbnailUrl = await getVideoThumbnail(videoId)
  console.log(`     thumbnail: ${thumbnailUrl.slice(0, 80)}...`)
  const objectStorySpec = {
    page_id: page.id,
    video_data: {
      video_id: videoId,
      image_url: thumbnailUrl,
      title: HEADLINE,
      message: PRIMARY_TEXT,
      link_description: DESCRIPTION,
      call_to_action: {
        type: CTA_TYPE,
        value: { link: DESTINATION_URL },
      },
    },
  }
  if (page.instagram_business_account?.id) {
    objectStorySpec.instagram_actor_id = page.instagram_business_account.id
  }
  const r = await fbPost(`/${adAccount}/adcreatives`, {
    name: 'Contractor Free Website — Creative v1',
    object_story_spec: objectStorySpec,
    degrees_of_freedom_spec: {
      creative_features_spec: {
        standard_enhancements: { enroll_status: 'OPT_IN' },
      },
    },
  })
  console.log(`✓ Creative created: ${r.id}`)
  return r.id
}

async function createAd(adAccount, adsetId, creativeId) {
  const r = await fbPost(`/${adAccount}/ads`, {
    name: AD_NAME,
    adset_id: adsetId,
    creative: { creative_id: creativeId },
    status: 'PAUSED',
  })
  console.log(`✓ Ad created: ${r.id}`)
  return r.id
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

loadEnvLocal()
if (!process.env.META_ADS_TOKEN || !process.env.META_AD_ACCOUNT_ID) {
  console.error('Missing META_ADS_TOKEN or META_AD_ACCOUNT_ID in .env.local')
  process.exit(1)
}

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(`--${name}`)
  return i > -1 ? args[i + 1] : null
}
const has = (name) => args.includes(`--${name}`)

const videoPath = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'))
const pageOverride = flag('page')
const skipVideo = has('skip-video')
const videoIdOverride = flag('video-id')

if (!videoPath && !skipVideo) {
  console.error('Usage: node scripts/meta-ads-create-ad.mjs <path-to-video.mp4>')
  console.error('   or: node scripts/meta-ads-create-ad.mjs --skip-video --video-id <id>')
  process.exit(1)
}

try {
  const adAccount = process.env.META_AD_ACCOUNT_ID

  console.log('[1/5] resolving Facebook Page…')
  const page = await resolvePage(adAccount, pageOverride)
  console.log(`     using page: ${page.name} (${page.id})`)
  if (page.instagram_business_account?.id) console.log(`     IG account: ${page.instagram_business_account.id}`)

  console.log('[2/5] looking up ad set…')
  const adset = await findAdSetByName(adAccount, ADSET_NAME)
  if (!adset) throw new Error(`Ad set not found: "${ADSET_NAME}". Run npm run meta-ads:setup first.`)
  console.log(`     ad set: ${adset.id}`)

  let videoId = videoIdOverride
  if (!skipVideo) {
    console.log('[3/5] uploading video…')
    videoId = await uploadVideo(adAccount, videoPath)
    console.log('[4/5] waiting for Meta to process video (can take 1–3 min)…')
    await waitForVideoReady(videoId)
  } else {
    console.log('[3-4/5] skipping upload, using existing video id ' + videoId)
  }

  console.log('[5/5] creating creative + ad (PAUSED)…')
  const creativeId = await createAdCreative(adAccount, page, videoId)
  const adId = await createAd(adAccount, adset.id, creativeId)

  console.log('\n──────────────────────────────────────────────────────')
  console.log(' ✓ Ad created. PAUSED. No spend until you flip Active.')
  console.log('──────────────────────────────────────────────────────')
  console.log(`Ad:        ${adId}`)
  console.log(`Creative:  ${creativeId}`)
  console.log(`Video:     ${videoId}`)
  console.log(`Ad set:    ${adset.id}`)
  console.log('\nReview in Ads Manager:')
  console.log(`  https://adsmanager.facebook.com/adsmanager/manage/ads?act=${adAccount.replace(/^act_/, '')}`)
  console.log('\nWhen ready to spend $20/day:')
  console.log('  1. Settle billing on the ad account (status was UNSETTLED)')
  console.log('  2. Flip Campaign + Ad Set + Ad to Active')
} catch (err) {
  console.error('\n[meta-ads-create-ad] failed:', err.message)
  if (err.meta) console.error('Full Meta error:', JSON.stringify(err.meta, null, 2))
  process.exit(1)
}
