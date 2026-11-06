/**
 * Pure planning rules for scripts/auto-wave.mjs — no I/O, vitest-covered (wave-plan.test.mjs).
 *
 *   • CITY_ROTATION  — where the next restaurant waves go (MA-first, then RI/NH/CT/ME/VT)
 *   • pickNextCities — the next N cities not yet scraped
 *   • assessPool     — the "running low" signal + every reason NOT to run (cap, bounce, credits, open wave)
 *   • gates          — yield / verification / bounce thresholds from the playbook (§1, §3)
 *   • parse helpers  — pull counts out of the chain scripts' stdout
 *
 * Numbers that are decisions, not derivations, live here with their reason so they can be changed in one
 * place: docs/COLD_EMAIL_SALES_PLAYBOOK_2026-11-04.md §1 (sizing), §3 (bounce ladder), §4 (thresholds).
 */

/** New leads the restaurant campaign starts per send-day: 2 inboxes × 30 sends ÷ 3 steps ≈ 20
 *  (280 queued ≈ 14 send-days, OUTBOUND_FLOW §9 2026-11-04). Raise with each inbox that joins. */
export const NEW_LEADS_PER_DAY = 20
/** Fire a wave when fewer than this many send-days of fresh leads remain (DB pool + Instantly uncontacted). */
export const LOW_RUNWAY_DAYS = 7
/** Instantly Growth: 1,000 active contacts/month, resets on the 14th (OUTBOUND_FLOW §4). */
export const INSTANTLY_CAP_RESET_DAY = 14
/** Playbook §1 #1: a scrape whose real-website rows yield < 40% emails is the wrong segment — stop. */
export const MIN_EMAIL_YIELD = 0.4
/** Playbook §3: 7-day bounce ≥ 2% on ≥ 50 sends → stop uploads until the list is re-verified. */
export const MAX_BOUNCE_RATE = 0.02
export const MIN_SENDS_FOR_BOUNCE = 50
/** MillionVerifier: 1 credit per address; refuse to start a verify pass we cannot finish. */
export const VERIFY_CREDIT_FLOOR = 25
/** Default wave shape: cities × places. 4 × 80 ≈ 320 places → ~40% emails → ~70% ok ≈ 90 leads ≈ one week of
 *  capacity at 2 inboxes (playbook §1: size to capacity, one segment ≤ 200). Stays well under the few-hundred
 *  place mark where one Google Maps session starts drawing CAPTCHAs. */
export const DEFAULT_CITIES_PER_WAVE = 4
export const DEFAULT_MAX_PER_CITY = 80
/** Haiku 5.5 list price per site read (enrich-haiku prints the exact figure per run). */
export const HAIKU_USD_PER_SITE = 0.0004

/** Eastern-MA-first rotation. Cities scraped 2026-11-03/04 (Worcester, Lowell, Framingham, Cambridge, Somerville,
 *  Quincy, Brockton, Boston, the North Shore, Merrimack Valley, Springfield area) are detected from the prospects
 *  table, not listed here — a city only counts as done when it actually produced prospects. */
export const CITY_ROTATION = [
  'Lynn, MA', 'Newton, MA', 'Waltham, MA', 'Malden, MA', 'Medford, MA', 'Brookline, MA', 'Revere, MA', 'Everett, MA', 'Chelsea, MA',
  'Arlington, MA', 'Watertown, MA', 'Woburn, MA', 'Burlington, MA', 'Lexington, MA', 'Belmont, MA', 'Melrose, MA', 'Wakefield, MA', 'Stoneham, MA',
  'Taunton, MA', 'New Bedford, MA', 'Fall River, MA', 'Attleboro, MA', 'Plymouth, MA', 'Weymouth, MA', 'Braintree, MA', 'Randolph, MA', 'Norwood, MA', 'Dedham, MA',
  'Marlborough, MA', 'Leominster, MA', 'Fitchburg, MA', 'Gardner, MA', 'Milford, MA', 'Hudson, MA', 'Westborough, MA', 'Shrewsbury, MA', 'Northborough, MA',
  'Pittsfield, MA', 'Northampton, MA', 'Amherst, MA', 'Westfield, MA', 'Greenfield, MA',
  'Hyannis, MA', 'Falmouth, MA', 'Provincetown, MA', 'Gloucester, MA', 'Newburyport, MA',
  'Providence, RI', 'Warwick, RI', 'Cranston, RI', 'Pawtucket, RI', 'Newport, RI', 'Woonsocket, RI',
  'Nashua, NH', 'Manchester, NH', 'Portsmouth, NH', 'Concord, NH', 'Salem, NH', 'Dover, NH',
  'Hartford, CT', 'New Haven, CT', 'Stamford, CT', 'Norwalk, CT', 'New London, CT', 'Mystic, CT',
  'Portland, ME', 'Burlington, VT',
]

/** "Lynn, MA" ↔ "lynn" (the prospects table stores the bare city). */
export const cityKey = (s) => String(s ?? '').split(',')[0].trim().toLowerCase()

/**
 * Next cities to scrape: rotation order, skipping any whose bare name already has ≥ minProspects
 * prospects (the DB is the record of what was done) and any in `extraDone` (state row / manual).
 */
export function pickNextCities(doneCounts, n = DEFAULT_CITIES_PER_WAVE, { rotation = CITY_ROTATION, extraDone = [], minProspects = 8 } = {}) {
  const done = new Set(extraDone.map(cityKey))
  for (const [city, count] of Object.entries(doneCounts ?? {})) if (Number(count) >= minProspects) done.add(cityKey(city))
  return rotation.filter((c) => !done.has(cityKey(c))).slice(0, n)
}

/** The month-cap reset date strictly after `now` (the 14th), as YYYY-MM-DD. */
export function nextCapReset(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), INSTANTLY_CAP_RESET_DAY))
  if (d <= now) d.setUTCMonth(d.getUTCMonth() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Should a wave run? Returns { low, run, runway_days, reasons[], reason }.
 *   low  — fewer than LOW_RUNWAY_DAYS of fresh leads remain (the trigger)
 *   run  — (low or forced) AND nothing blocks it
 * Blocks, each a readable reason: an open wave, the Instantly month cap at 0 before its reset,
 * 7-day bounce over the line, MillionVerifier credits below the floor.
 */
export function assessPool({
  poolRestaurants = 0, instantlyUncontacted = null, remainingInPlan = null, remainingCheckedAt = null,
  weekSent = 0, weekBounced = 0, verifierCredits = null, openWave = null, perDay = NEW_LEADS_PER_DAY, now = new Date(), force = false,
}) {
  const fresh = poolRestaurants + (instantlyUncontacted ?? 0)
  const runway_days = Math.floor(fresh / perDay)
  const low = runway_days < LOW_RUNWAY_DAYS
  const reasons = []
  if (openWave) reasons.push(`a wave is already ${openWave.status} (${String(openWave.id).slice(0, 8)})`)
  // remaining_in_plan comes from the last upload; it only means "capped" until the next reset date.
  if (remainingInPlan != null && remainingInPlan <= 0 && remainingCheckedAt) {
    const reset = nextCapReset(new Date(remainingCheckedAt))
    if (now.toISOString().slice(0, 10) < reset) reasons.push(`Instantly monthly contact cap is used up until ${reset}`)
  }
  if (weekSent >= MIN_SENDS_FOR_BOUNCE && weekBounced / weekSent >= MAX_BOUNCE_RATE) {
    reasons.push(`7-day bounce ${((100 * weekBounced) / weekSent).toFixed(1)}% ≥ ${MAX_BOUNCE_RATE * 100}% — re-verify the queue before adding leads (playbook §3)`)
  }
  if (verifierCredits != null && verifierCredits < VERIFY_CREDIT_FLOOR) reasons.push(`MillionVerifier has ${verifierCredits} credits (< ${VERIFY_CREDIT_FLOOR}) — top up`)
  const want = force || low
  return {
    low,
    run: want && reasons.length === 0,
    runway_days,
    reasons,
    reason: !want ? `${runway_days} send-days of leads left (trigger at < ${LOW_RUNWAY_DAYS})` : reasons.length ? reasons.join('; ') : `running low — ${runway_days} send-days left`,
  }
}

/** Email yield of a scrape: emails found ÷ rows with a real website (the crawlable ones). */
export const emailYield = (emails, realSites) => (realSites > 0 ? emails / realSites : 0)

/** Batch label for a wave: `2026-11-20-manh-restaurants-auto` (date + states + trade). */
export function batchLabel(search, cities, now = new Date()) {
  const states = [...new Set(cities.map((c) => (c.split(',')[1] ?? '').trim().toLowerCase()).filter(Boolean))]
  return `${now.toISOString().slice(0, 10)}-${states.join('') || 'xx'}-${search.replace(/\s+/g, '-')}s-auto`
}

/** `uploaded=121 duplicates=0 skipped=0 invalid=0 blocklist=0 remaining_in_plan=879` → numbers. */
export function parseUploadLine(stdout) {
  const m = String(stdout ?? '').match(/uploaded=(\d+).*?remaining_in_plan=(\d+|undefined|null)/s)
  if (!m) return null
  return { uploaded: Number(m[1]), remaining_in_plan: /^\d+$/.test(m[2]) ? Number(m[2]) : null }
}
/** verify-emails.mjs tail: `N API calls`, `verify_result: ok=147 · …`, `MillionVerifier credits left: 168`. */
export function parseVerifyOutput(stdout) {
  const s = String(stdout ?? '')
  const credits = s.match(/credits left:\s*(\d+)/)
  const calls = s.match(/(\d+) API calls/)
  const tally = {}
  for (const m of s.matchAll(/\b(ok|catch_all|unknown|invalid|disposable|error)=(\d+)/g)) tally[m[1]] = Number(m[2])
  return { credits: credits ? Number(credits[1]) : null, calls: calls ? Number(calls[1]) : null, tally }
}
/** enrich-haiku.mjs tail: `… ≈ $0.061` */
export function parseHaikuCost(stderr) {
  const m = String(stderr ?? '').match(/≈ \$([\d.]+)/)
  return m ? Number(m[1]) : null
}
