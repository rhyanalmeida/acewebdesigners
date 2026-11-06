// Pure helpers for the Playwright Google Maps scraper (scrape-places.mjs). No I/O — vitest-covered.

/**
 * Stable id from a Maps place URL. Prefers Google's real Place ID (`!19sChIJ…` — the same `placeId`
 * Apify emits, so rows dedupe against prospects imported from Apify via `gmaps_place_id`), then the
 * `0x…:0x…` feature id in `!1s<ftid>`, then the /place/<name> segment.
 */
export function placeIdFromHref(href) {
  const g = (href || '').match(/!19s(ChIJ[A-Za-z0-9_-]+)/)
  if (g) return g[1]
  const m = (href || '').match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i)
  if (m) return m[1].toLowerCase()
  const n = (href || '').match(/\/maps\/place\/([^/?#]+)/)
  return n ? `name:${decodeURIComponent(n[1]).toLowerCase()}` : ''
}

/** "4.9(922)" / "4.6 (1,080)" → { rating: 4.9, reviews: 922 }. Missing → nulls. */
export function parseRating(text) {
  const m = (text || '').match(/(\d\.\d)\s*\(?\s*([\d,]+)\s*\)?/)
  if (!m) return { rating: null, reviews: null }
  return { rating: Number(m[1]), reviews: Number(m[2].replace(/,/g, '')) }
}

/** "48 Green St, Worcester, MA 01604" → { street, city, state, zip }. Tolerates trailing spaces, a country, or a missing zip. */
export function parseAddress(text) {
  const parts = (text || '').replace(/,\s*(United States|USA|US)\s*$/i, '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!parts.length) return { street: '', city: '', state: '', zip: '' }
  const last = parts[parts.length - 1]
  const m = last.match(/^([A-Z]{2})(?:\s+(\d{5})(?:-\d{4})?)?$/)
  if (!m || parts.length < 2) return { street: parts.slice(0, -1).join(', '), city: last, state: '', zip: '' }
  return { street: parts.slice(0, -2).join(', '), city: parts[parts.length - 2], state: m[1], zip: m[2] || '' }
}

/** Result-card innerText → category + street. Cards read: name / name / "4.9(922)" / "American restaurant ·  · 48 Green St" / hours… */
export function parseCardText(text) {
  const lines = (text || '').split('\n').map((s) => s.trim()).filter(Boolean)
  const catLine = lines.find((l) => l.includes('·') && !/^\d\.\d/.test(l) && !/^(open|closed|opens|closes)/i.test(l)) || ''
  const segs = catLine.split('·').map((s) => s.trim()).filter(Boolean)
  const category = segs[0] && !/^\d/.test(segs[0]) ? segs[0] : ''
  const street = segs.length > 1 ? segs[segs.length - 1] : ''
  const priceLine = lines.find((l) => /^\$+$/.test(l) || /^\$\d+/.test(l)) || ''
  return { category, street, price: priceLine }
}

/** Build the "search in city" query Maps understands. */
export const mapsQuery = (search, city) => `${search} in ${city}`.replace(/\s+/g, ' ').trim()

/** Phone from a `data-item-id="phone:tel:+17746700933"` attribute or any tel: href. */
export function phoneFromItemId(id) {
  const m = (id || '').match(/tel:(\+?[\d\s().-]+)/)
  return m ? m[1].replace(/[^\d+]/g, '') : ''
}
