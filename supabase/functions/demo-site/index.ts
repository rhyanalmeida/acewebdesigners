/**
 * `demo-site` — the public endpoint behind the outbound funnel's /demo/<token>
 * page. The token is the capability (32 random hex chars, unique per prospect,
 * only ever sent in their own cold email) — same model as `qualify`'s
 * appointmentId.
 *
 * POST { token }                    → public-safe prospect status (drives the page)
 * POST { token, action: 'build' }   → start the one-and-only demo build
 *
 * COST CONTROL — each build is a ~$0.60-1.10 Opus generate-site run, so:
 *   • the build requires an explicit click (never fires on page view),
 *   • an atomic conditional update (site_status 'none' → 'generating') means one
 *     build EVER per prospect no matter how many times the endpoint is hammered
 *     (retries after failure go through /admin with force, not through here).
 *
 * First page view of a real (non-test) prospect syncs stage 'lead' into GHL with
 * the outbound tag set — that's the "they clicked" signal for GHL workflows.
 * Suppressed prospects still get their page (viewing isn't email), but no GHL.
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { ghlSyncStage } from '../_shared/ghl.ts'

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined

interface Body {
  token?: string
  action?: 'build'
}

interface ProspectRow {
  id: string
  is_test: boolean
  suppressed: boolean
  business_name: string
  business_type: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
  site_status: string
  site_error: string | null
  preview_url: string | null
  chosen_domain: string | null
  domain_status: string
  purchased_at: string | null
  demo_first_viewed_at: string | null
  demo_view_count: number
}

const PUBLIC_COLS =
  'id, is_test, suppressed, business_name, business_type, first_name, last_name, email, phone, city, state, ' +
  'site_status, site_error, preview_url, chosen_domain, domain_status, purchased_at, demo_first_viewed_at, demo_view_count'

/** Only what the public page needs — never ids, email, or internal errors. */
function publicPayload(p: ProspectRow) {
  return {
    ok: true,
    businessName: p.business_name,
    firstName: p.first_name,
    city: p.city,
    state: p.state,
    siteStatus: p.site_status,
    previewUrl: p.site_status === 'deployed' ? p.preview_url : null,
    purchased: Boolean(p.purchased_at),
    chosenDomain: p.purchased_at ? p.chosen_domain : null,
    domainStatus: p.purchased_at ? p.domain_status : null,
  }
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }
  const token = (b.token ?? '').trim()
  if (!/^[0-9a-f]{32}$/.test(token)) return json({ error: 'not found' }, 404)

  const supa = admin()
  const { data, error } = await supa.from('prospects').select(PUBLIC_COLS).eq('token', token).maybeSingle()
  if (error || !data) return json({ error: 'not found' }, 404)
  const p = data as unknown as ProspectRow

  if (b.action === 'build') {
    // Atomic one-build gate: only the request that flips none → generating wins.
    const { data: won } = await supa
      .from('prospects')
      .update({ site_status: 'generating', site_error: null })
      .eq('token', token)
      .eq('site_status', 'none')
      .select('id')
      .maybeSingle()

    if (won) {
      const task = fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-site`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-key': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        },
        body: JSON.stringify({ prospectId: p.id }),
      })
        .then(async (r) => {
          if (!r.ok) {
            // Couldn't start (e.g. ANTHROPIC_API_KEY unset/out of credits) — mark
            // failed so /admin sees it and the page stops showing "building".
            const msg = `build start failed (${r.status}) ${(await r.text()).slice(0, 150)}`
            console.error('[demo-site]', msg, p.id)
            await supa.from('prospects').update({ site_status: 'failed', site_error: msg }).eq('id', p.id)
          } else {
            await r.body?.cancel()
          }
        })
        .catch(async (err) => {
          console.error('[demo-site] build invoke error', p.id, err)
          await supa.from('prospects').update({ site_status: 'failed', site_error: String(err).slice(0, 280) }).eq('id', p.id)
        })
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) EdgeRuntime.waitUntil(task)
      else await task
      return json({ ...publicPayload(p), siteStatus: 'generating', started: true }, 202)
    }
    // Lost the race / already built — report current state, never a second build.
    return json(publicPayload(p))
  }

  // ── status view: stamp first view + count, sync 'lead' to GHL once ──────────
  const firstView = !p.demo_first_viewed_at
  await supa
    .from('prospects')
    .update({
      ...(firstView ? { demo_first_viewed_at: new Date().toISOString() } : {}),
      demo_view_count: p.demo_view_count + 1,
    })
    .eq('id', p.id)

  if (firstView && !p.is_test && !p.suppressed && (p.email || p.phone)) {
    const sync = ghlSyncStage({
      stage: 'lead',
      funnel: 'outbound',
      email: p.email ?? undefined,
      phone: p.phone ?? undefined,
      firstName: p.first_name ?? undefined,
      lastName: p.last_name ?? undefined,
      businessName: p.business_name,
      city: p.city ?? undefined,
      state: p.state ?? undefined,
      qualifiers: {
        business_type: p.business_type ?? undefined,
        preview_url: `https://acewebdesigners.com/demo/${token}`,
      },
    }).then(async (ghlId) => {
      if (ghlId) await supa.from('prospects').update({ ghl_contact_id: ghlId }).eq('id', p.id)
    })
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) EdgeRuntime.waitUntil(sync)
    else await sync
  }

  return json(publicPayload(p))
})
