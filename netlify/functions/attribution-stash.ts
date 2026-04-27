/**
 * Attribution stash — side channel for browser → CAPI correlation.
 *
 * Browser POSTs `{email?, contact_id?, fbc, fbp, event_id, fbclid}` here on
 * booking completion. Stored under multiple keys so the GHL workflow webhook
 * (which arrives ~2-10s later) can find it via whichever identifier it has.
 *
 * Fail-open: any error returns 200 so the booking flow never blocks on us.
 *
 * Functions v2 — required for Netlify Blobs runtime context to be auto-wired
 * when deploying via CLI (`netlify deploy --prod --build`).
 */

import crypto from 'node:crypto'
import { getStore } from '@netlify/blobs'

function sha256(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex')
}

const ok = (b: unknown): Response =>
  new Response(JSON.stringify(b), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return ok({ ok: true })

  let body: Record<string, string> = {}
  try {
    body = (await req.json()) as Record<string, string>
  } catch {
    return ok({ ok: true })
  }

  const fbc = String(body.fbc || '')
  const fbp = String(body.fbp || '')
  const eventId = String(body.event_id || '')
  const fbclid = String(body.fbclid || '')
  if (!eventId && !fbc && !fbp && !fbclid) return ok({ ok: true })

  const email = String(body.email || '').trim().toLowerCase()
  const contactId = String(body.contact_id || '').trim()

  const ip =
    req.headers.get('x-nf-client-connection-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    ''
  const ua = req.headers.get('user-agent') || ''

  // 90-day TTL aligned with Meta's _fbc/_fbp cookie lifetime. The Blobs SDK
  // doesn't natively support TTL on this version, so we store expiresAt and
  // discard expired entries at lookup time (in ghl-capi.ts).
  const now = Date.now()
  const payload = {
    fbc,
    fbp,
    event_id: eventId,
    fbclid,
    stashedAt: now,
    expiresAt: now + 90 * 24 * 60 * 60 * 1000,
  }

  try {
    const store = getStore('attribution')
    const writes: Promise<unknown>[] = []
    if (email) writes.push(store.setJSON(`email:${email}`, payload))
    if (contactId) writes.push(store.setJSON(`contactid:${contactId}`, payload))
    if (ip && ua) writes.push(store.setJSON(`ipua:${sha256(ip + ua)}`, payload))
    await Promise.all(writes)
    console.log(
      `[attribution-stash] stashed event_id=${eventId} keys=${writes.length}` +
        (email ? ` email=${email}` : '') +
        (contactId ? ` cid=${contactId}` : '') +
        (ip ? ` ip=${ip.slice(0, 16)}` : ''),
    )
  } catch (err) {
    console.error('[attribution-stash] write failed', err)
  }

  return ok({ ok: true })
}

export const config = { path: '/.netlify/functions/attribution-stash' }
