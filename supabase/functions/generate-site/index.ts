/**
 * `generate-site` — auto-build a stunning multi-page preview website for a booking.
 *
 * Fired asynchronously by `book` right after a real (non-test) appointment is
 * created, and by the /admin Retry button. Claude Opus 4.8 writes a complete
 * multi-page static site (Home / Services / About / Contact + shared styles.css
 * with micro-animations + main.js) personalized to the lead's business (name,
 * trade, city, phone), deployed to its own brand-new Netlify site. The link
 * lands on the appointment row (`preview_url`) and shows in /admin.
 *
 * Architecture — STAGED, because Supabase Edge isolates have a ~400s wall-clock
 * budget and a full multi-page Opus generation can exceed it in one shot. Each
 * stage answers 202 immediately, generates its slice of the site in
 * EdgeRuntime.waitUntil, then self-invokes the next stage with the accumulated
 * files (each stage = fresh isolate = fresh time budget):
 *   stage 1  styles.css + main.js + index.html      (sets the design system)
 *   stage 2  services.html + about.html             (matches stage-1 design)
 *   stage 3  contact.html → create Netlify site → deploy everything
 * Progress lives in appointments.site_status (queued → generating → deployed |
 * failed; No-Show sets deleted via `result`). If an isolate dies mid-run the row
 * stays 'generating' and /admin offers Retry (restarts from stage 1).
 *
 * Auth (deployed --no-verify-jwt):
 *   • x-internal-key === SUPABASE_SERVICE_ROLE_KEY  (book trigger + stage chain), or
 *   • a Supabase user JWT whose email is in ADMIN_EMAILS (admin Retry).
 *
 * POST { appointmentId, force? }                      → start (stage 1)
 * POST { appointmentId, stage: 2|3, files } (internal) → continue the chain
 *
 * Cost: ~35-55k Opus output tokens per site ≈ $1.00-1.50 per booking.
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.40.1'
import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'
import { createNetlifySite, deployFiles, netlifyConfigured } from '../_shared/netlify.ts'

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined

const MODEL = 'claude-opus-4-8' // quality matters — this site is the sales pitch
const MAX_TOKENS_PER_STAGE = 30000

const FILE_MARKER = /^=====\s*FILE:\s*([\w./-]+)\s*=====\s*$/gm

const DESIGN_SYSTEM_PROMPT = `You are an elite web designer and front-end developer producing a preview website that will be shown to a small local business owner in a sales meeting to win their business. Quality bar: the owner should think "this looks better than sites I'd pay thousands for" and find it hard to say no.

OUTPUT CONTRACT — follow exactly:
- Output ONLY files. Before each file, print exactly one marker line:
===== FILE: <filename> =====
  followed immediately by that file's raw contents. No markdown fences, no commentary before, between, or after files. Output ONLY the files you are asked for in this request.
- The site is multi-page: / (index.html), /services.html, /about.html, /contact.html. Every page links the shared stylesheet (<link rel="stylesheet" href="/styles.css">) and script (<script src="/main.js" defer></script>) and shares the same nav + footer with working links between pages.
- The ONLY external requests allowed are Google Fonts. NO external images, frameworks, or CDNs. All imagery via inline SVG and CSS (shapes, patterns, gradients, crafted icons) — intentional, not clip-art.
- Fully responsive, mobile-first (sound at 360px, 768px, 1200px), with a working hamburger nav on mobile. Semantic HTML; every page gets its own <title> and meta description.

DESIGN — this must look stunning:
- Distinctive, premium design fitted to this specific trade — its colors, mood, and imagery language. NEVER generic AI aesthetics: no purple gradients, no Inter/Roboto/system fonts, no cookie-cutter sameness. Pick 2 characterful Google Fonts (one display, one body) and a cohesive palette with strong contrast, defined as CSS custom properties in styles.css.
- Rich but tasteful MICRO-ANIMATIONS throughout (styles.css + main.js, vanilla only):
  • scroll-reveal via IntersectionObserver (fade/slide/scale-in with slight stagger),
  • a hero entrance animation and a subtle ambient motion element (drifting SVG shapes or a slow gradient shift),
  • hover states with depth (lift + shadow + color transitions) on cards and buttons, animated link underlines,
  • an animated stat/counter or a scroll progress bar as a signature touch,
  • respect prefers-reduced-motion.

TRUTHFULNESS — hard rules:
- NEVER invent prices, discounts, license numbers, certifications, street addresses, opening hours, years in business, star ratings, or review counts presented as real. Testimonials must be clearly labeled "Example testimonial" in small text.
- Use ONLY the contact details provided in the brief. If something isn't provided, design around it rather than fabricating it.

Every line should look deliberate. This site is the pitch.`

interface StageSpec {
  files: string[]
  instruction: string
}

const STAGES: Record<number, StageSpec> = {
  1: {
    files: ['styles.css', 'main.js', 'index.html'],
    instruction:
      `For THIS request, output exactly these files in this order: styles.css, main.js, index.html.\n` +
      `- styles.css: the entire shared design system + all animations for the whole site (nav, footer, buttons, cards, section layouts, reveal classes, page-hero styles the inner pages will reuse).\n` +
      `- main.js: nav toggle, IntersectionObserver reveals, counters, small delights. Vanilla, defensive, under 150 lines.\n` +
      `- index.html (Home): sticky nav (business name as wordmark, links to /, /services.html, /about.html, /contact.html, phone CTA button); hero with a strong trade-specific headline + subline + call CTA + secondary CTA; a highlights strip; 3 featured services teasing /services.html; why-choose-us trust points; 2-3 example-labeled testimonials; service-area line; closing CTA band; footer with tel: link and "Website preview by Ace Web Designers".`,
  },
  2: {
    files: ['services.html', 'about.html'],
    instruction:
      `The design system (styles.css, main.js) and index.html already exist — they are provided below. Match them EXACTLY: same nav, footer, fonts, palette, classes, and animation hooks. Add page-specific styles only via a small <style> block in the page <head> if truly needed.\n` +
      `For THIS request, output exactly these files in this order: services.html, about.html.\n` +
      `- services.html: full services page — 5-8 services this trade actually offers, each a crafted card with an inline SVG icon and a 2-3 sentence description; a process/how-we-work section (3-4 steps); CTA band.\n` +
      `- about.html: the business story angle (generic and honest — no invented years or certifications), values, what working with them feels like, expanded why-us, a generically-phrased team section; CTA band.`,
  },
  3: {
    files: ['contact.html'],
    instruction:
      `The design system (styles.css, main.js) and index.html already exist — they are provided below. Match them EXACTLY: same nav, footer, fonts, palette, classes, and animation hooks.\n` +
      `For THIS request, output exactly this file: contact.html.\n` +
      `- contact.html: prominent phone tel: CTA; a beautifully styled contact form (fields only — it posts nowhere; note near the button that calling is fastest); service-area section; availability phrased as "Contact us for availability" — do NOT invent hours.`,
  },
}

/** Split the model output on FILE markers into { "/name": content }. */
export function parseFiles(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  const matches = [...raw.matchAll(FILE_MARKER)]
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const start = (m.index ?? 0) + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : raw.length
    const name = m[1].replace(/^\/+/, '')
    const content = raw.slice(start, end).trim()
    if (name && content) out[`/${name}`] = content
  }
  return out
}

function stripFences(raw: string): string {
  let s = raw.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim()
  }
  return s
}

interface Body {
  appointmentId?: string
  force?: boolean
  /** Internal chain state (stage 2/3 self-invocations only). */
  stage?: number
  files?: Record<string, string>
}

interface ApptRow {
  id: string
  is_test: boolean
  site_status: string | null
  netlify_site_id: string | null
  contacts: {
    first_name: string | null
    business_name: string | null
    business_type: string | null
    city: string | null
    state: string | null
    phone: string | null
  } | null
}

function businessBrief(appt: ApptRow): string {
  const c = appt.contacts
  const businessName = c?.business_name?.trim() || `${c?.first_name ?? 'Local'}'s Business`
  const trade = c?.business_type?.trim() || 'general contracting'
  const place = [c?.city, c?.state].filter(Boolean).join(', ')
  return (
    `The business:\n` +
    `- Business name: ${businessName}\n` +
    `- Trade / type of business: ${trade}\n` +
    (place ? `- Location: ${place}\n` : `- Location: not provided (use "your area" phrasing)\n`) +
    (c?.phone ? `- Phone: ${c.phone}\n` : `- Phone: not provided (make CTAs link to /contact.html instead of tel:)\n`) +
    (c?.first_name ? `- Owner first name: ${c.first_name}\n` : '')
  )
}

/** Run one Opus stage; returns the newly generated files. Throws on bad output. */
async function generateStage(
  stage: number,
  appt: ApptRow,
  priorFiles: Record<string, string>,
): Promise<Record<string, string>> {
  const spec = STAGES[stage]
  let userMsg = `${businessBrief(appt)}\n${spec.instruction}`
  if (stage > 1) {
    const ctx = ['/styles.css', '/main.js', '/index.html']
      .filter((p) => priorFiles[p])
      .map((p) => `===== FILE: ${p.slice(1)} =====\n${priorFiles[p]}`)
      .join('\n\n')
    userMsg += `\n\nEXISTING FILES (match this design exactly; do NOT re-output them):\n\n${ctx}`
  }

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS_PER_STAGE,
    system: DESIGN_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMsg }],
  })
  const msg = await stream.finalMessage()
  const text = msg.content.find((b) => b.type === 'text') as { text?: string } | undefined
  const files = parseFiles(stripFences(text?.text ?? ''))

  for (const want of spec.files) {
    if (!files[`/${want}`]) {
      throw new Error(`stage ${stage}: model did not return ${want} (got: ${Object.keys(files).join(', ') || 'none'})`)
    }
  }
  return files
}

/** Fire the next stage as a fresh invocation (fresh isolate = fresh time budget). */
async function invokeNextStage(appointmentId: string, stage: number, files: Record<string, string>): Promise<void> {
  const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-site`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-key': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    },
    body: JSON.stringify({ appointmentId, stage, files }),
  })
  if (!resp.ok) throw new Error(`stage ${stage} handoff failed (${resp.status}) ${(await resp.text()).slice(0, 150)}`)
  await resp.body?.cancel()
}

async function runStage(stage: number, appt: ApptRow, priorFiles: Record<string, string>): Promise<void> {
  const supa = admin()
  const save = (fields: Record<string, unknown>) =>
    supa.from('appointments').update(fields).eq('id', appt.id)

  try {
    if (stage === 1) await save({ site_status: 'generating', site_error: null })

    const files = { ...priorFiles, ...(await generateStage(stage, appt, priorFiles)) }

    if (stage < 3) {
      await invokeNextStage(appt.id, stage + 1, files)
      console.log(`[generate-site] stage ${stage} done appt=${appt.id} → stage ${stage + 1}`)
      return
    }

    // ── final stage: create the Netlify site (reuse a previous one) + deploy ────
    const c = appt.contacts
    const businessName = c?.business_name?.trim() || `${c?.first_name ?? 'preview'}'s business`
    let siteId = appt.netlify_site_id
    let siteUrl: string | null = null
    if (!siteId) {
      const site = await createNetlifySite(businessName)
      if (!site) throw new Error('Netlify site create failed')
      siteId = site.id
      siteUrl = site.url
      await save({ netlify_site_id: siteId })
    }

    const dep = await deployFiles(siteId, files)
    if (!dep.ok) throw new Error(dep.error ?? 'Netlify deploy failed')

    await save({
      ...(siteUrl ? { preview_url: siteUrl } : {}),
      site_status: 'deployed',
      site_generated_at: new Date().toISOString(),
      site_error: null,
    })
    console.log(`[generate-site] deployed appt=${appt.id} site=${siteId} files=${Object.keys(files).length}`)
  } catch (err) {
    console.error(`[generate-site] stage ${stage} failed`, appt.id, err)
    await save({ site_status: 'failed', site_error: `stage ${stage}: ${String(err).slice(0, 280)}` }).then(
      () => {},
      () => {},
    )
  }
}

Deno.serve(async (req: Request) => {
  const pre = handlePreflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  // ── auth: internal trigger/chain (book + stages) OR admin JWT (Retry) ────────
  const internal =
    req.headers.get('x-internal-key') === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!internal) {
    const adminUser = await requireAdmin(req)
    if (!adminUser) return json({ error: 'unauthorized' }, 401)
  }

  if (!netlifyConfigured()) return json({ error: 'NETLIFY_AUTH_TOKEN not set' }, 503)
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return json({ error: 'ANTHROPIC_API_KEY not set' }, 503)

  let b: Body
  try {
    b = (await req.json()) as Body
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }
  if (!b.appointmentId) return json({ error: 'appointmentId required' }, 400)
  const stage = b.stage ?? 1
  if (!STAGES[stage]) return json({ error: 'invalid stage' }, 400)
  if (stage > 1 && !internal) return json({ error: 'stages are internal' }, 403) // chain only

  const supa = admin()
  const { data, error } = await supa
    .from('appointments')
    .select(
      'id, is_test, site_status, netlify_site_id, contacts:contact_id ( first_name, business_name, business_type, city, state, phone )',
    )
    .eq('id', b.appointmentId)
    .single()
  if (error || !data) return json({ error: 'appointment not found' }, 404)
  const appt = data as unknown as ApptRow

  if (stage === 1) {
    if (appt.is_test && !b.force) return json({ ok: true, skipped: 'test booking' })
    if (appt.site_status === 'deployed' && !b.force) return json({ ok: true, skipped: 'already deployed' })
  }

  const task = runStage(stage, appt, b.files ?? {})
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) {
    EdgeRuntime.waitUntil(task)
  } else {
    // Local dev fallback — no background task API, run inline.
    await task
  }
  return json({ ok: true, started: true, stage }, 202)
})
