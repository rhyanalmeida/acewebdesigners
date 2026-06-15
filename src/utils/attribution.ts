/**
 * Facebook ad-click attribution capture (client side).
 *
 * Our booking form is same-origin (no cross-origin GHL iframe), so it reads this
 * page's Meta cookies directly. `getAttribution()` returns the click identifiers
 * AND the campaign/ad context to POST to the `lead` / `book` Edge Functions,
 * which forward them to Meta's Conversions API (server-side) alongside the
 * browser pixel's matching event_id.
 *
 *  - `fbclid` — appended by Facebook to the ad-landing URL.
 *  - `fbc` / `fbp` — the browser-only Meta cookies. `fbc` is reconstructed from
 *    `fbclid` when the `_fbc` cookie isn't set yet.
 *  - `utm` — first-touch campaign/ad context, captured from the landing URL per
 *    the Ads Manager URL template (utm_source/medium/campaign/content +
 *    campaign_id/adset_id/ad_id) and persisted to sessionStorage so SPA
 *    navigation (which drops the query string) can't lose it.
 */

export interface Attribution {
  fbc: string
  fbp: string
  fbclid: string
  utm: Record<string, string>
  landingUrl: string
}

/** Marketing + Facebook ad params we capture (mirror of the server ATTRIBUTION_KEYS). */
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'campaign_id',
  'adset_id',
  'ad_id',
] as const

const STORE_KEY = 'awd_attribution'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[1]) : ''
}

interface StoredAttribution {
  utm: Record<string, string>
  landingUrl: string
}

/**
 * Capture first-touch attribution once per session. If the current URL carries
 * any tracked params and we haven't stored a set yet, persist them (+ the full
 * landing URL). Returns the stored (first-touch) set on every later call.
 */
function firstTouch(): StoredAttribution {
  const empty: StoredAttribution = { utm: {}, landingUrl: '' }
  if (typeof window === 'undefined') return empty

  let stored: StoredAttribution | null = null
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    if (raw) stored = JSON.parse(raw) as StoredAttribution
  } catch {
    /* sessionStorage unavailable (private mode) — fall back to live URL */
  }

  const params = new URL(window.location.href).searchParams
  const fresh: Record<string, string> = {}
  for (const k of UTM_KEYS) {
    const v = params.get(k)
    if (v) fresh[k] = v.slice(0, 256)
  }

  // Only (re)store on a real first touch: nothing stored yet AND this load has params.
  if (!stored && Object.keys(fresh).length) {
    stored = { utm: fresh, landingUrl: window.location.href }
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(stored))
    } catch {
      /* ignore */
    }
  }

  return stored ?? { utm: fresh, landingUrl: window.location.href }
}

export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return { fbc: '', fbp: '', fbclid: '', utm: {}, landingUrl: '' }
  const fbclid = new URL(window.location.href).searchParams.get('fbclid') || ''
  const fbc = getCookie('_fbc') || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : '')
  const fbp = getCookie('_fbp')
  const { utm, landingUrl } = firstTouch()
  return { fbc, fbp, fbclid, utm, landingUrl: landingUrl || window.location.href }
}
