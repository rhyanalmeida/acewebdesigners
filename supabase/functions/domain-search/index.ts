/**
 * `domain-search` — availability check for the outbound demo page's domain
 * picker. Public but token-gated (a valid prospect token is required), one
 * domain per request, so Porkbun API abuse is bounded by who holds real tokens.
 *
 * POST { token, query }  →  { domain, available, price? }
 *
 * The query is slugified to a bare .com ("Acme Plumbing!" → "acmeplumbing.com").
 * The customer confirms this exact domain BEFORE paying (registrations are
 * non-refundable); create-subscription re-checks it at session creation and
 * provision-domain re-checks again before registering.
 */

import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { checkDomain, porkbunConfigured } from '../_shared/porkbun.ts'

interface Body {
  token?: string
  query?: string
}

/** "Acme Plumbing & Sons LLC" → "acmeplumbingsonsllc" (no dashes — cleaner domains). */
export function domainSlug(query: string): string {
  return query
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\.[a-z]{2,}$/i, '') // drop a typed TLD; we always check .com
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  if (!porkbunConfigured()) return json({ error: 'domain search unavailable' }, 503)

  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }
  const token = (b.token ?? '').trim()
  if (!/^[0-9a-f]{32}$/.test(token)) return json({ error: 'not found' }, 404)

  const slug = domainSlug(b.query ?? '')
  if (slug.length < 3) return json({ error: 'enter at least 3 letters or numbers' }, 400)

  const supa = admin()
  const { data: prospect } = await supa
    .from('prospects')
    .select('id, purchased_at')
    .eq('token', token)
    .maybeSingle()
  if (!prospect) return json({ error: 'not found' }, 404)
  if ((prospect as { purchased_at: string | null }).purchased_at) {
    return json({ error: 'already purchased' }, 409)
  }

  const domain = `${slug}.com`
  const check = await checkDomain(domain)
  if (!check.ok) return json({ error: 'availability check failed — try again' }, 502)

  return json({ domain, available: Boolean(check.available), price: check.price })
})
