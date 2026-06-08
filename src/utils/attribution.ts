/**
 * Facebook ad-click attribution capture.
 *
 * Our booking form is now same-origin (no cross-origin GHL iframe), so it can
 * read this page's Meta cookies directly. `getAttribution()` returns the click
 * identifiers to POST to the `book` Edge Function, which forwards them to Meta's
 * Conversions API (server-side) alongside the browser pixel's matching event_id.
 *
 *  - `fbclid` — appended by Facebook to the ad-landing URL.
 *  - `fbc` / `fbp` — the browser-only Meta cookies. `fbc` is reconstructed from
 *    `fbclid` when the `_fbc` cookie isn't set yet.
 */

export interface Attribution {
  fbc: string
  fbp: string
  fbclid: string
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[1]) : ''
}

export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return { fbc: '', fbp: '', fbclid: '' }
  const fbclid = new URL(window.location.href).searchParams.get('fbclid') || ''
  const fbc = getCookie('_fbc') || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : '')
  const fbp = getCookie('_fbp')
  return { fbc, fbp, fbclid }
}
