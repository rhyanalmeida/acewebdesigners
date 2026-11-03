/**
 * `provision-domain` — after a demo-site purchase, take the prospect's chosen
 * domain live automatically:
 *
 *   1. re-check availability → Porkbun register (prepaid balance, 1 year)
 *   2. Porkbun DNS: A @ → 75.2.60.5 (Netlify LB), CNAME www → <site>.netlify.app
 *   3. Netlify PATCH custom_domain (+ www alias) + kick SSL provisioning
 *   4. poll SSL until issued (Let's Encrypt needs DNS to propagate first)
 *
 * Steps 1-3 are quick HTTP calls and run in one invocation; step 4 self-invokes
 * with a fresh isolate per polling round (generate-site's chain pattern —
 * isolates die at ~400s). ~1h of polling, then park as 'ssl_pending' for /admin:
 * Netlify keeps retrying provisioning on its own once DNS resolves, so
 * 'ssl_pending' usually self-heals; admin Retry re-enters the poll.
 *
 * Idempotent by domain_status: a Stripe webhook redelivery or admin Retry never
 * registers (= pays for) the same domain twice. If the domain was taken between
 * checkout and here, status → 'failed' (taken_after_checkout), nothing was
 * charged at Porkbun, and /admin lets you set a new chosen_domain + Retry.
 *
 * Auth (deployed --no-verify-jwt): x-internal-key (stripe-webhook + self-chain)
 * OR an ADMIN_EMAILS JWT (/admin Retry).
 *
 * POST { prospectId }                          → provision (steps 1-3), 202
 * POST { prospectId, step:'ssl', attempt }     → SSL polling round (internal)
 * POST { step:'recheck' }  (x-cron-key)        → hourly: every own-domain purchase still waiting on
 *                                                the customer's DNS — SSL issued? → live
 *
 * OWN DOMAIN (domain_mode 'own', 2026-11-03): steps 1-2 are skipped (nothing to register, DNS is
 * the customer's), the domain is attached to the Netlify site, status 'awaiting_dns', and the
 * preview page shows the two records to add. The SSL poll + the hourly recheck flip it to 'live'
 * the moment Let's Encrypt can see the DNS. Never parks as 'failed' for a slow customer.
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'
import { checkDomain, domainIsOurs, porkbunConfigured, registerDomain, replaceDnsRecords } from '../_shared/porkbun.ts'
import { getSiteName, getSslState, netlifyConfigured, provisionSsl, setCustomDomain } from '../_shared/netlify.ts'
import { ghlUpdateContactFields } from '../_shared/ghl.ts'

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined

/** Netlify's apex load balancer for external-DNS custom domains. */
const NETLIFY_APEX_IP = '75.2.60.5'
/** SSL polls per isolate (30s apart) and max isolates (~1h total). */
const POLLS_PER_ROUND = 5
const MAX_ROUNDS = 24

interface Body {
  prospectId?: string
  step?: 'ssl' | 'recheck'
  attempt?: number
}

interface ProspectRow {
  id: string
  is_test: boolean
  email: string | null
  phone: string | null
  chosen_domain: string | null
  domain_mode: 'register' | 'own'
  netlify_site_id: string | null
  domain_status: string
  purchased_at: string | null
}
const PROSPECT_COLS = 'id, is_test, email, phone, chosen_domain, domain_mode, netlify_site_id, domain_status, purchased_at'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function selfInvoke(prospectId: string, attempt: number): Promise<void> {
  const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/provision-domain`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-key': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    },
    body: JSON.stringify({ prospectId, step: 'ssl', attempt }),
  })
  if (!resp.ok) throw new Error(`ssl poll handoff failed (${resp.status})`)
  await resp.body?.cancel()
}

async function markLive(supa: ReturnType<typeof admin>, p: ProspectRow): Promise<void> {
  await supa.from('prospects').update({ domain_status: 'live', domain_error: null }).eq('id', p.id)
  console.log(`[provision-domain] LIVE ${p.chosen_domain} prospect=${p.id}`)
  if (!p.is_test && (p.email || p.phone)) {
    await ghlUpdateContactFields({
      email: p.email ?? undefined,
      phone: p.phone ?? undefined,
      qualifiers: { chosen_domain: p.chosen_domain ?? undefined },
    })
  }
}

/** One SSL polling round; ends live, re-invokes the next round, or parks ssl_pending. */
async function pollSsl(supa: ReturnType<typeof admin>, p: ProspectRow, attempt: number): Promise<void> {
  for (let i = 0; i < POLLS_PER_ROUND; i++) {
    const ssl = await getSslState(p.netlify_site_id!)
    if (ssl.ok && ssl.state === 'issued') {
      await markLive(supa, p)
      return
    }
    // Re-kick provisioning every round — it 4xxs harmlessly until DNS resolves.
    if (i === 0) await provisionSsl(p.netlify_site_id!)
    await sleep(30_000)
  }
  if (attempt >= MAX_ROUNDS) {
    if (p.domain_mode === 'own') {
      // Their DNS, their pace: stay 'awaiting_dns'; the hourly recheck finishes the job.
      await supa.from('prospects').update({ domain_status: 'awaiting_dns', domain_error: null }).eq('id', p.id)
      return
    }
    await supa
      .from('prospects')
      .update({
        domain_status: 'ssl_pending',
        domain_error: `SSL not issued after ~${Math.round((MAX_ROUNDS * POLLS_PER_ROUND * 30) / 60)} min — Netlify retries automatically; check DNS if this persists`,
      })
      .eq('id', p.id)
    return
  }
  await selfInvoke(p.id, attempt + 1)
}

/** Own domain: attach + kick SSL, then wait for the customer's DNS (no Porkbun at all). */
async function attachOwnDomain(supa: ReturnType<typeof admin>, p: ProspectRow): Promise<void> {
  const domain = p.chosen_domain!
  try {
    const attach = await setCustomDomain(p.netlify_site_id!, domain)
    if (!attach.ok) {
      await supa.from('prospects').update({ domain_status: 'failed', domain_error: `custom_domain failed: ${attach.error ?? ''}`.slice(0, 280) }).eq('id', p.id)
      return
    }
    await provisionSsl(p.netlify_site_id!) // 4xxs harmlessly until their DNS resolves
    await supa.from('prospects').update({ domain_status: 'awaiting_dns', domain_error: null }).eq('id', p.id)
    await selfInvoke(p.id, 1)
  } catch (err) {
    console.error('[provision-domain] own-domain attach error', p.id, err)
    await supa.from('prospects').update({ domain_status: 'failed', domain_error: String(err).slice(0, 280) }).eq('id', p.id)
  }
}

/** Hourly cron: own-domain rows still waiting → SSL issued? → live. Re-kicks provisioning otherwise. */
async function recheckOwnDomains(supa: ReturnType<typeof admin>): Promise<{ checked: number; live: number }> {
  const { data } = await supa
    .from('prospects')
    .select(PROSPECT_COLS)
    .eq('domain_mode', 'own')
    .in('domain_status', ['awaiting_dns', 'ssl_pending', 'attached'])
    .not('purchased_at', 'is', null)
    .not('netlify_site_id', 'is', null)
    .limit(50)
  let live = 0
  for (const row of (data ?? []) as unknown as ProspectRow[]) {
    try {
      const ssl = await getSslState(row.netlify_site_id!)
      if (ssl.ok && ssl.state === 'issued') { await markLive(supa, row); live++; continue }
      await provisionSsl(row.netlify_site_id!)
    } catch (err) {
      console.error('[provision-domain] recheck error', row.id, err)
    }
  }
  return { checked: data?.length ?? 0, live }
}

/** Steps 1-3 (register → DNS → attach), then hand off to SSL polling. */
async function provision(supa: ReturnType<typeof admin>, p: ProspectRow): Promise<void> {
  if (p.domain_mode === 'own') return attachOwnDomain(supa, p)
  const domain = p.chosen_domain!
  const fail = (msg: string) =>
    supa.from('prospects').update({ domain_status: 'failed', domain_error: msg.slice(0, 280) }).eq('id', p.id)

  try {
    // 1) register — only if we haven't already gotten past it (idempotency).
    if (p.domain_status === 'registering' || p.domain_status === 'none' || p.domain_status === 'failed') {
      const check = await checkDomain(domain)
      if (!check.ok) return void (await fail(`availability re-check failed: ${check.error ?? ''}`))
      if (!check.available) {
        // Unavailable could mean WE registered it on an earlier attempt that
        // failed later (DNS/attach) — that retry should continue, not fail.
        if (!(await domainIsOurs(domain))) {
          // Truly taken by someone else; nothing charged. /admin: new chosen_domain + Retry.
          return void (await fail('taken_after_checkout — pick a new domain in /admin and retry'))
        }
      } else {
        const reg = await registerDomain(domain, check.price)
        if (!reg.ok) return void (await fail(`register failed: ${reg.error ?? ''}`))
      }
    }

    // 2) DNS at Porkbun (idempotent — replaceDnsRecords clears then creates).
    const siteName = await getSiteName(p.netlify_site_id!)
    if (!siteName) return void (await fail('could not resolve Netlify site name'))
    const dns = await replaceDnsRecords(domain, [
      { type: 'A', name: '', content: NETLIFY_APEX_IP },
      { type: 'CNAME', name: 'www', content: `${siteName}.netlify.app` },
    ])
    if (!dns.ok) return void (await fail(`dns failed: ${dns.error ?? ''}`))
    await supa.from('prospects').update({ domain_status: 'dns_set' }).eq('id', p.id)

    // 3) attach to the Netlify site + kick SSL.
    const attach = await setCustomDomain(p.netlify_site_id!, domain)
    if (!attach.ok) return void (await fail(`custom_domain failed: ${attach.error ?? ''}`))
    await provisionSsl(p.netlify_site_id!) // expected to fail until DNS propagates
    await supa.from('prospects').update({ domain_status: 'attached', domain_error: null }).eq('id', p.id)

    // 4) hand SSL polling to a fresh isolate.
    await selfInvoke(p.id, 1)
  } catch (err) {
    console.error('[provision-domain] provision error', p.id, err)
    await fail(String(err))
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

  const internal = req.headers.get('x-internal-key') === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const cronKey = Deno.env.get('CAPI_INTERNAL_SECRET')
  const cron = Boolean(cronKey) && req.headers.get('x-cron-key') === cronKey
  if (b.step === 'recheck') {
    if (!cron && !internal) return json({ error: 'unauthorized' }, 401)
    if (!netlifyConfigured()) return json({ error: 'NETLIFY_AUTH_TOKEN not set' }, 503)
    return json({ ok: true, ...(await recheckOwnDomains(admin())) })
  }
  if (!internal) {
    const adminUser = await requireAdmin(req)
    if (!adminUser) return json({ error: 'unauthorized' }, 401)
  }
  if (!netlifyConfigured()) return json({ error: 'NETLIFY_AUTH_TOKEN not set' }, 503)
  if (!b.prospectId) return json({ error: 'prospectId required' }, 400)
  if (b.step === 'ssl' && !internal) return json({ error: 'steps are internal' }, 403)

  const supa = admin()
  const { data } = await supa.from('prospects').select(PROSPECT_COLS).eq('id', b.prospectId).maybeSingle()
  if (!data) return json({ error: 'prospect not found' }, 404)
  const p = data as unknown as ProspectRow

  if (!p.purchased_at) return json({ error: 'not purchased' }, 409)
  if (!p.chosen_domain) return json({ error: 'no chosen_domain' }, 409)
  if (!p.netlify_site_id) return json({ error: 'no netlify site (demo never built?)' }, 409)
  if (p.domain_status === 'live') return json({ ok: true, skipped: 'already live' })
  if (p.domain_mode !== 'own') {
    if (!porkbunConfigured()) return json({ error: 'Porkbun not configured' }, 503)
    // Real-money guard: a test prospect may only provision against the sandbox.
    if (p.is_test && !Deno.env.get('PORKBUN_API_BASE')) {
      return json({ error: 'test prospect — set PORKBUN_API_BASE to the sandbox first' }, 409)
    }
  }

  const task = b.step === 'ssl' ? pollSsl(supa, p, b.attempt ?? 1) : provision(supa, p)
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) EdgeRuntime.waitUntil(task)
  else await task
  return json({ ok: true, started: true, step: b.step ?? 'provision' }, 202)
})
