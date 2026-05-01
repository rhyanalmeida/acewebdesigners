/**
 * GHL → Meta Conversions API bridge.
 *
 * Receives webhooks from GoHighLevel workflows and forwards conversion events
 * to Meta's Conversions API with proper deduplication against the client-side
 * Pixel via a shared event_id that was captured on the landing page and
 * passed through GHL as a custom field.
 *
 * Endpoint: POST /.netlify/functions/ghl-capi
 *
 * Required env:
 *   META_CAPI_TOKEN  — Meta Conversions API access token (Business Manager → Events Manager → Settings)
 *   META_PIXEL_ID    — Pixel/Dataset ID (defaults to the contractor pixel)
 *
 * Expected body from GHL webhook (flexible — we look in several paths):
 *   event_type    — "lead" | "show" | "purchase" (set as a static field in each GHL webhook action)
 *   email, phone, first_name, last_name, contact_id
 *   fbc, fbp, event_id, fbclid  — captured on landing page, stored as GHL custom fields
 *   value         — opportunity monetaryValue for Purchase events
 */

import crypto from 'node:crypto'
import { getStore } from '@netlify/blobs'

const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || ''
const META_PIXEL_ID = process.env.META_PIXEL_ID || '1548487516424971'
const META_API_VERSION = 'v21.0'

type EventAction = 'lead' | 'show' | 'purchase'

interface MetaUserData {
  em?: string[]
  ph?: string[]
  fn?: string[]
  ln?: string[]
  ct?: string[]
  st?: string[]
  zp?: string[]
  country?: string[]
  external_id?: string[]
  fbc?: string
  fbp?: string
  client_user_agent?: string
  client_ip_address?: string
}

type Dict = Record<string, unknown>

function sha256(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex')
}

function normEmail(v: string): string {
  return v.trim().toLowerCase()
}

function normPhone(v: string): string {
  // Meta wants digits only, no "+"
  return v.replace(/[^0-9]/g, '')
}

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Dict)[key]
    return undefined
  }, obj)
}

/** Pick the first non-empty value from a list of dot-paths. */
function pick(body: unknown, ...paths: string[]): string {
  for (const p of paths) {
    const v = getPath(body, p)
    if (v !== undefined && v !== null && v !== '') return String(v)
  }
  return ''
}

function pickNumber(body: unknown, ...paths: string[]): number {
  const s = pick(body, ...paths)
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function mapEventType(raw: string): { meta: string; action: EventAction } {
  const t = raw.toLowerCase().trim()
  if (['purchase', 'sold', 'paid', 'won'].includes(t)) {
    return { meta: 'Purchase', action: 'purchase' }
  }
  if (['show', 'showed', 'showed_up', 'completeregistration', 'completed'].includes(t)) {
    return { meta: 'CompleteRegistration', action: 'show' }
  }
  return { meta: 'Lead', action: 'lead' }
}

/**
 * Pick the right action_source for the dataset's Test Events filter.
 *
 * `lead` happens on the website (the booking submit) — keep `website` so the
 * pixel and CAPI events land in the same channel and Meta dedups them cleanly.
 *
 * `show` and `purchase` fire from the GHL workflow with no browser involved —
 * `system_generated` is the canonical Meta value for offline events generated
 * by automated CRM/system processes.
 */
function actionSourceFor(action: EventAction): string {
  return action === 'lead' ? 'website' : 'system_generated'
}

interface StashedAttribution {
  fbc?: string
  fbp?: string
  event_id?: string
  fbclid?: string
  stashedAt?: number
  expiresAt?: number
}

/** Returns the stash entry if present and not expired, else null. */
function freshOrNull(v: StashedAttribution | null): StashedAttribution | null {
  if (!v) return null
  if (typeof v.expiresAt === 'number' && v.expiresAt < Date.now()) return null
  return v
}

/**
 * Look up attribution stashed by the browser on booking completion.
 *
 * The browser (`stashAttribution()` in `src/utils/attribution.ts`) writes
 * fbc/fbp/event_id/fbclid under multiple keys; we try each in order until we
 * hit. Wrapped in try/catch — any failure here MUST fall through to the
 * existing 8.0-EMQ behavior, never reject the event.
 */
async function lookupStash(
  email: string,
  contactId: string,
  ip: string,
  ua: string,
): Promise<{ hit: StashedAttribution | null; via: string }> {
  // Strong consistency: stash writes from the browser may have happened
  // moments before this lookup; eventual consistency would miss them.
  const opts = { type: 'json' as const, consistency: 'strong' as const }
  try {
    const store = getStore('attribution')
    if (email) {
      const v = freshOrNull((await store.get(`email:${email.toLowerCase()}`, opts)) as StashedAttribution | null)
      if (v) return { hit: v, via: 'email' }
    }
    if (contactId) {
      const v = freshOrNull((await store.get(`contactid:${contactId}`, opts)) as StashedAttribution | null)
      if (v) return { hit: v, via: 'contactid' }
    }
    if (ip && ua) {
      const key = 'ipua:' + crypto.createHash('sha256').update(ip + ua).digest('hex')
      const v = freshOrNull((await store.get(key, opts)) as StashedAttribution | null)
      if (v) return { hit: v, via: 'ipua' }
    }
    return { hit: null, via: 'miss' }
  } catch (err) {
    console.warn('[ghl-capi] stash lookup failed', err)
    return { hit: null, via: 'error' }
  }
}

// Functions v2 — required for Netlify Blobs context auto-injection on CLI deploys.
export default async (req: Request): Promise<Response> => {
  const json = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })

  // Opt-in shared-secret auth: only enforced when GHL_WEBHOOK_SECRET is set.
  // Add the matching secret to each GHL webhook action's custom-data row
  // (key=`secret`, value=<your secret>) OR send as `x-ghl-secret` header.
  // While unset (default), endpoint stays open — same as today.
  const expectedSecret = process.env.GHL_WEBHOOK_SECRET
  if (expectedSecret) {
    const headerSecret = req.headers.get('x-ghl-secret') || ''
    let bodySecret = ''
    try {
      const peeked = (await req.clone().json()) as Record<string, unknown>
      bodySecret = String((peeked as { secret?: unknown }).secret || '')
    } catch {}
    if (headerSecret !== expectedSecret && bodySecret !== expectedSecret) {
      console.warn('[ghl-capi] auth failed — missing or wrong secret')
      return json(401, { ok: false, error: 'unauthorized' })
    }
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'POST only' })
  }
  if (!META_CAPI_TOKEN) {
    console.error('[ghl-capi] META_CAPI_TOKEN env var is not set')
    return json(500, { error: 'Server not configured' })
  }

  let body: Dict
  try {
    body = (await req.json()) as Dict
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  // --- Event type resolution ---
  const rawEventType = pick(
    body,
    'event_type',
    'customData.event_type',
    'calendar.status',
    'type',
  )
  const { meta: metaEventName, action } = mapEventType(rawEventType)

  // --- Contact fields (try several shapes GHL may send) ---
  // Lenient validation: cap string length, drop clearly invalid values, but
  // never reject the whole event for soft-fail cases — Meta still benefits
  // from any partial identity match. Real GHL traffic always passes.
  const cap = (s: string, n = 256) => (typeof s === 'string' ? s.slice(0, n) : '')
  const rawEmail = cap(pick(body, 'email', 'contact.email'))
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? normEmail(rawEmail) : ''
  const rawPhone = pick(body, 'phone', 'contact.phone', 'phone_raw')
  const phoneDigits = normPhone(rawPhone)
  const phone = phoneDigits.length >= 7 && phoneDigits.length <= 15 ? phoneDigits : ''
  const firstName = cap(pick(body, 'first_name', 'contact.first_name'), 64).trim().toLowerCase()
  const lastName = cap(pick(body, 'last_name', 'contact.last_name'), 64).trim().toLowerCase()
  const contactId = cap(pick(body, 'contact_id', 'contact.id'), 128).trim()
  // Address fields lift Meta match-quality from ~50% (email+phone) to ~80%+.
  // GHL contacts capture these from the booking form and address autocomplete.
  const city = cap(pick(body, 'city', 'contact.city', 'contact.address.city'), 64).trim().toLowerCase().replace(/\s+/g, '')
  const state = cap(pick(body, 'state', 'contact.state', 'contact.address.state'), 32).trim().toLowerCase().replace(/\s+/g, '')
  const zipRaw = cap(pick(body, 'postal_code', 'zip', 'contact.postalCode', 'contact.zip', 'contact.address.postalCode'), 16)
  // Meta wants 5-digit US zip or first 3 of postal — keep digits/letters only, lowercase.
  const zip = zipRaw.replace(/[^a-z0-9]/gi, '').toLowerCase()
  const countryRaw = cap(pick(body, 'country', 'contact.country', 'contact.address.country'), 8).trim().toLowerCase()
  // Normalize to ISO 3166-1 alpha-2 — Meta accepts "us" but most GHL contacts
  // already send "US"/"USA". Map common forms; fall back to first two chars.
  const country = countryRaw === 'usa' || countryRaw === 'united states' ? 'us' : countryRaw.slice(0, 2)

  // --- Attribution (captured on landing page, stored as GHL custom fields) ---
  let fbc = pick(body, 'fbc', 'customData.fbc', 'contact.fbc', 'customFields.fbc')
  let fbp = pick(body, 'fbp', 'customData.fbp', 'contact.fbp', 'customFields.fbp')
  let fbclid = pick(body, 'fbclid', 'customData.fbclid', 'contact.fbclid', 'customFields.fbclid')
  let clientEventId = pick(
    body,
    'event_id',
    'customData.event_id',
    'contact.event_id',
    'customFields.event_id',
  )
  const userAgent = pick(
    body,
    'client_user_agent',
    'user_agent',
    'contact.attributionSource.userAgent',
    'contact.lastAttributionSource.userAgent',
  )
  const ip = pick(
    body,
    'client_ip_address',
    'ip',
    'contact.attributionSource.ip',
    'contact.lastAttributionSource.ip',
  )

  // --- Merge from server-side stash (browser POSTs attribution on booking) ---
  // Only fills in fields the webhook didn't already provide. Never overrides
  // values that came directly from GHL (those are authoritative when present).
  const stashLookup = await lookupStash(email, contactId, ip, userAgent)
  if (stashLookup.hit) {
    if (!fbc && stashLookup.hit.fbc) fbc = stashLookup.hit.fbc
    if (!fbp && stashLookup.hit.fbp) fbp = stashLookup.hit.fbp
    if (!fbclid && stashLookup.hit.fbclid) fbclid = stashLookup.hit.fbclid
    if (!clientEventId && stashLookup.hit.event_id) clientEventId = stashLookup.hit.event_id
  }

  // --- Purchase value (clamp to non-negative; cap absurd outliers at $1M) ---
  const rawValue = pickNumber(body, 'value', 'opportunity.monetaryValue', 'customData.value')
  const value = Math.min(Math.max(rawValue, 0), 1_000_000)

  // --- Event identifiers ---
  const eventTime = Math.floor(Date.now() / 1000)
  const eventId = clientEventId || `${action}_${contactId || 'anon'}_${eventTime}`
  const eventSourceUrl =
    pick(
      body,
      'event_source_url',
      'contact.attributionSource.url',
      'contact.lastAttributionSource.url',
    ) || 'https://acewebdesigners.com/contractorlanding'

  // --- UTM extraction (URL params live in event_source_url; also accept as body fields) ---
  // Useful for splitting performance by ad creative variant in Meta reporting
  // AND for any downstream tool consuming the CAPI event log.
  const utm: Record<string, string> = {}
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  try {
    const sp = new URL(eventSourceUrl).searchParams
    for (const k of utmKeys) {
      const v = sp.get(k) || pick(body, k, `customData.${k}`, `contact.attributionSource.${k.replace('utm_', 'utm')}`)
      if (v) utm[k] = v.slice(0, 256)
    }
  } catch {
    // bad URL — fall through with whatever body provides
    for (const k of utmKeys) {
      const v = pick(body, k, `customData.${k}`)
      if (v) utm[k] = v.slice(0, 256)
    }
  }

  // --- Build Meta user_data (PII hashed with SHA-256) ---
  const userData: MetaUserData = {}
  if (email) userData.em = [sha256(email)]
  if (phone) userData.ph = [sha256(phone)]
  if (firstName) userData.fn = [sha256(firstName)]
  if (lastName) userData.ln = [sha256(lastName)]
  if (city) userData.ct = [sha256(city)]
  if (state) userData.st = [sha256(state)]
  if (zip) userData.zp = [sha256(zip)]
  if (country) userData.country = [sha256(country)]
  if (contactId) userData.external_id = [sha256(contactId)]

  // fbc/fbp MUST NOT be hashed
  if (fbc) {
    userData.fbc = fbc
  } else if (fbclid) {
    userData.fbc = `fb.1.${eventTime * 1000}.${fbclid}`
  }
  if (fbp) userData.fbp = fbp
  if (userAgent) userData.client_user_agent = userAgent
  if (ip) userData.client_ip_address = ip

  // --- Build payload ---
  const testEventCode = pick(body, 'test_event_code', 'customData.test_event_code')
  const payload: Dict = {
    data: [
      {
        event_name: metaEventName,
        event_time: eventTime,
        action_source: actionSourceFor(action),
        event_source_url: eventSourceUrl,
        event_id: eventId,
        user_data: userData,
        custom_data: {
          currency: 'USD',
          ...(metaEventName === 'Purchase' ? { value } : {}),
          ghl_contact_id: contactId,
          ghl_event_type: rawEventType || 'unknown',
          ...utm,
        },
      },
    ],
  }
  if (testEventCode) payload.test_event_code = testEventCode

  // --- Send to Meta CAPI ---
  const url = `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events`
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${META_CAPI_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })
    const respBody = await resp.text()

    if (!resp.ok) {
      console.error('[ghl-capi] Meta CAPI error', resp.status, respBody)
      return json(502, {
        ok: false,
        meta_status: resp.status,
        meta_body: respBody,
      })
    }

    // Log full detail server-side for debugging; keep the public response
    // minimal so an unauthenticated POSTer can't enumerate event_ids/contacts
    // or read Meta's full reply (which echoes pixel_id, fbtrace_id, etc.).
    const utmTag = Object.keys(utm).length ? ` utm=${utm.utm_source || ''}/${utm.utm_campaign || ''}/${utm.utm_content || ''}` : ''
    console.log(
      `[ghl-capi] ok event=${metaEventName} event_id=${eventId} contact=${contactId} fbc=${fbc ? 'y' : 'n'} fbp=${fbp ? 'y' : 'n'} stash=${stashLookup.via}${utmTag} meta=${respBody.slice(0, 200)}`,
    )
    return json(200, { ok: true })
  } catch (err) {
    console.error('[ghl-capi] fetch failed', err)
    return json(502, { ok: false, error: String(err) })
  }
}

export const config = { path: '/.netlify/functions/ghl-capi' }
