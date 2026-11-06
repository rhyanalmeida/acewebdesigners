// Pure email-hygiene helpers for the outbound list pipeline — no I/O, vitest-covered
// (email-quality.test.mjs). Consumers: enrich-emails.mjs (extract + rank what the crawler finds),
// import-prospects.mjs (clean → junk → agency filters), verify-emails.mjs (never spend a credit on
// junk) and instantly-remove-leads.mjs (normalise the list to pull).
//
// WHY (2026-11-04): the restaurant campaign bounced 4 of its first 27 contacts, and every bounce
// was junk the crawler had regex-scraped out of raw HTML on template-built sites: form
// placeholders (mail@gmail.com, mymail@mailservice.com), a font designer's licence email inside
// the site's CSS (impallari@gmail.com), JSON-in-HTML fragments with escaped newlines
// ("x@y.com\\n\"), chain corporate inboxes, and one web agency's address sitting on several
// unrelated businesses. The rules are deliberately conservative about REAL free-mail
// (gmail / yahoo / comcast …): restaurant owners genuinely run their business from them.

// ── reference lists ─────────────────────────────────────────────────────────

/** Consumer / ISP mailboxes — real inboxes, never junk on their own. */
export const FREE_MAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'rocketmail.com', 'hotmail.com', 'outlook.com',
  'live.com', 'msn.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com', 'comcast.net', 'verizon.net', 'att.net',
  'sbcglobal.net', 'bellsouth.net', 'cox.net', 'charter.net', 'spectrum.net', 'optonline.net', 'optimum.net',
  'earthlink.net', 'juno.com', 'netzero.net', 'rcn.com', 'frontier.com', 'frontiernet.net', 'windstream.net',
  'centurylink.net', 'q.com', 'roadrunner.com', 'rr.com', 'twc.com', 'protonmail.com', 'proton.me', 'pm.me',
  'zoho.com', 'gmx.com', 'gmx.net', 'fastmail.com', 'hey.com', 'duck.com', 'hushmail.com', 'yandex.com',
])

/**
 * Local parts that are form / template placeholders, matched whole. An optional "your"/"my"/
 * "enter"… prefix and a digit suffix are allowed (youremail, my-email, test123, user2).
 */
const PLACEHOLDER_LOCAL_RE =
  /^(?:(?:your|my|our|the|an?|enter|type|insert|add|input|put)[._-]?)?(?:e-?mail(?:[._-]?(?:address|addr|here|id))?|mail|address|name|first[._-]?name|last[._-]?name|full[._-]?name|user[._-]?name|user|example|sample|demo|test(?:ing|er)?|placeholder|dummy|fake|someone|somebody|anyone|nobody|no[._-]?one|person|recipient|sender|unknown|undefined|null|none|nan|tbd|todo|x{3,}|a{3,}|abc|abcd|abcdef|asdf?|qwerty)[0-9]*$/

/** Classic example people: john.doe / jdoe / jsmith … (separators ignored). */
const PLACEHOLDER_NAMES = new Set([
  'johndoe', 'janedoe', 'jdoe', 'jsmith', 'johnsmith', 'janesmith', 'jonsmith', 'johnappleseed',
  'firstnamelastname', 'firstlast', 'namesurname', 'yourname', 'yourfirstname',
])

/** Registrable label (the part right before the TLD) of placeholder / template domains, any TLD. */
const PLACEHOLDER_DOMAIN_LABELS = new Set([
  'example', 'mysite', 'my-site', 'mywebsite', 'my-website', 'mystore', 'my-store', 'myshop', 'mycompany',
  'my-company', 'mybusiness', 'my-business', 'mydomain', 'my-domain', 'myemail', 'mymail', 'mailservice',
  'emailservice', 'mailserver', 'domain', 'yourdomain', 'your-domain', 'yoursite', 'your-site', 'yourwebsite',
  'your-website', 'yourcompany', 'your-company', 'yourbusiness', 'your-business', 'yourstore', 'your-store',
  'yourshop', 'yourname', 'your-name', 'yourbrand', 'yourmail', 'youremail', 'your-email', 'site', 'website',
  'web', 'company', 'business', 'email', 'e-mail', 'test', 'testing', 'address', 'emailaddress', 'email-address',
  'sample', 'demo', 'placeholder', 'template', 'server', 'host', 'provider', 'name', 'customer', 'client',
  'user', 'users', 'nowhere', 'somewhere', 'anywhere', 'none', 'null', 'undefined', 'nan', 'invalid', 'dummy',
  'fake', 'abc', 'xyz', 'asdf', 'qwerty', 'foo', 'bar', 'baz', 'acme', 'xxx', 'aaa', 'localhost', 'local',
  'internal', 'changeme', 'change-me', 'replaceme', 'replace-me', 'blank', 'empty', 'tbd', 'todo', 'here',
])

/** Junk only when paired with a placeholder or generic-role local part (joe@mail.com can be real). */
const CONDITIONAL_PLACEHOLDER_DOMAINS = new Set(['mail.com'])
const GENERIC_ROLE_LOCALS = new Set([
  'info', 'contact', 'hello', 'hi', 'hey', 'admin', 'office', 'support', 'sales', 'help', 'team', 'me', 'mail', 'email',
])

/** RFC 2606 / non-routable TLDs. */
const PLACEHOLDER_TLDS = new Set(['test', 'example', 'invalid', 'localhost', 'local', 'internal', 'lan', 'home', 'onion'])

/**
 * Site builders, hosting, CDNs, fonts / foundries, marketing + restaurant-tech platforms, delivery
 * apps, social networks. An address on these belongs to the vendor, never to the restaurant.
 * Matched against EVERY label of the domain except the TLD (support@webador.com,
 * x@fonts.googleapis.com, help@us.orderspoon.com).
 */
const VENDOR_LABELS = new Set([
  // site builders / hosting / CMS
  'wix', 'wixpress', 'wixsite', 'wixstatic', 'squarespace', 'sqsp', 'godaddy', 'godaddysites', 'secureserver',
  'webador', 'weebly', 'readymag', 'pressable', 'wpengine', 'kinsta', 'getflywheel', 'flywheel', 'alias-solutions',
  'wordpress', 'automattic', 'elementor', 'duda', 'dudamobile', 'jimdo', 'strikingly', 'webflow', 'shopify',
  'myshopify', 'squareup', 'square', 'ueniweb', 'ueni', 'canva', 'hostinger', 'bluehost', 'hostgator', 'siteground',
  'dreamhost', 'namecheap', 'ionos', '1and1', 'cloudflare', 'netlify', 'vercel', 'github', 'gitlab', 'bitbucket',
  'npmjs', 'jquery', 'bootstrapcdn', 'fontawesome', 'googleapis', 'gstatic', 'sentry', 'wixapps', 'web-hosting',
  // fonts / foundries (licence credits travel inside @font-face CSS)
  'fonts', 'font', 'latofonts', 'astigmatic', 'rfuenzalida', 'typekit', 'fontsquirrel', 'fontspring', 'myfonts',
  'dafont', '1001fonts', 'fontshop', 'monotype', 'linotype', 'type-together', 'indiantypefoundry', 'dharmatype',
  'huertatipografica', 'sorkintype', 'newtypography', 'impallari', 'ndiscovered', 'cyreal', 'forthehearts',
  'aldusleaf', 'typemade', 'paratype', 'exljbris', 'theleagueofmoveabletype', 'fontfabric', 'typesetit', 'eyebytes',
  'micahrich',
  // marketing / CRM / email tooling
  'hubspot', 'hubspotemail', 'mailchimp', 'constantcontact', 'klaviyo', 'sendgrid', 'mailgun', 'activecampaign',
  'getresponse', 'aweber', 'brevo', 'sendinblue', 'intercom', 'zendesk', 'freshdesk', 'typeform', 'jotform',
  // restaurant tech / ordering / reservations / delivery
  'bentobox', 'getbento', 'toasttab', 'popmenu', 'clover', 'doordash', 'grubhub', 'ubereats', 'uber', 'postmates',
  'seamless', 'slicelife', 'chownow', 'menufy', 'orderspoon', 'allhungry', 'restaurantwebx', 'spoton', 'upserve',
  'lightspeedhq', 'touchbistro', 'olo', 'ezcater', 'opentable', 'resy', 'exploretock', 'yelp', 'tripadvisor',
  'owner', 'curvpos', 'mobile-webview2', 'order', 'orderonline',
  // big tech / social
  'google', 'facebook', 'fb', 'instagram', 'linkedin', 'tiktok', 'twitter', 'youtube', 'pinterest', 'apple',
  'microsoft', 'adobe', 'w3', 'schema',
])
/** Full domains that don't fit the label rule (none of these ever hosts a restaurant inbox). */
const VENDOR_DOMAINS = new Set(['w3.org', 'schema.org', 'wordpress.org', 'wordpress.com'])

/**
 * National (plus a few New England regional) chains — corporate / store-coded inboxes, not a
 * prospect for a $37/mo website. Short on purpose; extend as they show up in a list.
 */
export const CHAIN_DOMAINS = new Set([
  'bn.com', 'barnesandnoble.com', 'brinker.com', 'chilis.com', 'maggianos.com', 'darden.com', 'olivegarden.com',
  'redlobster.com', 'longhornsteakhouse.com', 'yum.com', 'tacobell.com', 'kfc.com', 'pizzahut.com', 'mcdonalds.com',
  'dunkinbrands.com', 'dunkindonuts.com', 'dunkin.com', 'inspirebrands.com', 'starbucks.com', 'chipotle.com',
  'subway.com', 'dominos.com', 'papajohns.com', 'wendys.com', 'burgerking.com', 'bk.com', 'rbi.com',
  'panerabread.com', 'dennys.com', 'ihop.com', 'applebees.com', 'dinebrands.com', 'outback.com', 'bloominbrands.com',
  'cheesecakefactory.com', 'texasroadhouse.com', 'buffalowildwings.com', 'fiveguys.com', 'wingstop.com',
  'sonicdrivein.com', 'arbys.com', 'popeyes.com', 'chick-fil-a.com', 'cfacorp.com', 'pandaexpress.com', 'qdoba.com',
  'jerseymikes.com', 'firehousesubs.com', 'dairyqueen.com', 'tgifridays.com', 'redrobin.com', 'crackerbarrel.com',
  'goldencorral.com', 'wafflehouse.com', 'friendlys.com', '99restaurants.com', 'bertuccis.com', 'papaginos.com',
  'dangelos.com', 'unos.com', '110grill.com', 'notyouraveragejoes.com', 'burtonsgrill.com',
])

/**
 * Exact addresses that are font-licence credits embedded in @font-face CSS, so they surface on
 * thousands of unrelated sites. The crawler now skips <style> blocks entirely; this list cleans
 * rows that were scraped before it did.
 */
export const KNOWN_JUNK_ADDRESSES = new Set([
  'impallari@gmail.com', 'team@latofonts.com', 'astigma@astigmatic.com', 'hello@rfuenzalida.com',
  'hello@readymag.com', 'matt@pixelspread.com', 'julieta.ulanovsky@gmail.com', 'vern@newtypography.co.uk',
  'mail@iginomarini.com', 'es@forthehearts.net', 'hello@typemade.mx', 'andrew.paglinawan@gmail.com',
  'info@indiantypefoundry.com', 'typesetit@att.net', 'info@dharmatype.com', 'info@type-together.com',
  'juan@huertatipografica.com.ar', 'info@ndiscovered.com', 'a@cyreal.org', 'sebastian@aldusleaf.org',
  'jo.aakerlund@gmail.com', 'yanone@yanone.de', 'jonpinhorn.typedesign@gmail.com', 'eben@sorkintype.com',
  'eben@eyebytes.com', 'micah@micahrich.com', 'caroline@theleagueofmoveabletype.com', 'anna@ancymonic.com',
])

const NOREPLY_LOCAL_RE =
  /^(?:no[._-]?reply|do[._-]?not[._-]?reply|mailer[._-]?daemon|postmaster|bounces?|unsubscribe|abuse|spam|filler|webmaster|hostmaster|privacy|legal|dmca|security|root|daemon)(?:[._+-]|$)/

/** "logo@2x.png", "icon@3x.svg", "x@y.js" — a file name the email regex mistook for an address. */
const ASSET_EXT_RE =
  /\.(?:png|jpe?g|gif|svg|webp|avif|ico|bmp|tiff?|js|mjs|cjs|css|scss|json|map|woff2?|ttf|otf|eot|mp4|webm|mov|mp3|wav|pdf|html?|php|xml|txt|zip)$/

// Real TLDs that START with a generic one — protects them from the run-on cut in cleanEmail.
const KNOWN_TLDS = new Set(['company', 'community', 'computer', 'compare', 'comsec', 'network', 'netbank', 'organic', 'education'])
const RUN_ON_TLD_PREFIXES = ['com', 'net', 'org', 'edu', 'gov', 'info', 'biz']

// ── small utilities ─────────────────────────────────────────────────────────

const ENTITY_NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', commat: '@', period: '.', lowbar: '_', colon: ':', sol: '/', num: '#' }
const ZERO_WIDTH_RE = /[​-‍⁠﻿]/g

/** Decode numeric + the handful of named HTML entities that appear inside obfuscated addresses. */
export function decodeEntities(s) {
  if (typeof s !== 'string') return ''
  let out = s
  for (let pass = 0; pass < 2 && out.includes('&'); pass++) {
    out = out.replace(/&(?:#(\d{1,7})|#x([0-9a-f]{1,6})|([a-z]{1,8}));/gi, (m, dec, hex, name) => {
      if (dec) return safeChar(parseInt(dec, 10))
      if (hex) return safeChar(parseInt(hex, 16))
      return ENTITY_NAMED[name.toLowerCase()] ?? m
    })
  }
  return out
}
function safeChar(cp) {
  return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ''
}

/** "info [at] domain [dot] com" → "info@domain.com" (bracketed forms only — bare " at " is prose). */
export function deobfuscate(s) {
  return String(s ?? '')
    .replace(/\s*[[({<]\s*at\s*[\])}>]\s*/gi, '@')
    .replace(/\s*[[({<]\s*dot\s*[\])}>]\s*/gi, '.')
}

/** Cloudflare's email-protection payload: first byte is the XOR key for the rest. */
export function decodeCfEmail(hex) {
  const h = String(hex ?? '').trim()
  if (!/^[0-9a-f]{4,}$/i.test(h) || h.length % 2) return null
  const key = parseInt(h.slice(0, 2), 16)
  let out = ''
  for (let i = 2; i < h.length; i += 2) out += String.fromCharCode(parseInt(h.slice(i, i + 2), 16) ^ key)
  return out
}

/** Bare lowercase host of a website URL or domain: "https://www.X.com/path" → "x.com". */
export function normalizeHost(website) {
  let s = String(website ?? '').trim().toLowerCase()
  if (!s) return ''
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/^\/\//, '')
  s = s.split(/[/?#]/, 1)[0].split('@').pop().split(':', 1)[0]
  return s.replace(/^www\./, '').replace(/\.$/, '')
}

function domainIn(domain, set) {
  const labels = domain.split('.')
  for (let i = 0; i < labels.length - 1; i++) if (set.has(labels.slice(i).join('.'))) return true
  return false
}
function sameSite(emailDomain, host) {
  return !!host && (emailDomain === host || host.endsWith('.' + emailDomain) || emailDomain.endsWith('.' + host))
}
const SECOND_LEVEL_PUBLIC = new Set(['co', 'com', 'net', 'org', 'ac', 'gov', 'edu'])
function registrableLabel(labels) {
  if (labels.length >= 3 && SECOND_LEVEL_PUBLIC.has(labels[labels.length - 2]) && labels[labels.length - 1].length === 2) {
    return labels[labels.length - 3]
  }
  return labels[labels.length - 2] ?? ''
}
function splitEmail(email) {
  const at = email.lastIndexOf('@')
  return { local: email.slice(0, at), domain: email.slice(at + 1) }
}

// ── 1. cleanEmail ───────────────────────────────────────────────────────────

/**
 * Normalise one scraped value to a lowercase address, or null if it isn't one.
 * Strips surrounding quotes / brackets, a `mailto:` prefix and its `?subject=` tail, HTML entities
 * (`&#64;`), percent-encoding, "[at]/[dot]" obfuscation, zero-width characters, trailing `\`,
 * `\\n`, `\n` and punctuation (the JSON-in-HTML leaks), and text glued to the TLD
 * ("x@y.comPhone"). Syntax check is deliberately strict (ASCII, no "..", TLD alphabetic).
 */
export function cleanEmail(raw) {
  if (raw == null) return null
  let s = decodeEntities(String(raw)).replace(ZERO_WIDTH_RE, '').trim()
  if (!s) return null
  s = s.replace(/^(?:[\s"'`<>()[\]{}\\,;:]|mailto:)+/i, '')
  if (/%[0-9a-f]{2}/i.test(s)) {
    try { s = decodeURIComponent(s) } catch { /* keep the raw form */ }
  }
  s = deobfuscate(s)
  s = s.split(/[?\s]/, 1)[0]
  s = s.replace(/(?:\\+[nrt]|\\+|[\s"'`<>()[\]{},;:!?.])+$/, '')
  // "x@y.comPhone" → "x@y.com" (lower→upper case transition right after a plausible TLD)
  s = s.replace(/(@[^@\s]*\.[a-z]{2,})(?=[A-Z])[^@\s]*$/, '$1')
  s = s.toLowerCase()
  const m = /^([a-z0-9][a-z0-9._%+'-]*)@((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+)([a-z]{2,24})$/.exec(s)
  if (!m) return null
  const local = m[1], body = m[2]
  let tld = m[3]
  if (!KNOWN_TLDS.has(tld)) {
    const cut = RUN_ON_TLD_PREFIXES.find((p) => tld.startsWith(p) && tld.length >= p.length + 2)
    if (cut) tld = cut
  }
  if (local.length > 64 || local.endsWith('.') || local.includes('..') || body.includes('..')) return null
  const email = `${local}@${body}${tld}`
  return email.length > 254 ? null : email
}

// ── 2. isJunkEmail ──────────────────────────────────────────────────────────

/**
 * True when an address can't be a real inbox at the business we scraped it from: form / template
 * placeholders, placeholder domains, vendor + font + hosting + agency + platform domains, chain
 * corporate domains, asset file names, no-reply style local parts, and the known font-licence
 * addresses. Free-mail (gmail / yahoo / comcast …) is NOT junk by itself.
 */
export function isJunkEmail(email) {
  const e = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const at = e.lastIndexOf('@')
  if (at <= 0 || at === e.length - 1) return true
  const { local, domain } = splitEmail(e)
  const labels = domain.split('.')
  const tld = labels[labels.length - 1]
  const body = labels.slice(0, -1)
  const localKey = local.replace(/[._-]/g, '')

  if (KNOWN_JUNK_ADDRESSES.has(e)) return true
  if (ASSET_EXT_RE.test(domain)) return true
  if (NOREPLY_LOCAL_RE.test(local)) return true
  if (PLACEHOLDER_TLDS.has(tld)) return true
  if (PLACEHOLDER_LOCAL_RE.test(local) || PLACEHOLDER_NAMES.has(localKey)) return true
  if (PLACEHOLDER_DOMAIN_LABELS.has(registrableLabel(labels))) return true
  if (domainIn(domain, CONDITIONAL_PLACEHOLDER_DOMAINS) && GENERIC_ROLE_LOCALS.has(local)) return true
  if (body.some((l) => VENDOR_LABELS.has(l))) return true
  if (domainIn(domain, VENDOR_DOMAINS)) return true
  if (domainIn(domain, CHAIN_DOMAINS)) return true
  return false
}

export function isFreeMail(email) {
  const e = typeof email === 'string' ? email.trim().toLowerCase() : ''
  return e.includes('@') && domainIn(splitEmail(e).domain, FREE_MAIL_DOMAINS)
}

// ── 3. extractEmailsFromHtml ────────────────────────────────────────────────

const BLOCK_RE = /<(script|style|noscript|template|svg|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
const UNTERMINATED_BLOCK_RE = /<(?:script|style)\b[^>]*>[\s\S]*$/i
const COMMENT_RE = /<!--[\s\S]*?-->/g
const ANCHOR_MAILTO_RE = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi
const CF_EMAIL_RE = /(?:data-cfemail\s*=\s*["']?|\/cdn-cgi\/l\/email-protection#)([0-9a-f]{4,})/gi
const TAG_RE = /<\/?[A-Za-z][^\s/>]*(?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>|<![^>]*>|<\?[^>]*>/g
const EMAIL_IN_TEXT_RE = /[A-Za-z0-9][A-Za-z0-9._%+'-]*@[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,}/g

/**
 * Addresses a human could see on the page: `mailto:` links and visible text ONLY. Everything that
 * leaked junk before is removed first — <script> (JSON-LD, config blobs), <style> (font-licence
 * comments), <noscript>/<template>/<svg>/<iframe>, HTML comments — and all other attribute
 * values (placeholder=, data-*, content=, value=) go with the tags. Cloudflare-obfuscated
 * addresses are decoded. Output is cleaned, junk-free and deduped, in document order.
 */
export function extractEmailsFromHtml(html) {
  if (typeof html !== 'string' || !html) return []
  const out = new Set()
  const add = (raw) => {
    const e = cleanEmail(raw)
    if (e && !isJunkEmail(e)) out.add(e)
  }
  const h = html.replace(COMMENT_RE, ' ').replace(BLOCK_RE, ' ').replace(UNTERMINATED_BLOCK_RE, ' ')

  for (const m of h.matchAll(ANCHOR_MAILTO_RE)) {
    const v = decodeEntities(m[1] ?? m[2] ?? m[3] ?? '').trim()
    if (!/^mailto:/i.test(v)) continue
    for (const a of v.replace(/^mailto:/i, '').split('?', 1)[0].split(/[,;]/)) add(a)
  }
  for (const m of h.matchAll(CF_EMAIL_RE)) {
    const decoded = decodeCfEmail(m[1])
    if (decoded) add(decoded)
  }
  const text = deobfuscate(decodeEntities(h.replace(TAG_RE, ' ').replace(/<[^>]+>/g, ' ')))
  for (const m of text.matchAll(EMAIL_IN_TEXT_RE)) add(m[0])
  return [...out]
}

// ── 4. rankEmails / pickBestEmail ───────────────────────────────────────────

const PRIMARY_ROLES = new Set([
  'info', 'contact', 'contactus', 'hello', 'hi', 'hey', 'ciao', 'hola', 'office', 'admin', 'owner', 'owners',
  'manager', 'management', 'general', 'inquiries', 'inquiry', 'enquiries', 'team', 'welcome', 'frontdesk', 'reception',
])
const SECONDARY_ROLES = new Set([
  'events', 'event', 'catering', 'cater', 'privateevents', 'parties', 'party', 'press', 'media', 'marketing',
  'advertising', 'ads', 'jobs', 'careers', 'career', 'hr', 'hiring', 'employment', 'feedback', 'billing',
  'accounting', 'accounts', 'accountspayable', 'ap', 'ar', 'invoices', 'invoice', 'vendors', 'vendor', 'purchasing',
  'purchase', 'suppliers', 'supplier', 'membership', 'newsletter', 'orders', 'order', 'reservations', 'reservation',
  'booking', 'bookings', 'sales', 'support', 'help', 'customercare', 'customerservice', 'guestrelations',
  'guestservices', 'social', 'pr', 'donations', 'donate', 'gift', 'giftcards', 'giftcard', 'franchise',
  'franchising', 'investors',
])
const TRADE_WORD_RE =
  /restaurant|ristorante|restaurante|cafe|caffe|coffee|espresso|pizza|pizzeria|grill|grille|bistro|kitchen|cocina|cucina|tavern|taverna|diner|cater|bakery|bakes|deli|sushi|taco|burrito|cantina|trattoria|osteria|brew|bagel|donut|creamery|chowder|lobster|oyster|seafood|steak|chop|burger|bbq|barbecue|wings|noodle|ramen|curry|kebab|gyro|falafel|crepe|waffle|pancake|smoothie|juice|boba|eatery|eats|foods?|hospitality|lounge|market|truck/
const NAME_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'of', 'at', 'in', 'on', 'by', 'to', 'for', 'inc', 'llc', 'co', 'corp', 'company', 'ltd',
  'restaurant', 'restaurants', 'ristorante', 'restaurante', 'cafe', 'caffe', 'coffee', 'pizza', 'pizzeria', 'grill',
  'grille', 'bar', 'tacos', 'taco', 'kitchen', 'bistro', 'diner', 'cantina', 'house', 'inn', 'tavern', 'pub', 'deli',
  'bakery', 'sushi', 'thai', 'chinese', 'mexican', 'italian', 'indian', 'greek', 'american', 'seafood', 'steakhouse',
  'burger', 'burgers', 'chicken', 'bbq', 'new', 'old', 'little', 'big', 'great', 'best', 'family', 'famous',
  'original', 'fresh', 'golden', 'royal', 'sports', 'eatery', 'market', 'lounge', 'club', 'food', 'foods',
])

function longestCommonSubstring(a, b) {
  if (!a || !b) return 0
  let best = 0
  let prev = new Array(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0)
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = prev[j - 1] + 1
        if (cur[j] > best) best = cur[j]
      }
    }
    prev = cur
  }
  return best
}
function nameTokens(name) {
  return String(name ?? '').toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4 && !NAME_STOP_WORDS.has(w))
}
function brandKey(name) {
  return nameTokens(name)[0] ?? ''
}
/** Does a free-mail local part look like it was made for the business rather than a person? */
function isBusinessLikeLocal(local, host, businessName) {
  const letters = local.replace(/[^a-z]/g, '')
  if (TRADE_WORD_RE.test(local)) return true
  const hostLabels = host ? host.split('.').slice(0, -1).filter((l) => l !== 'www') : []
  const tokens = new Set(nameTokens(businessName))
  for (const l of hostLabels) for (const t of l.split(/[^a-z]+/)) if (t.length >= 4) tokens.add(t)
  for (const t of tokens) if (letters.includes(t)) return true
  for (const l of hostLabels) if (longestCommonSubstring(letters, l.replace(/[^a-z]/g, '')) >= 5) return true
  return false
}

/**
 * Order candidates for ONE business, best first. Tiers (documented order, lowest wins):
 *   0  on the business's own domain (email domain == site host, or parent/sub-domain of it)
 *   1  free-mail whose local part references the business (shares a name/host token, ≥5 common
 *      letters with the host, or carries a trade word: fronteragrillchicopee@gmail.com)
 *   2  a generic primary role inbox (info@ / contact@ / hello@ / office@ …) on another domain —
 *      usually the parent restaurant group or management company
 *   3  everything else (a person's free-mail with no business link, a named person elsewhere)
 * Within a tier: primary role inboxes (info@, contact@ …) first, then named people, then
 * low-value role inboxes (events@, press@, jobs@ …); ties break alphabetically so re-runs are
 * deterministic. Junk is not filtered here — pass extractEmailsFromHtml / isJunkEmail output.
 */
export function rankEmails(emails, websiteDomain, { businessName } = {}) {
  const host = normalizeHost(websiteDomain)
  const scored = []
  for (const raw of emails ?? []) {
    const email = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
    if (!email.includes('@')) continue
    const { local, domain } = splitEmail(email)
    let tier = 3
    if (sameSite(domain, host)) tier = 0
    else if (isFreeMail(email) && isBusinessLikeLocal(local, host, businessName)) tier = 1
    else if (PRIMARY_ROLES.has(local)) tier = 2
    const role = PRIMARY_ROLES.has(local) ? -10 : SECONDARY_ROLES.has(local) ? 20 : 0
    scored.push({ email, score: tier * 100 + role })
  }
  scored.sort((a, b) => a.score - b.score || (a.email < b.email ? -1 : a.email > b.email ? 1 : 0))
  const seen = new Set()
  return scored.map((s) => s.email).filter((e) => !seen.has(e) && seen.add(e))
}

/** Best single address for the business, or null. See rankEmails for the order. */
export function pickBestEmail(emails, websiteDomain, opts = {}) {
  return rankEmails(emails, websiteDomain, opts)[0] ?? null
}

// ── 5. findSharedEmails ─────────────────────────────────────────────────────

/**
 * Emails that appear under 2+ distinct businesses (`placeId`; a row without one falls back to its
 * website host) — the signature of a web agency / template vendor whose address was scraped off
 * every client site. Returns a Set of lowercase emails to SKIP.
 *
 * Exempt (one brand with several listings, not an agency), when `website` / `name` are supplied:
 *   (a) every row for the email has the same website host (multi-location chain, one site)
 *   (b) the email's domain IS the website host of one of its rows (a restaurant group's own inbox)
 *   (c) every row's business name starts with the same brand word ("Tacos Lupita Lynn" /
 *       "Tacos Lupita Salem" → "lupita"; generic words like "pizza"/"cafe" don't count)
 * The importer's in-file dedupe then keeps the first row of an exempt email, as before.
 */
export function findSharedEmails(rows) {
  const groups = new Map()
  for (const r of rows ?? []) {
    const email = typeof r?.email === 'string' ? r.email.trim().toLowerCase() : ''
    if (!email.includes('@')) continue
    const host = normalizeHost(r.website)
    const id = (r.placeId != null && String(r.placeId).trim()) || (host ? `host:${host}` : '')
    if (!id) continue
    let g = groups.get(email)
    if (!g) groups.set(email, (g = { ids: new Set(), hosts: new Set(), names: new Set(), rows: 0, withHost: 0, withName: 0 }))
    g.ids.add(id)
    g.rows++
    if (host) { g.hosts.add(host); g.withHost++ }
    const key = brandKey(r.name)
    if (key) { g.names.add(key); g.withName++ }
  }
  const shared = new Set()
  for (const [email, g] of groups) {
    if (g.ids.size < 2) continue
    const { domain } = splitEmail(email)
    const oneSite = g.withHost === g.rows && g.hosts.size === 1
    const ownDomain = [...g.hosts].some((h) => sameSite(domain, h))
    const oneBrand = g.withName === g.rows && g.names.size === 1
    if (oneSite || ownDomain || oneBrand) continue
    shared.add(email)
  }
  return shared
}
