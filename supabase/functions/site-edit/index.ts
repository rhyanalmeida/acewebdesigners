/**
 * `site-edit` — post-purchase change requests from the customer's own page at
 * /demo/<token> (owner, 2026-11-02: "give them a page where they can request edits,
 * send photos and describe where — just say send it to us"). The token is the
 * capability, same as demo-site; only a purchased (or is_test) row may request.
 *
 * POST { token, action: 'list' }
 *   → { ok, edits: [{ id, request, photoCount, status, createdAt, appliedAt }] }
 * POST { token, action: 'request', request, photos?: [{ name, type, data(base64) }] }
 *   → 202 { ok, edit } and, in the background:
 *       1. photos → storage bucket `site-assets/<prospectId>/…` (public URLs)
 *       2. fetch the site's current files from its Netlify URL (fast builds are one
 *          index.html; Opus builds are 6 files — we only store what Netlify serves)
 *       3. one streamed model call: current files + request (+ the photos as image
 *          blocks so it can see what it is placing) → full contents of every file it changes
 *       4. park the full file set (unchanged ∪ changed) on the row: status 'ready',
 *          release_after = now() + 30-45 min. Owner rule (2026-11-02): a change must
 *          never look instant — "give it at least 30 mins" — so the customer-facing
 *          copy says "within the hour" and the deploy really does wait.
 *       5. pg_cron → POST { action:'release' } (header x-release-key = CAPI_INTERNAL_SECRET)
 *          every 5 min: deployFiles(netlify_site_id, files) for each due row, oldest
 *          first → applied / failed. Custom domain included (same Netlify site).
 *     A second request while one is pending is generated on top of the pending
 *     files (not the live site), so releases never overwrite each other.
 *
 * Limits: request ≤ 2000 chars, ≤ 5 photos, ≤ 2.5 MB base64 each (the page downsizes
 * to ≤1600px JPEG first), ≤ 3 pending edits per site.
 * Model: Sonnet 5.5 — edits land on a PAID customer's live site, quality beats pennies
 * (~$0.05-0.15 per edit). No-ops 503 without ANTHROPIC_API_KEY / NETLIFY_AUTH_TOKEN.
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.40.1'
import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { deployFiles, netlifyConfigured } from '../_shared/netlify.ts'
import { parseFiles, renderFiles, stripFences } from '../_shared/siteFiles.ts'

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined

const MODEL = 'claude-sonnet-5-5'
const BUCKET = 'site-assets'
const MAX_REQUEST_CHARS = 2000
const MAX_PHOTOS = 5
const MAX_PHOTO_B64 = 2_500_000
const MAX_PENDING = 3
const HOLD_MIN_MS = 30 * 60_000
const HOLD_JITTER_MS = 15 * 60_000 // 30-45 min: not clockwork
const RELEASE_BATCH = 5
const SITE_PATHS = ['/index.html', '/styles.css', '/main.js', '/services.html', '/about.html', '/contact.html']
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

interface Photo {
  name?: string
  type?: string
  data?: string
}
interface Body {
  token?: string
  action?: 'list' | 'request' | 'release'
  request?: string
  photos?: Photo[]
}
interface ProspectRow {
  id: string
  is_test: boolean
  business_name: string
  purchased_at: string | null
  site_status: string
  preview_url: string | null
  netlify_site_id: string | null
}
interface EditRow {
  id: string
  request: string
  photo_urls: string[]
  status: string
  error: string | null
  created_at: string
  applied_at: string | null
  files?: Record<string, string> | null
  release_after?: string | null
}

function publicEdit(e: EditRow) {
  return {
    id: e.id,
    request: e.request,
    photoCount: Array.isArray(e.photo_urls) ? e.photo_urls.length : 0,
    status: e.status === 'applying' || e.status === 'ready' ? 'queued' : e.status, // customer never sees internals
    createdAt: e.created_at,
    appliedAt: e.applied_at,
  }
}

/** Pull whatever the site currently serves — Netlify digest deploys replace the whole site, so we need every file. */
async function fetchSiteFiles(baseUrl: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  await Promise.all(
    SITE_PATHS.map(async (p) => {
      try {
        const r = await fetch(`${baseUrl}${p}`, { redirect: 'manual' })
        if (r.status !== 200) {
          await r.body?.cancel()
          return
        }
        const ct = r.headers.get('content-type') ?? ''
        // Netlify serves a 404 page as 200 text/html on some configs; require matching type.
        if (p.endsWith('.css') && !ct.includes('css')) return void (await r.body?.cancel())
        if (p.endsWith('.js') && !/javascript|ecmascript/.test(ct)) return void (await r.body?.cancel())
        if (p.endsWith('.html') && !ct.includes('html')) return void (await r.body?.cancel())
        out[p] = await r.text()
      } catch {
        /* missing file — fine */
      }
    }),
  )
  return out
}

const SYSTEM = `You maintain a small local business's live website. The owner has sent a change request, possibly with photos. Apply EXACTLY what they asked — nothing more — while keeping the site's existing design, structure, classes and tone intact.

OUTPUT CONTRACT — follow exactly:
- Output ONLY the files you changed, each as its COMPLETE new contents (never a diff, never "unchanged below"), preceded by exactly one marker line:
===== FILE: <filename> =====
- No markdown fences, no commentary before, between or after files. If nothing needs changing, output exactly: NO_CHANGE
- Photos: each has a public URL. Place them where the owner described (or where they clearly belong), as <img> with that URL, sensible alt text and the site's existing image styling (object-fit cover, radius, etc.). Do not re-host or rename them.
- TRUTHFULNESS: add only what the owner stated. Never invent prices, licenses, reviews, years in business or hours they did not give you.
- Keep the mobile layout working; keep every existing link and section unless asked to remove it; keep inline CSS/JS in the same place it was.`

async function applyEdit(editId: string, prospect: ProspectRow, request: string, photos: Photo[]): Promise<void> {
  const supa = admin()
  const save = (fields: Record<string, unknown>) => supa.from('site_edits').update(fields).eq('id', editId)
  try {
    await save({ status: 'applying' })

    // 1. photos → public storage URLs
    const urls: string[] = []
    for (const [i, ph] of photos.entries()) {
      const bytes = Uint8Array.from(atob(ph.data!), (c) => c.charCodeAt(0))
      const ext = ph.type === 'image/png' ? 'png' : ph.type === 'image/webp' ? 'webp' : ph.type === 'image/gif' ? 'gif' : 'jpg'
      const path = `${prospect.id}/${editId}-${i + 1}.${ext}`
      const { error } = await supa.storage.from(BUCKET).upload(path, bytes, { contentType: ph.type, upsert: true })
      if (error) throw new Error(`photo upload failed: ${error.message}`)
      urls.push(supa.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
    }
    if (urls.length) await save({ photo_urls: urls })

    // 2. base = the newest pending (ready) edit's files, else what the live site serves
    const { data: pending } = await supa
      .from('site_edits')
      .select('files')
      .eq('prospect_id', prospect.id)
      .eq('status', 'ready')
      .not('files', 'is', null)
      .neq('id', editId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const current =
      (pending as { files?: Record<string, string> } | null)?.files ?? (await fetchSiteFiles(prospect.preview_url!))
    if (!current['/index.html']) throw new Error('could not read the current site (no index.html served)')

    // 3. model
    const content: Anthropic.MessageParam['content'] = []
    photos.forEach((ph, i) => {
      content.push({ type: 'text', text: `Photo ${i + 1} (${ph.name ?? 'photo'}) — public URL: ${urls[i]}` })
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: ph.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: ph.data! },
      })
    })
    content.push({
      type: 'text',
      text:
        `Business: ${prospect.business_name}\n\nCHANGE REQUEST from the owner:\n"""\n${request}\n"""\n\n` +
        `CURRENT SITE FILES:\n\n${renderFiles(current)}`,
    })

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 24000,
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    })
    const msg = await stream.finalMessage()
    const text = (msg.content.find((b) => b.type === 'text') as { text?: string } | undefined)?.text ?? ''
    const releaseAfter = new Date(Date.now() + HOLD_MIN_MS + Math.random() * HOLD_JITTER_MS).toISOString()
    if (/^\s*NO_CHANGE\s*$/.test(text)) {
      await save({ status: 'ready', files: current, release_after: releaseAfter, error: 'model: no change needed' })
      return
    }
    const changed = parseFiles(stripFences(text))
    const unknown = Object.keys(changed).filter((p) => !current[p])
    if (!Object.keys(changed).length) throw new Error('model returned no files')
    if (unknown.length) throw new Error(`model invented files: ${unknown.join(', ')}`)

    // 4. park the whole set (unchanged + changed) for the delayed release
    await save({ status: 'ready', files: { ...current, ...changed }, release_after: releaseAfter, error: null })
    console.log(`[site-edit] ready ${editId} prospect=${prospect.id} files=${Object.keys(changed).join(',')} release=${releaseAfter}`)
  } catch (err) {
    console.error('[site-edit] failed', editId, err)
    await save({ status: 'failed', error: String(err).slice(0, 280) })
  }
}

/** pg_cron tick: deploy every ready edit whose hold has elapsed, oldest first. */
async function releaseDue(): Promise<{ released: number; failed: number }> {
  const supa = admin()
  const { data } = await supa
    .from('site_edits')
    .select('id, prospect_id, files')
    .eq('status', 'ready')
    .lte('release_after', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(RELEASE_BATCH)
  let released = 0
  let failed = 0
  for (const row of (data ?? []) as { id: string; prospect_id: string; files: Record<string, string> | null }[]) {
    const save = (fields: Record<string, unknown>) => supa.from('site_edits').update(fields).eq('id', row.id)
    try {
      const { data: pr } = await supa.from('prospects').select('netlify_site_id').eq('id', row.prospect_id).maybeSingle()
      const siteId = (pr as { netlify_site_id?: string | null } | null)?.netlify_site_id
      if (!siteId) throw new Error('prospect has no netlify_site_id')
      if (!row.files || !row.files['/index.html']) throw new Error('no files parked on the edit')
      const dep = await deployFiles(siteId, row.files)
      if (!dep.ok) throw new Error(dep.error ?? 'deploy failed')
      await save({ status: 'applied', applied_at: new Date().toISOString(), files: null }) // files: free the jsonb once live
      released++
      console.log(`[site-edit] released ${row.id}`)
    } catch (err) {
      console.error('[site-edit] release failed', row.id, err)
      await save({ status: 'failed', error: `release: ${String(err).slice(0, 260)}` })
      failed++
    }
  }
  return { released, failed }
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

  if (b.action === 'release') {
    const key = req.headers.get('x-release-key') ?? ''
    const want = Deno.env.get('CAPI_INTERNAL_SECRET') ?? ''
    if (!want || key !== want) return json({ error: 'forbidden' }, 403)
    return json({ ok: true, ...(await releaseDue()) })
  }

  const token = (b.token ?? '').trim()
  if (!/^[0-9a-f]{32}$/.test(token)) return json({ error: 'not found' }, 404)

  const supa = admin()
  const { data, error } = await supa
    .from('prospects')
    .select('id, is_test, business_name, purchased_at, site_status, preview_url, netlify_site_id')
    .eq('token', token)
    .maybeSingle()
  if (error || !data) return json({ error: 'not found' }, 404)
  const p = data as unknown as ProspectRow
  if (!p.purchased_at && !p.is_test) return json({ error: 'not found' }, 404) // customers only

  if (b.action === 'list') {
    const { data: rows } = await supa
      .from('site_edits')
      .select('id, request, photo_urls, status, error, created_at, applied_at')
      .eq('prospect_id', p.id)
      .order('created_at', { ascending: false })
      .limit(50)
    return json({ ok: true, edits: ((rows ?? []) as EditRow[]).map(publicEdit) })
  }

  if (b.action === 'request') {
    const request = (b.request ?? '').trim()
    if (request.length < 3) return json({ error: 'Tell us what to change.' }, 400)
    if (request.length > MAX_REQUEST_CHARS) return json({ error: `Keep it under ${MAX_REQUEST_CHARS} characters.` }, 400)
    const photos = Array.isArray(b.photos) ? b.photos : []
    if (photos.length > MAX_PHOTOS) return json({ error: `Up to ${MAX_PHOTOS} photos per request.` }, 400)
    for (const ph of photos) {
      if (!ph?.data || typeof ph.data !== 'string' || ph.data.length > MAX_PHOTO_B64 || !IMAGE_TYPES.has(ph.type ?? '')) {
        return json({ error: 'Photos must be JPG, PNG, WEBP or GIF and under a few MB each.' }, 400)
      }
    }
    if (p.site_status !== 'deployed' || !p.preview_url || !p.netlify_site_id) {
      return json({ error: 'Your site is still being set up — try again in a few minutes.' }, 409)
    }
    if (!Deno.env.get('ANTHROPIC_API_KEY') || !netlifyConfigured()) {
      return json({ error: 'Updates are temporarily unavailable — email us and we will take care of it.' }, 503)
    }
    const { count } = await supa
      .from('site_edits')
      .select('id', { count: 'exact', head: true })
      .eq('prospect_id', p.id)
      .in('status', ['queued', 'applying', 'ready'])
    if ((count ?? 0) >= MAX_PENDING) {
      return json({ error: "You've got a few changes with us already — we'll get those done first, then send the next." }, 409)
    }

    const { data: row, error: insErr } = await supa
      .from('site_edits')
      .insert({ prospect_id: p.id, request, status: 'queued' })
      .select('id, request, photo_urls, status, error, created_at, applied_at')
      .single()
    if (insErr || !row) return json({ error: 'Could not save your request — please try again.' }, 500)

    const task = applyEdit((row as EditRow).id, p, request, photos)
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) EdgeRuntime.waitUntil(task)
    else await task
    return json({ ok: true, edit: publicEdit(row as EditRow) }, 202)
  }

  return json({ error: 'unknown action' }, 400)
})
