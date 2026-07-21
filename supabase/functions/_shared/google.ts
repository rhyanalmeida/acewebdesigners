/**
 * Google Calendar two-way sync via a service account.
 *
 * Auth model: a Google service account whose JSON key is stored (base64) in
 * GOOGLE_SERVICE_ACCOUNT_B64. The business calendar is SHARED with the service
 * account's email and granted "Make changes to events". No user OAuth flow.
 *
 * Two directions:
 *   - PULL: freeBusy() blocks slots that are already busy on the calendar
 *           (queried live by `slots` — no cache/webhook to keep in sync).
 *   - PUSH: createEvent()/deleteEvent() mirror our bookings onto the calendar.
 *
 * Everything degrades to a NO-OP when GOOGLE_SERVICE_ACCOUNT_B64 is unset, so
 * booking + CAPI work before Google is wired up.
 */

interface ServiceAccount {
  client_email: string
  private_key: string
}

let saCache: ServiceAccount | null | undefined
let tokenCache: { token: string; expiresAt: number } | null = null

export function googleConfigured(): boolean {
  return Boolean(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_B64'))
}

function serviceAccount(): ServiceAccount | null {
  if (saCache !== undefined) return saCache
  const b64 = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_B64')
  if (!b64) return (saCache = null)
  try {
    saCache = JSON.parse(new TextDecoder().decode(base64ToBytes(b64))) as ServiceAccount
  } catch (err) {
    console.error('[google] bad GOOGLE_SERVICE_ACCOUNT_B64', err)
    saCache = null
  }
  return saCache
}

export function calendarIdFor(calendar: 'main' | 'contractor'): string | null {
  return (
    Deno.env.get(calendar === 'main' ? 'GOOGLE_CALENDAR_ID_MAIN' : 'GOOGLE_CALENDAR_ID_CONTRACTOR') ||
    null
  )
}

// ── base64 / base64url helpers ────────────────────────────────────────────────
// Return type pinned to Uint8Array<ArrayBuffer> so Web Crypto (importKey) accepts
// it as a BufferSource under the newer TS lib (ArrayBufferLike isn't assignable).
function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function strToBase64Url(s: string): string {
  return bytesToBase64Url(new TextEncoder().encode(s))
}

// ── service-account access token (RS256 JWT → OAuth token) ─────────────────────
function pemToPkcs8(pem: string): Uint8Array<ArrayBuffer> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  return base64ToBytes(body)
}

async function getAccessToken(): Promise<string | null> {
  const sa = serviceAccount()
  if (!sa) return null
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token

  const now = Math.floor(Date.now() / 1000)
  const header = strToBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = strToBase64Url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
  const signingInput = `${header}.${claim}`

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput)),
  )
  const assertion = `${signingInput}.${bytesToBase64Url(sig)}`

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!resp.ok) {
    console.error('[google] token exchange failed', resp.status, (await resp.text()).slice(0, 300))
    return null
  }
  const data = (await resp.json()) as { access_token: string; expires_in: number }
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

// ── public API (all no-op safely when unconfigured) ───────────────────────────

export interface BusyInterval {
  start: number // epoch ms
  end: number
}

/** Busy intervals on the calendar within [timeMin, timeMax]. [] if unconfigured. */
export async function freeBusy(
  calendar: 'main' | 'contractor',
  timeMinISO: string,
  timeMaxISO: string,
): Promise<BusyInterval[]> {
  const calId = calendarIdFor(calendar)
  const token = await getAccessToken()
  if (!calId || !token) return []
  try {
    const resp = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeMin: timeMinISO, timeMax: timeMaxISO, items: [{ id: calId }] }),
    })
    if (!resp.ok) {
      console.error('[google] freeBusy failed', resp.status)
      return []
    }
    const data = (await resp.json()) as {
      calendars: Record<string, { busy: { start: string; end: string }[] }>
    }
    const busy = data.calendars?.[calId]?.busy ?? []
    return busy.map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }))
  } catch (err) {
    console.error('[google] freeBusy error', err)
    return []
  }
}

export interface CreateEventInput {
  calendar: 'main' | 'contractor'
  summary: string
  description?: string
  startISO: string
  endISO: string
  tz: string
  attendeeEmail?: string
}

/** Creates a calendar event. Returns the event id, or null if unconfigured/failed. */
export async function createEvent(input: CreateEventInput): Promise<string | null> {
  const calId = calendarIdFor(input.calendar)
  const token = await getAccessToken()
  if (!calId || !token) return null
  try {
    const resp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?sendUpdates=all`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: input.summary,
          description: input.description ?? '',
          start: { dateTime: input.startISO, timeZone: input.tz },
          end: { dateTime: input.endISO, timeZone: input.tz },
          ...(input.attendeeEmail ? { attendees: [{ email: input.attendeeEmail }] } : {}),
        }),
      },
    )
    if (!resp.ok) {
      console.error('[google] createEvent failed', resp.status, (await resp.text()).slice(0, 300))
      return null
    }
    const data = (await resp.json()) as { id: string }
    return data.id ?? null
  } catch (err) {
    console.error('[google] createEvent error', err)
    return null
  }
}

/**
 * Appends text to an event's description. Best-effort — returns false when
 * unconfigured or on any failure. Used to surface qualifying answers on the
 * invite, which is where the call actually gets prepped from.
 */
export async function appendEventDescription(
  calendar: 'main' | 'contractor',
  eventId: string,
  text: string,
): Promise<boolean> {
  const calId = calendarIdFor(calendar)
  const token = await getAccessToken()
  if (!calId || !token || !eventId || !text.trim()) return false
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(eventId)}`
  try {
    const cur = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!cur.ok) {
      console.error('[google] read event failed', cur.status)
      return false
    }
    const { description = '' } = (await cur.json()) as { description?: string }
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: description ? `${description}\n\n${text}` : text }),
    })
    if (!resp.ok) {
      console.error('[google] patch event failed', resp.status, (await resp.text()).slice(0, 300))
      return false
    }
    return true
  } catch (err) {
    console.error('[google] appendEventDescription error', err)
    return false
  }
}

/** Deletes a calendar event. Best-effort. */
export async function deleteEvent(calendar: 'main' | 'contractor', eventId: string): Promise<void> {
  const calId = calendarIdFor(calendar)
  const token = await getAccessToken()
  if (!calId || !token || !eventId) return
  try {
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    )
  } catch (err) {
    console.error('[google] deleteEvent error', err)
  }
}
