/**
 * Porkbun registrar API — automated domain purchase + DNS for the outbound
 * demo-site funnel. Mirrors netlify.ts conventions: everything returns
 * { ok:false } when unconfigured or failing and NEVER throws into the funnel.
 *
 * Porkbun JSON v3: every call is a POST whose body carries the credentials
 * ({ apikey, secretapikey, ... }); success responses have status:"SUCCESS".
 * Payment comes from the prepaid account balance (enable auto top-up in the
 * Porkbun dashboard). Registrations are NON-REFUNDABLE — callers must have the
 * customer confirm the exact domain before ever calling registerDomain.
 *
 * PORKBUN_API_BASE lets the sandbox (https://api-sandbox.porkbun.com/api/json/v3)
 * be swapped in via secrets alone — no code change to test end-to-end.
 */

const base = () => Deno.env.get('PORKBUN_API_BASE') || 'https://api.porkbun.com/api/json/v3'

const creds = () => ({
  apikey: Deno.env.get('PORKBUN_API_KEY') ?? '',
  secretapikey: Deno.env.get('PORKBUN_SECRET_API_KEY') ?? '',
})

export function porkbunConfigured(): boolean {
  const c = creds()
  return Boolean(c.apikey && c.secretapikey)
}

interface PbResponse {
  status?: string
  message?: string
  [k: string]: unknown
}

/** POST helper: path like '/domain/checkDomain/example.com'. Never throws. */
async function pb(path: string, body: Record<string, unknown> = {}): Promise<PbResponse | null> {
  try {
    const resp = await fetch(`${base()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...creds(), ...body }),
    })
    const data = (await resp.json().catch(() => null)) as PbResponse | null
    if (!resp.ok || !data || data.status !== 'SUCCESS') {
      console.error(`[porkbun] ${path} failed`, resp.status, (data?.message ?? '').slice(0, 200))
      return data ?? { status: 'ERROR', message: `http ${resp.status}` }
    }
    return data
  } catch (err) {
    console.error(`[porkbun] ${path} error`, err)
    return null
  }
}

export interface DomainCheck {
  ok: boolean
  available?: boolean
  /** First-year registration price in USD, as Porkbun reports it (string like "11.06"). */
  price?: string
  error?: string
}

/** Availability + price for one exact domain (e.g. "acmeplumbing.com"). */
export async function checkDomain(domain: string): Promise<DomainCheck> {
  if (!porkbunConfigured()) return { ok: false, error: 'Porkbun not configured' }
  const data = await pb(`/domain/checkDomain/${domain}`)
  if (!data || data.status !== 'SUCCESS') return { ok: false, error: data?.message ?? 'check failed' }
  const r = data.response as { avail?: string; price?: string } | undefined
  return { ok: true, available: r?.avail === 'yes', price: r?.price }
}

/**
 * Register a domain for 1 year from the prepaid balance. NON-REFUNDABLE — the
 * caller is responsible for having confirmed the exact spelling with the buyer.
 *
 * The API requires `cost` (integer USD cents, exactly matching checkDomain's
 * price) + `agreeToTerms` — pass the price from a just-run checkDomain, or it
 * is re-fetched here.
 */
export async function registerDomain(
  domain: string,
  priceUsd?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!porkbunConfigured()) return { ok: false, error: 'Porkbun not configured' }
  let price = priceUsd
  if (!price) {
    const check = await checkDomain(domain)
    if (!check.ok || !check.price) return { ok: false, error: `price lookup failed: ${check.error ?? 'no price'}` }
    price = check.price
  }
  const data = await pb(`/domain/create/${domain}`, {
    cost: Math.round(parseFloat(price) * 100),
    agreeToTerms: 'yes',
  })
  if (!data || data.status !== 'SUCCESS') return { ok: false, error: data?.message ?? 'register failed' }
  console.log(`[porkbun] registered ${domain}`)
  return { ok: true }
}

/**
 * True when the domain is already in OUR Porkbun account (DNS retrieve only
 * succeeds for owned domains). Distinguishes "taken by someone else" from
 * "we registered it on an earlier attempt" during provisioning retries.
 */
export async function domainIsOurs(domain: string): Promise<boolean> {
  if (!porkbunConfigured()) return false
  const data = await pb(`/dns/retrieve/${domain}`)
  return data?.status === 'SUCCESS'
}

export interface DnsRecord {
  type: 'A' | 'CNAME' | 'ALIAS'
  /** Subdomain part only: '' for the apex, 'www' for www. */
  name: string
  content: string
}

/**
 * Point a domain at a host: delete any existing records for each (name, type)
 * pair, then create the given ones. Idempotent — safe to re-run on retry.
 * (deleteByNameType 404s harmlessly when nothing matches.)
 */
export async function replaceDnsRecords(
  domain: string,
  records: DnsRecord[],
): Promise<{ ok: boolean; error?: string }> {
  if (!porkbunConfigured()) return { ok: false, error: 'Porkbun not configured' }
  for (const r of records) {
    // Porkbun paths use the bare subdomain segment ('' → omit).
    const sub = r.name ? `/${r.name}` : ''
    await pb(`/dns/deleteByNameType/${domain}/${r.type}${sub}`) // best-effort clear
    const created = await pb(`/dns/create/${domain}`, {
      name: r.name,
      type: r.type,
      content: r.content,
      ttl: '600',
    })
    if (!created || created.status !== 'SUCCESS') {
      return { ok: false, error: `dns ${r.type} ${r.name || '@'}: ${created?.message ?? 'create failed'}` }
    }
  }
  console.log(`[porkbun] dns set for ${domain} (${records.length} records)`)
  return { ok: true }
}
