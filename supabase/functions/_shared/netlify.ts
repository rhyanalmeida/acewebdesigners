/**
 * Netlify API — deploys the auto-generated preview website (one Netlify site per
 * booking; see functions/generate-site). Isolated here so it can be swapped/cut
 * later, mirroring ghl.ts: everything no-ops or returns { ok:false } when
 * NETLIFY_AUTH_TOKEN is unset and NEVER throws into the funnel.
 *
 * Deploy method: Netlify's file-digest deploy (no zip needed from Deno):
 *   1. POST /api/v1/sites { name }                          → site id + ssl_url
 *   2. POST /api/v1/sites/:id/deploys { files: {path: sha1} }
 *   3. PUT  /api/v1/deploys/:deploy_id/files/index.html     (raw bytes for each
 *      digest Netlify reports as `required`)
 */

const NETLIFY_API = 'https://api.netlify.com/api/v1'

const token = () => Deno.env.get('NETLIFY_AUTH_TOKEN')

export function netlifyConfigured(): boolean {
  return Boolean(token())
}

function headers(json = true): HeadersInit {
  const h: Record<string, string> = { Authorization: `Bearer ${token()}` }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

/** URL-safe slug from a business name, e.g. "Acme Plumbing LLC" → "acme-plumbing-llc". */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'preview'
  )
}

export interface NetlifySite {
  id: string
  url: string
}

/**
 * Create a new Netlify site named `preview-<slug>-<hex>`. Retries once with a
 * fresh random suffix on a name collision (422). Returns null on failure.
 */
export async function createNetlifySite(businessName: string): Promise<NetlifySite | null> {
  if (!netlifyConfigured()) return null
  const slug = slugify(businessName)
  for (let attempt = 0; attempt < 2; attempt++) {
    const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 6)
    const name = `preview-${slug}-${rand}`.slice(0, 63)
    try {
      const resp = await fetch(`${NETLIFY_API}/sites`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name }),
      })
      if (resp.status === 422) {
        console.error(`[netlify] site name taken (${name}) — retrying`)
        await resp.body?.cancel()
        continue
      }
      if (!resp.ok) {
        console.error('[netlify] site create failed', resp.status, (await resp.text()).slice(0, 200))
        return null
      }
      const data = (await resp.json()) as { id?: string; ssl_url?: string; url?: string }
      if (!data.id) return null
      return { id: data.id, url: data.ssl_url || data.url || `https://${name}.netlify.app` }
    } catch (err) {
      console.error('[netlify] site create error', err)
      return null
    }
  }
  return null
}

async function sha1Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', bytes as BufferSource)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Deploy a set of text files (path → content, paths like "/index.html") to a
 * site via the file-digest API and wait for the deploy to go live.
 * Returns { ok } / { ok:false, error }.
 */
export async function deployFiles(
  siteId: string,
  files: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  if (!netlifyConfigured()) return { ok: false, error: 'NETLIFY_AUTH_TOKEN unset' }
  try {
    const enc = new TextEncoder()
    const entries: { path: string; bytes: Uint8Array; sha: string }[] = []
    for (const [path, content] of Object.entries(files)) {
      const bytes = enc.encode(content)
      entries.push({ path, bytes, sha: await sha1Hex(bytes) })
    }

    const depResp = await fetch(`${NETLIFY_API}/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        files: Object.fromEntries(entries.map((e) => [e.path, e.sha])),
      }),
    })
    if (!depResp.ok) {
      return { ok: false, error: `deploy create failed (${depResp.status}) ${(await depResp.text()).slice(0, 200)}` }
    }
    const dep = (await depResp.json()) as { id?: string; required?: string[] }
    if (!dep.id) return { ok: false, error: 'deploy returned no id' }

    // Netlify lists which digests it still needs; a repeat deploy of identical
    // content may need nothing.
    const required = new Set(dep.required ?? entries.map((e) => e.sha))
    for (const e of entries) {
      if (!required.has(e.sha)) continue
      const upResp = await fetch(`${NETLIFY_API}/deploys/${dep.id}/files${e.path}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/octet-stream' },
        body: e.bytes,
      })
      if (!upResp.ok) {
        return { ok: false, error: `file upload failed for ${e.path} (${upResp.status}) ${(await upResp.text()).slice(0, 200)}` }
      }
      await upResp.body?.cancel()
      required.delete(e.sha) // identical files share a digest — upload once
    }

    // Poll briefly until the deploy is ready (usually seconds for one file).
    for (let i = 0; i < 15; i++) {
      const st = await fetch(`${NETLIFY_API}/deploys/${dep.id}`, { headers: headers() })
      if (st.ok) {
        const s = (await st.json()) as { state?: string }
        if (s.state === 'ready') return { ok: true }
        if (s.state === 'error') return { ok: false, error: 'deploy entered error state' }
      } else {
        await st.body?.cancel()
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
    // Not confirmed ready but upload succeeded — treat as ok (Netlify finishes async).
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err).slice(0, 200) }
  }
}

/** Delete a Netlify site (used when an appointment is marked No-Show). 404 = already gone. */
export async function deleteNetlifySite(siteId: string): Promise<{ ok: boolean; error?: string }> {
  if (!netlifyConfigured()) return { ok: false, error: 'NETLIFY_AUTH_TOKEN unset' }
  try {
    const resp = await fetch(`${NETLIFY_API}/sites/${siteId}`, {
      method: 'DELETE',
      headers: headers(false),
    })
    if (resp.ok || resp.status === 404) {
      await resp.body?.cancel()
      return { ok: true }
    }
    return { ok: false, error: `delete failed (${resp.status}) ${(await resp.text()).slice(0, 200)}` }
  } catch (err) {
    return { ok: false, error: String(err).slice(0, 200) }
  }
}
