// Derive a greeting name for a scraped prospect whose list carries no first name.
//
//   greetingName({ email, businessName, names }) → 'Parker' | 'Todd' | 'Gardner Road' (fallback)
//
// Order: (1) the email local part, validated against a real first-name list (scripts/data/
// first-names.txt, ~4.9k US names) so "costello81@" or "kammsuc@" never become a name;
// handles "first.last", "first_last", "firstlast" (longest known-name prefix), and strips a
// leading initial ("jking@" → skip, not "King"); role mailboxes (info@, contact@ …) never
// match. (2) Fallback = the business name with legal/trade suffixes trimmed ("Gardner Road
// Company" → "Gardner Road") so "Hi {{first_name}}," still reads naturally. Owner decision
// 2026-09-22: "intelligent guess, last case business name".

const ROLE = new Set(['info', 'contact', 'office', 'sales', 'admin', 'hello', 'support', 'service', 'services',
  'team', 'mail', 'email', 'billing', 'estimate', 'estimates', 'quote', 'quotes', 'jobs', 'careers', 'hr', 'help',
  'inquiries', 'inquiry', 'marketing', 'customerservice', 'frontdesk', 'reception', 'general', 'owner', 'manager',
  'project', 'projects', 'construction', 'build', 'home', 'main', 'company', 'business', 'account', 'accounts',
  'ap', 'ar', 'order', 'orders', 'noreply', 'no-reply', 'webmaster', 'press', 'media', 'ideate', 'design', 'shop',
  'store', 'dispatch', 'scheduling', 'schedule', 'booking', 'bookings', 'welcome', 'lodging', 'rentals'])

const SUFFIX = /\b(llc|inc|co|corp|corporation|company|ltd|limited|group|enterprises?|services?|solutions|construction|contracting|contractors?|builders?|building|remodeling|roofing|plumbing|heating|cooling|hvac|electric|electrical|painting|landscaping|excavation|excavating|paving|masonry|carpentry|design|designs|and sons?|& sons?|of [a-z ]+)\b.*$/i

export function loadNames(text) {
  const set = new Set()
  for (const line of text.split(/\r?\n/)) { const n = line.trim().toLowerCase(); if (n.length >= 3) set.add(n) }
  return set
}

const cap = (s) => s[0].toUpperCase() + s.slice(1)

/** First name from an email local part, or null if nothing is safely a name. */
export function firstNameFromEmail(email, names) {
  const local = String(email ?? '').split('@')[0].toLowerCase().replace(/\+.*$/, '')
  if (!local || ROLE.has(local)) return null
  const tokens = local.split(/[._\-]+/).filter(Boolean)
  const t0 = tokens[0]?.replace(/\d+$/, '')
  if (!t0 || ROLE.has(t0)) return null
  if (t0.length <= 2) return null // an initial ("j" in jking) — the rest is a surname
  if (names.has(t0)) return cap(t0)
  // "toddhardy" / "frankreynoldsjr75": longest known-name prefix (≥4 chars, so "stardif" never
  // becomes "Star" and "patriot…" never "Pat"), leaving ≥4 chars of surname.
  // A business word in the remainder ("kingsseasonalsolutions", "hughesbros") means the prefix
  // is a surname/brand, not a first name.
  const rest = t0
  if (BUSINESS_WORD.test(rest)) return null
  for (let len = Math.min(t0.length - 4, 12); len >= 4; len--) {
    const p = t0.slice(0, len)
    if (names.has(p)) return cap(p)
  }
  return null
}

const BUSINESS_WORD = /(bros|builder|construct|solution|service|contract|roof|paint|plumb|electric|landscap|design|company|group|seasonal|lumber|floor|homes?$|propert|renovat|remodel|excavat|paving|masonry|carpentry|heating|cooling|hvac|septic|fence|lodging|team)/

const LEGAL = /\b(llc|inc|co|corp|corporation|company|ltd|limited|group|enterprises?)\b\.?.*$/i

/**
 * Business name trimmed to something that works after "Hi " — never empty.
 * Stage 1 (always): drop parentheticals, anything after ":" or "/", legal suffixes.
 * Stage 2 (only if ≥2 words remain): drop trade words — "Gardner Road Company" → "Gardner Road",
 * but "Maine Construction Solutions" stays whole rather than becoming "Maine".
 */
export function shortBusinessName(businessName) {
  const raw = String(businessName ?? '').trim()
  if (!raw) return 'there'
  const clean = (s) => s.replace(/[\s,&\-:./]+$/g, '').trim()
  let s = clean(raw.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s*[:/].*$/, '').replace(LEGAL, ''))
  if (s.length < 3) s = clean(raw.replace(LEGAL, '')) || raw
  const t = clean(s.replace(SUFFIX, ''))
  if (t.length >= 3 && t.split(/\s+/).length >= 2) return t
  return s
}

export function greetingName({ email, businessName, names }) {
  return firstNameFromEmail(email, names) ?? shortBusinessName(businessName)
}
