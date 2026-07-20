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
  fbclid?: string
  fbc?: string
  storedAt?: number
}

/** Meta's click attribution window — persist first-touch click ids this long. */
const CLICK_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Best-effort read of the persisted first-touch record (session first, then local). */
function readStored(): StoredAttribution | null {
  for (const store of [sessionStorage, localStorage] as Storage[]) {
    try {
      const raw = store.getItem(STORE_KEY)
      if (!raw) continue
      const parsed = JSON.parse(raw) as StoredAttribution
      if (parsed.storedAt && Date.now() - parsed.storedAt > CLICK_TTL_MS) continue
      return parsed
    } catch {
      /* storage unavailable/corrupt — try the next one */
    }
  }
  return null
}

function writeStored(value: StoredAttribution): void {
  const raw = JSON.stringify(value)
  for (const store of [sessionStorage, localStorage] as Storage[]) {
    try {
      store.setItem(STORE_KEY, raw)
    } catch {
      /* ignore (private mode / quota) */
    }
  }
}

/**
 * Capture first-touch attribution once per session. If the current URL carries
 * any tracked params and we haven't stored a set yet, persist them (+ the full
 * landing URL). Returns the stored (first-touch) set on every later call.
 */
function firstTouch(): StoredAttribution {
  const empty: StoredAttribution = { utm: {}, landingUrl: '' }
  if (typeof window === 'undefined') return empty

  const stored = readStored()

  const params = new URL(window.location.href).searchParams
  const fresh: Record<string, string> = {}
  for (const k of UTM_KEYS) {
    const v = params.get(k)
    if (v) fresh[k] = v.slice(0, 256)
  }
  const liveFbclid = params.get('fbclid') || ''

  // Only (re)store on a real first touch: nothing stored yet AND this load carries
  // params or a click id. fbclid/fbc persist too — the live URL loses them on any
  // SPA navigation or history cleanup, and 3 of the first 5 production leads
  // arrived without one for exactly that reason.
  if (!stored && (Object.keys(fresh).length || liveFbclid)) {
    const record: StoredAttribution = {
      utm: fresh,
      landingUrl: window.location.href,
      fbclid: liveFbclid || undefined,
      fbc: getCookie('_fbc') || (liveFbclid ? `fb.1.${Date.now()}.${liveFbclid}` : undefined),
      storedAt: Date.now(),
    }
    writeStored(record)
    return record
  }

  // Backfill click ids into an older stored record that predates them.
  if (stored && !stored.fbclid && liveFbclid) {
    const record: StoredAttribution = {
      ...stored,
      fbclid: liveFbclid,
      fbc: stored.fbc || getCookie('_fbc') || `fb.1.${Date.now()}.${liveFbclid}`,
      storedAt: stored.storedAt ?? Date.now(),
    }
    writeStored(record)
    return record
  }

  return stored ?? { utm: fresh, landingUrl: window.location.href }
}

export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return { fbc: '', fbp: '', fbclid: '', utm: {}, landingUrl: '' }
  const stored = firstTouch()
  const fbclid = new URL(window.location.href).searchParams.get('fbclid') || stored.fbclid || ''
  const fbc =
    getCookie('_fbc') || stored.fbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : '')
  const fbp = getCookie('_fbp')
  return { fbc, fbp, fbclid, utm: stored.utm, landingUrl: stored.landingUrl || window.location.href }
}
