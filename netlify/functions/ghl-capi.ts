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

const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN || ''
const META_PIXEL_ID = process.env.META_PIXEL_ID || '1548487516424971'
const META_API_VERSION = 'v21.0'

type EventAction = 'lead' | 'show' | 'purchase'

interface MetaUserData {
  em?: string[]
  ph?: string[]
  fn?: string[]
  ln?: string[]
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

interface NetlifyEvent {
  httpMethod: string
  body: string | null
  headers: Record<string, string | undefined>
}

interface NetlifyResult {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResult> => {
  const json = (status: number, body: unknown): NetlifyResult => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'POST only' })
  }
  if (!META_CAPI_TOKEN) {
    console.error('[ghl-capi] META_CAPI_TOKEN env var is not set')
    return json(500, { error: 'Server not configured' })
  }

  let body: Dict
  try {
    body = JSON.parse(event.body || '{}') as Dict
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
  const email = normEmail(pick(body, 'email', 'contact.email'))
  const phone = normPhone(pick(body, 'phone', 'contact.phone', 'phone_raw'))
  const firstName = pick(body, 'first_name', 'contact.first_name').trim().toLowerCase()
  const lastName = pick(body, 'last_name', 'contact.last_name').trim().toLowerCase()
  const contactId = pick(body, 'contact_id', 'contact.id').trim()

  // --- Attribution (captured on landing page, stored as GHL custom fields) ---
  const fbc = pick(body, 'fbc', 'customData.fbc', 'contact.fbc', 'customFields.fbc')
  const fbp = pick(body, 'fbp', 'customData.fbp', 'contact.fbp', 'customFields.fbp')
  const fbclid = pick(body, 'fbclid', 'customData.fbclid', 'contact.fbclid', 'customFields.fbclid')
  const clientEventId = pick(
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

  // --- Purchase value ---
  const value = pickNumber(body, 'value', 'opportunity.monetaryValue', 'customData.value')

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

  // --- Build Meta user_data (PII hashed with SHA-256) ---
  const userData: MetaUserData = {}
  if (email) userData.em = [sha256(email)]
  if (phone) userData.ph = [sha256(phone)]
  if (firstName) userData.fn = [sha256(firstName)]
  if (lastName) userData.ln = [sha256(lastName)]
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
        action_source: 'website',
        event_source_url: eventSourceUrl,
        event_id: eventId,
        user_data: userData,
        custom_data: {
          currency: 'USD',
          ...(metaEventName === 'Purchase' ? { value } : {}),
          ghl_contact_id: contactId,
          ghl_event_type: rawEventType || 'unknown',
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

    console.log(
      `[ghl-capi] ok event=${metaEventName} event_id=${eventId} contact=${contactId} fbc=${fbc ? 'y' : 'n'} fbp=${fbp ? 'y' : 'n'}`,
    )
    return json(200, {
      ok: true,
      event: metaEventName,
      event_id: eventId,
      meta_response: JSON.parse(respBody),
    })
  } catch (err) {
    console.error('[ghl-capi] fetch failed', err)
    return json(502, { ok: false, error: String(err) })
  }
}
