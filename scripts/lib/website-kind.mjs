// Classify a Google Maps listing's website link. Shared by the Apify scraper, the Playwright scraper
// (scrape-places.mjs) and the importer, so "what counts as a real website" is decided in ONE place.
//
//   none    — no website on the listing (the "build you a site" target)
//   social  — only a Facebook/Instagram/Yelp/Angi/HomeAdvisor/Nextdoor/Houzz/… link
//   real    — a real business website (the redesign angle)

export const SOCIAL_RE = /(facebook\.com|fb\.com|instagram\.com|yelp\.com|angi\.com|angieslist\.com|homeadvisor\.com|nextdoor\.com|houzz\.com|thumbtack\.com|linktr\.ee|google\.com\/maps|business\.site|tiktok\.com|doordash\.com|ubereats\.com|grubhub\.com|toasttab\.com|square\.site|clover\.com|menufy\.com|slicelife\.com|order\.online|chownow\.com)/i

export function classifyWebsite(url) {
  const u = (url || '').trim()
  if (!u) return 'none'
  if (SOCIAL_RE.test(u)) return 'social'
  return 'real'
}
