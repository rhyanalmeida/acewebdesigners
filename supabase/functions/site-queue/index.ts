/**
 * `site-queue` — the narrow API the scheduled Claude Code routine uses to build
 * preview websites on the owner's subscription (Option B; see generate-site for
 * the dormant API path).
 *
 * Security: deployed --no-verify-jwt, guarded by `x-queue-secret` ==
 * SITE_QUEUE_SECRET (dedicated random secret; deliberately NOT the service-role
 * key so the cloud routine can only touch the site-build fields of appointments).
 *
 * POST { action: 'creds' }  → { netlifyToken }   current NETLIFY_AUTH_TOKEN Edge
 *   secret, so the cloud routine never embeds a token that can rotate stale.
 * POST { action: 'list' }
 *   → { jobs: [{ appointmentId, businessName, businessType, firstName, city,
 *        state, phone, netlifySiteId }] }
 *   Queued rows + 'generating' rows stalled >2h (crashed run, safe to retake).
 * POST { action: 'claim',    appointmentId }                       → generating
 * POST { action: 'complete', appointmentId, previewUrl, netlifySiteId } → deployed
 * POST { action: 'fail',     appointmentId, error }                → failed
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'

interface Body {
  action?: 'creds' | 'list' | 'claim' | 'complete' | 'fail'
  appointmentId?: string
  previewUrl?: string
  netlifySiteId?: string
  error?: string
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const secret = Deno.env.get('SITE_QUEUE_SECRET')
  if (!secret) return json({ error: 'SITE_QUEUE_SECRET not set' }, 503)
  if (req.headers.get('x-queue-secret') !== secret) return json({ error: 'unauthorized' }, 401)

  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  if (b.action === 'creds') {
    const netlifyToken = Deno.env.get('NETLIFY_AUTH_TOKEN')
    if (!netlifyToken) return json({ error: 'NETLIFY_AUTH_TOKEN not set' }, 503)
    return json({ netlifyToken })
  }

  const supa = admin()

  if (b.action === 'list') {
    const staleISO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supa
      .from('appointments')
      .select(
        'id, site_status, netlify_site_id, updated_at, start_ts, ' +
          'contacts:contact_id ( first_name, business_name, business_type, city, state, phone )',
      )
      .in('site_status', ['queued', 'generating'])
      .order('created_at', { ascending: true })
      .limit(10)
    if (error) return json({ error: error.message }, 500)
    type Row = {
      id: string
      site_status: string
      netlify_site_id: string | null
      updated_at: string
      contacts: {
        first_name?: string
        business_name?: string
        business_type?: string
        city?: string
        state?: string
        phone?: string
      } | null
    }
    const jobs = ((data ?? []) as unknown as Row[])
      .filter((r) => r.site_status === 'queued' || r.updated_at < staleISO)
      .map((r) => ({
        appointmentId: r.id,
        businessName: r.contacts?.business_name ?? null,
        businessType: r.contacts?.business_type ?? null,
        firstName: r.contacts?.first_name ?? null,
        city: r.contacts?.city ?? null,
        state: r.contacts?.state ?? null,
        phone: r.contacts?.phone ?? null,
        netlifySiteId: r.netlify_site_id, // reuse on retry instead of leaking sites
      }))
    return json({ jobs })
  }

  if (!b.appointmentId) return json({ error: 'appointmentId required' }, 400)

  if (b.action === 'claim') {
    const { error } = await supa
      .from('appointments')
      .update({ site_status: 'generating', site_error: null })
      .eq('id', b.appointmentId)
    return error ? json({ error: error.message }, 500) : json({ ok: true })
  }

  if (b.action === 'complete') {
    if (!b.previewUrl || !b.netlifySiteId) return json({ error: 'previewUrl and netlifySiteId required' }, 400)
    const { error } = await supa
      .from('appointments')
      .update({
        preview_url: b.previewUrl,
        netlify_site_id: b.netlifySiteId,
        site_status: 'deployed',
        site_generated_at: new Date().toISOString(),
        site_error: null,
      })
      .eq('id', b.appointmentId)
    return error ? json({ error: error.message }, 500) : json({ ok: true })
  }

  if (b.action === 'fail') {
    const { error } = await supa
      .from('appointments')
      .update({ site_status: 'failed', site_error: (b.error ?? 'routine failed').slice(0, 300) })
      .eq('id', b.appointmentId)
    return error ? json({ error: error.message }, 500) : json({ ok: true })
  }

  return json({ error: 'unknown action' }, 400)
})
