/**
 * Meta Conversions API engine (server-side).
 *
 * Ported from the proven netlify/functions/ghl-capi.ts (git fab151d~1): same PII
 * normalization + SHA-256 hashing, fbc/fbp handling, action_source logic, and
 * value clamping — adapted to Deno (Web Crypto instead of node:crypto) and to
 * Postgres for idempotency (the capi_events table, event_id PK) instead of
 * Netlify Blobs.
 *
 * Called IN-PROCESS by book / stripe-webhook / mark-showed (no internal HTTP),
 * and over HTTP by the guarded `capi` test endpoint.
 *
 * Conversions are single-source here: the browser pixel fires the same event_id
 * for Lead, so Meta dedupes client + server. GHL no longer sends any CAPI event.
 */

import { admin } from './supabaseAdmin.ts'

const META_API_VERSION = 'v21.0'

export type CapiEventName = 'Lead' | 'CompleteRegistration' | 'Purchase'
export type Dataset = 'contractor' | 'main'

export interface CapiInput {
  eventName: CapiEventName
  eventId: string
  dataset?: Dataset // default 'contractor'
  actionSource?: 'website' | 'system_generated'
  eventSourceUrl?: string

  // Identity (raw — hashed here). fbc/fbp/fbclid are NOT hashed.
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  externalId?: string
  fbc?: string
  fbp?: string
  fbclid?: string
  clientIpAddress?: string
  clientUserAgent?: string

  // Purchase
  value?: number
  currency?: string

  customData?: Record<string, unknown>
  testEventCode?: string

  // Audit linkage (FKs into capi_events; omit if not a real row)
  contactId?: string
  appointmentId?: string
}

export interface CapiResult {
  ok: boolean
  status: number
  deduped?: boolean
  metaResponse?: unknown
  error?: string
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function sha256(v: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const normEmail = (v: string) => v.trim().toLowerCase()
const normPhone = (v: string) => v.replace(/[^0-9]/g, '') // digits only, no "+"
const cap = (s: string, n = 256) => (typeof s === 'string' ? s.slice(0, n) : '')

function datasetId(dataset: Dataset): string {
  const id =
    dataset === 'main'
      ? Deno.env.get('META_DATASET_ID_MAIN')
      : Deno.env.get('META_DATASET_ID')
  return id || '4230021860577001' // contractor fallback
}

function defaultActionSource(name: CapiEventName): 'website' | 'system_generated' {
  // Lead happens on the site (booking submit) → keep `website` so it dedupes
  // against the browser pixel. Show/Purchase are CRM/system-generated.
  return name === 'Lead' ? 'website' : 'system_generated'
}

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

async function buildUserData(input: CapiInput, eventTimeMs: number): Promise<MetaUserData> {
  const ud: MetaUserData = {}

  const rawEmail = cap(input.email ?? '')
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? normEmail(rawEmail) : ''
  const phoneDigits = normPhone(input.phone ?? '')
  const phone = phoneDigits.length >= 7 && phoneDigits.length <= 15 ? phoneDigits : ''
  const fn = cap(input.firstName ?? '', 64).trim().toLowerCase()
  const ln = cap(input.lastName ?? '', 64).trim().toLowerCase()
  const ct = cap(input.city ?? '', 64).trim().toLowerCase().replace(/\s+/g, '')
  const st = cap(input.state ?? '', 32).trim().toLowerCase().replace(/\s+/g, '')
  const zp = cap(input.zip ?? '', 16).replace(/[^a-z0-9]/gi, '').toLowerCase()
  const countryRaw = cap(input.country ?? '', 8).trim().toLowerCase()
  const country = countryRaw === 'usa' || countryRaw === 'united states' ? 'us' : countryRaw.slice(0, 2)
  const externalId = cap(input.externalId ?? '', 128).trim()

  if (email) ud.em = [await sha256(email)]
  if (phone) ud.ph = [await sha256(phone)]
  if (fn) ud.fn = [await sha256(fn)]
  if (ln) ud.ln = [await sha256(ln)]
  if (ct) ud.ct = [await sha256(ct)]
  if (st) ud.st = [await sha256(st)]
  if (zp) ud.zp = [await sha256(zp)]
  if (country) ud.country = [await sha256(country)]
  if (externalId) ud.external_id = [await sha256(externalId)]

  // fbc/fbp MUST NOT be hashed. Reconstruct fbc from fbclid if needed.
  if (input.fbc) ud.fbc = input.fbc
  else if (input.fbclid) ud.fbc = `fb.1.${eventTimeMs}.${input.fbclid}`
  if (input.fbp) ud.fbp = input.fbp
  if (input.clientUserAgent) ud.client_user_agent = input.clientUserAgent
  if (input.clientIpAddress) ud.client_ip_address = input.clientIpAddress

  return ud
}

// ── main ────────────────────────────────────────────────────────────────────

/**
 * Send one conversion to Meta CAPI, with Postgres-backed idempotency.
 *
 * Idempotency: we claim the event_id in capi_events first (insert 'pending').
 * If the row already exists, we treat it as already handled and skip the send —
 * this makes retried webhooks (Stripe) and double-submits safe.
 */
export async function sendCapiEvent(input: CapiInput): Promise<CapiResult> {
  const token = Deno.env.get('META_CAPI_TOKEN')
  if (!token) return { ok: false, status: 500, error: 'META_CAPI_TOKEN not set' }
  if (!input.eventId) return { ok: false, status: 400, error: 'eventId required' }

  const dataset = input.dataset ?? 'contractor'
  const actionSource = input.actionSource ?? defaultActionSource(input.eventName)
  const supa = admin()

  // 1) Claim event_id (idempotency). Only link FKs when real ids were provided.
  const claim = {
    event_id: input.eventId,
    event_name: input.eventName,
    action_source: actionSource,
    contact_id: input.contactId ?? null,
    appointment_id: input.appointmentId ?? null,
    value: input.eventName === 'Purchase' ? (input.value ?? null) : null,
    status: 'pending',
  }
  const { error: claimErr } = await supa.from('capi_events').insert(claim)
  if (claimErr) {
    if ((claimErr as { code?: string }).code === '23505') {
      // Already claimed. Skip ONLY if a prior send actually succeeded — otherwise
      // (pending/error) fall through and re-attempt so transient failures recover.
      const { data: existingData } = await supa
        .from('capi_events')
        .select('status')
        .eq('event_id', input.eventId)
        .maybeSingle()
      const existing = existingData as { status?: string } | null
      if (existing?.status === 'sent') {
        console.log(`[capi] dedup skip (already sent) event_id=${input.eventId}`)
        return { ok: true, status: 200, deduped: true }
      }
    } else {
      // Never let an audit-table hiccup block a conversion.
      console.warn('[capi] claim insert failed (continuing):', claimErr.message)
    }
  }

  // 2) Build + send payload.
  const eventTime = Math.floor(Date.now() / 1000)
  const userData = await buildUserData(input, eventTime * 1000)
  const testEventCode = input.testEventCode || Deno.env.get('META_TEST_EVENT_CODE') || ''

  const customData: Record<string, unknown> = {
    currency: input.currency || 'USD',
    ...(input.eventName === 'Purchase' ? { value: Math.min(Math.max(input.value ?? 0, 0), 1_000_000) } : {}),
    ...(input.customData ?? {}),
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: eventTime,
        action_source: actionSource,
        event_source_url: input.eventSourceUrl || 'https://acewebdesigners.com/contractorlanding',
        event_id: input.eventId,
        user_data: userData,
        custom_data: customData,
      },
    ],
  }
  if (testEventCode) payload.test_event_code = testEventCode

  const url = `https://graph.facebook.com/${META_API_VERSION}/${datasetId(dataset)}/events`
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const text = await resp.text()
    let parsed: unknown = text
    try { parsed = JSON.parse(text) } catch { /* keep text */ }

    // 3) Record outcome (best-effort).
    await supa
      .from('capi_events')
      .update({ status: resp.ok ? 'sent' : 'error', meta_response: parsed })
      .eq('event_id', input.eventId)

    if (!resp.ok) {
      console.error(`[capi] Meta error ${resp.status} event=${input.eventName} id=${input.eventId}`, text.slice(0, 300))
      return { ok: false, status: 502, metaResponse: parsed, error: `Meta ${resp.status}` }
    }
    console.log(
      `[capi] ok event=${input.eventName} id=${input.eventId} ds=${dataset} fbc=${userData.fbc ? 'y' : 'n'} fbp=${userData.fbp ? 'y' : 'n'}`,
    )
    return { ok: true, status: 200, metaResponse: parsed }
  } catch (err) {
    await supa.from('capi_events').update({ status: 'error', meta_response: { error: String(err) } }).eq('event_id', input.eventId)
    console.error('[capi] fetch failed', err)
    return { ok: false, status: 502, error: String(err) }
  }
}
