/**
 * Client-side attribution capture for Meta CAPI deduplication.
 *
 * Captures fbclid / _fbc / _fbp on the landing page and generates a stable
 * event_id stored in sessionStorage. The event_id is passed to two places:
 *   1. The GHL booking iframe as a URL param → GHL captures it as a custom
 *      field → GHL webhook forwards it to our Netlify function → Meta CAPI
 *   2. The client-side Pixel 'Lead' event when booking completes
 *
 * Matching event_ids let Meta dedupe the Pixel event and the CAPI event.
 */

const SS_KEY = 'awd_attribution'
const FBC_COOKIE = '_fbc'
const FBP_COOKIE = '_fbp'

export interface Attribution {
  event_id: string
  fbc: string
  fbp: string
  fbclid: string
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[1]) : ''
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // RFC4122 v4 fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function readStored(): Attribution | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SS_KEY)
    return raw ? (JSON.parse(raw) as Attribution) : null
  } catch {
    return null
  }
}

function writeStored(a: Attribution): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(a))
  } catch {
    // sessionStorage may be blocked (private browsing, 3p cookies off) — ignore
  }
}

/**
 * Initialize attribution for this session. Idempotent — safe to call on every mount.
 * Runs once per session and caches the result. Subsequent calls refresh fbp/fbc
 * from cookies (they may be set by the Pixel after this first ran).
 */
export function initAttribution(): Attribution {
  if (typeof window === 'undefined') {
    return { event_id: '', fbc: '', fbp: '', fbclid: '' }
  }

  const existing = readStored()
  if (existing) {
    // Pixel may have set _fbp after our first run — refresh from cookie.
    const freshFbp = getCookie(FBP_COOKIE)
    if (freshFbp && freshFbp !== existing.fbp) {
      existing.fbp = freshFbp
      writeStored(existing)
    }
    return existing
  }

  const url = new URL(window.location.href)
  const fbclid = url.searchParams.get('fbclid') || ''
  const cookieFbc = getCookie(FBC_COOKIE)
  const fbc = cookieFbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : '')

  const attribution: Attribution = {
    event_id: uuid(),
    fbc,
    fbp: getCookie(FBP_COOKIE),
    fbclid,
  }
  writeStored(attribution)
  return attribution
}

/** Read current attribution. Calls initAttribution to ensure it's populated. */
export function getAttribution(): Attribution {
  return initAttribution()
}

/**
 * Append attribution fields as query params to a URL.
 * Used to inject fbc / fbp / event_id / fbclid into the GHL booking iframe src,
 * so GHL can capture them as custom fields on the contact.
 */
export function appendAttributionToUrl(baseUrl: string): string {
  const a = getAttribution()
  const u = new URL(baseUrl)
  if (a.event_id) u.searchParams.set('event_id', a.event_id)
  if (a.fbc) u.searchParams.set('fbc', a.fbc)
  if (a.fbp) u.searchParams.set('fbp', a.fbp)
  if (a.fbclid) u.searchParams.set('fbclid', a.fbclid)
  return u.toString()
}
