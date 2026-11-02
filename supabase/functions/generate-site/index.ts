/**
 * `generate-site` — auto-build a stunning multi-page preview website for a booking.
 *
 * Fired asynchronously by `book` right after a real (non-test) appointment is
 * created, and by the /admin Retry button. Claude Sonnet 5 writes the complete
 * multi-page static site (Home / Services / About / Contact + shared styles.css
 * with micro-animations + main.js) personalized to the lead's business (name,
 * trade, city, phone), deployed to its own brand-new Netlify site. The link
 * lands on the appointment row (`preview_url`) and shows in /admin.
 *
 * THREE-STAGE OPUS 4.8 CHAIN (2026-07-13; upgraded same day from a Sonnet 5
 * 2-stage chain — owner wanted King-Repairs-tier quality and accepted the
 * higher cost, ~$0.60-1.10/site). A single streamed call cannot finish a
 * quality site inside one isolate: Supabase Edge kills isolates at ~400s wall
 * clock (verified twice live). Each stage answers 202 and self-invokes the
 * next with the accumulated files — a fresh isolate = a fresh clock:
 *   stage 1  styles.css + main.js              (the whole design system)
 *   stage 2  index.html + services.html        (built on stage-1 classes)
 *   stage 3  about.html + contact.html → Netlify deploy
 * Design brief includes a VERIFIED Unsplash photo library (hallucinated photo
 * URLs 404) + the King Repairs art direction (dark luxury, photo hero, badge
 * chip, marquee ticker, counters). Progress lives in appointments.site_status
 * (queued → generating → deployed | failed). If an isolate dies the row stays
 * 'generating' and /admin offers Retry (restarts from stage 1).
 *
 * Auth (deployed --no-verify-jwt):
 *   • x-internal-key === SUPABASE_SERVICE_ROLE_KEY  (book trigger + stage chain), or
 *   • a Supabase user JWT whose email is in ADMIN_EMAILS (admin Retry).
 *
 * POST { appointmentId, force? }                       → start (stage 1), 202
 * POST { appointmentId, stage: 2, files } (internal)   → continue the chain
 *
 * SUBJECT ADAPTER (2026-08-30): the chain also builds demo sites for the
 * outbound cold-email funnel — POST { prospectId } instead of { appointmentId }.
 * The model input was only ever the business brief (name/trade/city/phone), so a
 * `prospects` row works identically; its site columns mirror appointments'.
 * The `demo-site` fn is the public trigger (per-prospect token, one build ever).
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.40.1'
import { handlePreflight, json } from '../_shared/cors.ts'
import { admin } from '../_shared/supabaseAdmin.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'
import { createNetlifySite, deployFiles, netlifyConfigured } from '../_shared/netlify.ts'
import { parseFiles, stripFences } from '../_shared/siteFiles.ts'
import {
  type DesignSystem,
  DEFAULT_DESIGN_SYSTEMS,
  designSystemById,
  renderArtDirection,
  selectDesignSystem,
} from '../_shared/designSystems.ts'
import {
  FALLBACK_PLAYBOOK,
  type NichePlaybook,
  renderPlaybookForPrompt,
  selectNichePlaybook,
} from '../_shared/nichePlaybooks.ts'

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined

const MODEL = 'claude-opus-4-8' // strongest designer; owner accepted ~$0.60-1.10/site for King-Repairs-tier quality
/**
 * FAST path (outbound prospects, 2026-11-02): the demo link in the cold email starts the
 * build on click, so the prospect is WAITING — a single Haiku 5.5 call writes one
 * self-contained index.html (inline CSS/JS, ~8k tokens) and deploys in the same isolate.
 * ~$0.005/site, target ≤90s click → live. Owner accepted the smaller model for speed.
 * Appointments (booking funnel) keep the 3-stage Opus chain — nobody is waiting on those.
 */
const FAST_MODEL = 'claude-haiku-5-5'


// Verified-live Unsplash photos (all curl-checked 200 on 2026-07-13). The model
// must use ONLY these — hallucinated photo IDs 404 and wreck the design.
const PHOTO_LIBRARY = `PHOTO LIBRARY — use ONLY these images.unsplash.com photos (any other photo URL will 404):
- photo-1600585154340-be6161a56a0c  striking modern home exterior at dusk, lit windows (best generic HERO)
- photo-1570129477492-45c003edd2be  classic American house, porch + lawn (traditional HERO)
- photo-1523217582562-09d0def993a6  white minimalist home exterior
- photo-1600047509807-ba8f99d2cdde  modern gray/white siding exterior
- photo-1503387762-592deb58ef4e  hands drafting on blueprints (planning/estimates)
- photo-1504307651254-35680f356dfd  construction crew on structural site (crews at work)
- photo-1541888946425-d81bb19240f5  large construction site, team in safety vests
- photo-1556912173-3bb406ef7e77  bright white modern kitchen (kitchen remodel)
- photo-1584622650111-993a426fbf0a  modern bathroom, glass shower + vanity
- photo-1620626011761-996317b8d101  white bathroom, tub + towels
- photo-1600566753086-00f18fb6b3ea  modern living room with staircase (interior reno)
- photo-1600607687939-ce8a6c25118c  sleek open-plan luxury interior
- photo-1562259949-e8e7689d7828  roller applying blue paint to wall (painting)
- photo-1595814433015-e6f5ce69614e  painter's paint-splattered jeans + brush (painting, character shot)
- photo-1589939705384-5185137a7f0f  carpenter with power tools at workbench (carpentry)
- photo-1621905251189-08b45d6a269e  electrician in hardhat wiring a wall (electrical)
- photo-1620653713380-7a34b773fef8  wrench on water-heater pipework (plumbing/HVAC)
- photo-1632759145351-1d592919f522  roofer laying shingles (roofing)
- photo-1635424710928-0544e8512eae  worker roped on rooftop by tree (roofing/tree work)
- photo-1558904541-efa843a96f01  pristine green lawn + hedge (lawn care/landscaping)
- photo-1416879595882-3373a0480b5b  soil + seed scoops (gardening/landscaping)
- photo-1607400201889-565b1ee75f8e  insulation install (insulation)
- photo-1581578731548-c64695cc6952  detail cleaning work (cleaning/handyman)
- photo-1580256081112-e49377338b7f  commercial corridor + cleaning cart (janitorial/commercial)
URL pattern: https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=1600&q=80 for hero backgrounds, w=800&q=75 for cards/sections. Pick 4-7 photos that FIT THIS TRADE; loading="lazy" on everything except the hero; meaningful alt text.`

// The system prompt is assembled per-site: constant scaffolding (output contract,
// photo library, motion craft, truthfulness) wraps the SELECTED art direction
// (renderArtDirection), so every generated site is visually unique. The shared
// page ingredients (hero, marquee, stat band, service cards, splits, CTA band,
// footer) stay required in the STAGES instructions; the art direction restyles them.
function buildSystemPrompt(ds: DesignSystem, pb: NichePlaybook, singleFile = false): string {
  const pagesRule = singleFile
    ? `- The site is ONE self-contained file, index.html: put ALL CSS in one <style> block in <head> and ALL JS in one <script> at the end of <body>. No external stylesheet/script. Nav links are in-page anchors (#services, #about, #contact).`
    : `- The site is multi-page: / (index.html), /services.html, /about.html, /contact.html. Every page links the shared stylesheet (<link rel="stylesheet" href="/styles.css">) and script (<script src="/main.js" defer></script>) and shares the same nav + footer with working links between pages.`
  return `You are an elite web designer and front-end developer producing a preview website that will be shown to a small local business owner in a sales meeting to win their business. Quality bar: the owner should think "this looks better than sites I'd pay thousands for" and find it hard to say no. The benchmark is a $10k agency build: rich, confident, deliberate — never a flat template.

OUTPUT CONTRACT — follow exactly:
- Output ONLY the files this request asks for, in the order asked. Before each file, print exactly one marker line:
===== FILE: <filename> =====
  followed immediately by that file's raw contents. No markdown fences, no commentary before, between, or after files.
${pagesRule}
- External requests allowed: Google Fonts + the photo library below. Nothing else (no frameworks, no CDNs). Icons via inline SVG — crafted, not clip-art.
- Fully responsive, mobile-first (sound at 360px, 768px, 1200px), with a working hamburger nav on mobile. Semantic HTML; every page gets its own <title> and meta description.
- HARD CODE BUDGET — each file must respect the line caps given in the request. This is a generation-time limit; exceeding it kills the build. Terse selectors, no comments, no dead CSS. Compact beats sprawling.
- DRY — single source of truth everywhere: design tokens (colors, spacing, radii, shadows, timing) defined ONCE as CSS custom properties and referenced everywhere; one .btn / .card / .section / .reveal system reused across all pages; the shared nav + footer markup identical byte-for-byte on every page; one IntersectionObserver in main.js drives all reveals. Never restate a style or script two ways.
- REQUIRED page ingredients (style them in the art direction below): a hero with a small badge/eyebrow chip + a display headline where ONE key word is emphasized (accent color) + subline + primary CTA (call) + secondary CTA + a row of small trust chips with inline SVG ticks; a slim scrolling MARQUEE ticker of 4-6 short trade promises after the hero; an animated STAT COUNTER band (3-4 process-fact stats); photo-and-text split sections; service cards with inline SVG icons; a photo-backed CTA band near the footer; a rich multi-column footer with tel: link and a small "Website preview by Ace Web Designers" line. NAV = business-name wordmark + small inline SVG mark + links + phone + accent CTA, solid/blurred on scroll.

${PHOTO_LIBRARY}

${renderArtDirection(ds)}

${renderPlaybookForPrompt(pb)}

MOTION CRAFT — motion is part of the quality bar (vanilla only, GPU-friendly transform/opacity, ALWAYS respect prefers-reduced-motion):
- Execute this style's MOTION SIGNATURE above as the memorable moments; keep everything smooth and intentional, never janky or gratuitous.
- One IntersectionObserver in main.js drives all scroll reveals with per-child stagger; a thin accent scroll-progress bar sits at the top of every page; stat counters count up on reveal; buttons and cards get tasteful hover feedback; the emphasized headline word gets its own reveal on load; the marquee scrolls via CSS and pauses on hover.
- Under prefers-reduced-motion: disable transforms/auto-scroll/Ken-Burns and simply show content.

TRUTHFULNESS — hard rules:
- NEVER invent prices, discounts, license numbers, certifications, street addresses, opening hours, years in business, star ratings, or review counts presented as real. Stat counters use process facts, not history. Testimonials must be clearly labeled "Example testimonial" in small text.
- Use ONLY the contact details provided in the brief. If something isn't provided, design around it rather than fabricating it.

Every line should look deliberate. This site is the pitch.`
}

/** Load active styles from the `design_systems` table; fall back to the bundled set on any error. */
async function loadDesignSystems(supa: ReturnType<typeof admin>): Promise<DesignSystem[]> {
  try {
    const { data, error } = await supa
      .from('design_systems')
      .select('id, name, trades, mood, palette, typography, layout, motion, photo')
      .eq('active', true)
      .order('sort', { ascending: true })
      .order('id', { ascending: true })
    if (error || !data || !data.length) return DEFAULT_DESIGN_SYSTEMS
    return data as unknown as DesignSystem[]
  } catch {
    return DEFAULT_DESIGN_SYSTEMS
  }
}

/** Resolve the design system: explicit override id, else deterministic by subject id + trade. */
async function resolveDesignSystem(
  supa: ReturnType<typeof admin>,
  subject: Subject,
  styleOverride?: string,
): Promise<DesignSystem> {
  const systems = await loadDesignSystems(supa)
  return (
    designSystemById(systems, styleOverride) ??
    selectDesignSystem(systems, subject.id, subject.brief.business_type)
  )
}

/** Load the matched niche playbook for trade-aware copy guidance. Never blocks a build. */
async function resolveNichePlaybook(
  supa: ReturnType<typeof admin>,
  trade: string | null | undefined,
): Promise<NichePlaybook> {
  try {
    const { data, error } = await supa
      .from('niche_playbooks')
      .select(
        'id, display_name, trades, how_customers_buy, must_have_site_features, credibility_levers, pitch_angles, upsell_ladder, common_objections, pricing, sources, researched_at',
      )
      .eq('active', true)
      .order('sort', { ascending: true })
      .order('id', { ascending: true })
    if (error || !data) return FALLBACK_PLAYBOOK
    return selectNichePlaybook(data as unknown as NichePlaybook[], trade) ?? FALLBACK_PLAYBOOK
  } catch {
    return FALLBACK_PLAYBOOK
  }
}

interface StageSpec {
  files: string[]
  maxTokens: number
  instruction: string
}

// Per-stage output budgets keep each streamed call inside one isolate's ~400s
// wall clock. Opus streams slower than Sonnet (~40-60 tok/s), so THREE smaller
// stages instead of two: ~10k tokens/stage ≈ 3-4 min each.
const STAGES: Record<number, StageSpec> = {
  1: {
    files: ['styles.css', 'main.js'],
    maxTokens: 14000,
    instruction:
      `For THIS request, output exactly these files in this order: styles.css, main.js.\n` +
      `Line caps (HARD — the stream is cut off if you run long, destroying the build): styles.css ≤ 700, main.js ≤ 130.\n` +
      `- styles.css: the ENTIRE shared design system + all animations for the whole site (tokens, nav incl. scrolled state, footer, buttons, badge chip, marquee, counters, cards, photo-split sections, hero + page-hero treatments, CTA band, reveal classes, form styles). Every page will be built from these classes — make the system complete.\n` +
      `- main.js: nav toggle + scrolled-nav class, one IntersectionObserver for all reveals, stat counters, marquee is pure CSS. Vanilla, defensive.`,
  },
  2: {
    files: ['index.html', 'services.html'],
    maxTokens: 13000,
    instruction:
      `The design system (styles.css, main.js) already exists — provided below. Build strictly on its classes and tokens; add at most a tiny page-specific <style> block if truly needed. Do NOT re-output the provided files.\n` +
      `For THIS request, output exactly these files in this order: index.html, services.html.\n` +
      `Line caps (HARD — both files must fit; if index runs long, tighten services): index.html ≤ 300, services.html ≤ 210.\n` +
      `- index.html (Home): the full ART DIRECTION home experience — photographic hero (badge chip, accent-italic word, dual CTAs, trust chips), marquee ticker, stat counter band, photo+text split section, 3 featured service cards teasing /services.html, why-choose-us, 2-3 example-labeled testimonials, service-area line, photo-backed CTA band, rich footer with tel: link and "Website preview by Ace Web Designers".\n` +
      `- services.html: compact page-hero (photo + overlay); 5-8 services this trade actually offers, each a crafted card with an inline SVG icon and a 2-3 sentence description; a process/how-we-work section (3-4 steps); photo-backed CTA band; same nav + footer byte-for-byte.`,
  },
  3: {
    files: ['about.html', 'contact.html'],
    maxTokens: 10000,
    instruction:
      `The design system (styles.css, main.js) and index.html already exist — provided below. Match them EXACTLY: same nav, footer, fonts, palette, classes, animation hooks. Do NOT re-output them.\n` +
      `For THIS request, output exactly these files in this order: about.html, contact.html.\n` +
      `Line caps (HARD — both files must fit): about.html ≤ 170, contact.html ≤ 150.\n` +
      `- about.html: compact page-hero (photo + overlay); the business story angle (generic and honest — no invented years or certifications), values, what working with them feels like, a photo+text split, expanded why-us; CTA band; same nav + footer byte-for-byte.\n` +
      `- contact.html: compact page-hero; prominent phone tel: CTA; a beautifully styled contact form (fields only — it posts nowhere; note near the button that calling is fastest); service-area section; availability phrased as "Contact us for availability" — do NOT invent hours; same nav + footer byte-for-byte.`,
  },
}
const FINAL_STAGE = 3

/** Single-call spec for the fast (prospect) path — one page, inline assets, then deploy. */
const FAST_STAGE: StageSpec = {
  files: ['index.html'],
  maxTokens: 12000,
  instruction:
    `For THIS request, output exactly ONE file: index.html — the complete homepage with ALL CSS inline in one <style> block and ALL JS inline in one <script> block.
` +
    `Line cap (HARD — the stream is cut off if you run long, destroying the build): index.html ≤ 420 lines total. Terse CSS, no comments.
` +
    `Sections in order: nav (wordmark + anchor links + tel: CTA) → photographic hero (badge chip, accent-italic word, dual CTAs, trust chips) → marquee ticker → stat counter band → #services: 4-6 service cards with inline SVG icons → photo+text split (#about: honest generic story, no invented history) → why-choose-us → 2 example-labeled testimonials → #contact: prominent tel: CTA + short styled form (posts nowhere; note that calling is fastest) + service-area line → photo-backed CTA band → footer with tel: link and "Website preview by Ace Web Designers".
` +
    `JS: nav toggle + scrolled-nav class, one IntersectionObserver for reveals + counters. Vanilla, defensive.
` +
    `MOBILE NAV — NON-NEGOTIABLE (phones are where this preview is judged). Use EXACTLY this markup/CSS/JS, styled to the art direction:
` +
    `  markup: <nav class="nav"><div class="nav-in"><a class="mark" href="#top">…</a><div class="links">…anchors…</div><a class="btn btn-primary nav-call" href="tel:…">Call</a><button class="burger" id="burger" aria-label="Menu" aria-expanded="false">…svg…</button></div><div class="menu" id="menu">…anchors + tel link…</div></nav>
` +
    `  css: .menu{display:none} .menu.open{display:flex;flex-direction:column} .burger{display:none} @media(max-width:900px){.links,.nav-call{display:none} .burger{display:block} .nav-in{display:flex;align-items:center;justify-content:space-between;gap:12px} .mark{font-size:1.05rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70vw}}
` +
    `  js: burger toggles menu.classList "open" + aria-expanded; any .menu a click closes it. The menu MUST be hidden on first paint at 360-900px wide and the header row MUST fit without overflow at 360px.`,
}

interface Body {
  appointmentId?: string
  /** Outbound-funnel subject: build for a `prospects` row instead (demo-site trigger). */
  prospectId?: string
  force?: boolean
  /** Internal chain state (stage 2 self-invocation only). */
  stage?: number
  files?: Record<string, string>
  /** Optional design-system id override (external callers, e.g. /admin Retry). */
  style?: string
  /** Resolved design system, threaded internally to stages 2-3 so they don't re-query/re-pick. */
  ds?: DesignSystem
  /** Resolved niche playbook, threaded internally like `ds`. */
  pb?: NichePlaybook
  /** Prospects default to the FAST single-page Haiku path; `full: true` forces the Opus chain. */
  full?: boolean
}

interface SubjectBrief {
  first_name: string | null
  business_name: string | null
  business_type: string | null
  city: string | null
  state: string | null
  phone: string | null
}

/**
 * The thing a site is built FOR: an appointment (contractor booking funnel) or a
 * prospect (outbound cold-email funnel). Only the brief reaches the model; the
 * row otherwise just gates (is_test/site_status) and stores the site fields —
 * prospect columns mirror appointments', so `save` only switches the table.
 */
interface Subject {
  kind: 'appointment' | 'prospect'
  id: string
  is_test: boolean
  site_status: string | null
  netlify_site_id: string | null
  brief: SubjectBrief
}

async function loadSubject(supa: ReturnType<typeof admin>, b: Body): Promise<Subject | null> {
  if (b.appointmentId) {
    const { data, error } = await supa
      .from('appointments')
      .select(
        'id, is_test, site_status, netlify_site_id, contacts:contact_id ( first_name, business_name, business_type, city, state, phone )',
      )
      .eq('id', b.appointmentId)
      .single()
    if (error || !data) return null
    const row = data as unknown as {
      id: string
      is_test: boolean
      site_status: string | null
      netlify_site_id: string | null
      contacts: SubjectBrief | null
    }
    return {
      kind: 'appointment',
      id: row.id,
      is_test: row.is_test,
      site_status: row.site_status,
      netlify_site_id: row.netlify_site_id,
      brief: row.contacts ?? {
        first_name: null, business_name: null, business_type: null, city: null, state: null, phone: null,
      },
    }
  }
  const { data, error } = await supa
    .from('prospects')
    .select('id, is_test, site_status, netlify_site_id, first_name, business_name, business_type, city, state, phone')
    .eq('id', b.prospectId!)
    .single()
  if (error || !data) return null
  const row = data as unknown as {
    id: string
    is_test: boolean
    site_status: string | null
    netlify_site_id: string | null
  } & SubjectBrief
  return {
    kind: 'prospect',
    id: row.id,
    is_test: row.is_test,
    site_status: row.site_status,
    netlify_site_id: row.netlify_site_id,
    brief: {
      first_name: row.first_name,
      business_name: row.business_name,
      business_type: row.business_type,
      city: row.city,
      state: row.state,
      phone: row.phone,
    },
  }
}

function businessBrief(subject: Subject): string {
  const c = subject.brief
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

/** Run one Sonnet stage; returns the newly generated files. Throws on bad output. */
async function generateStage(
  stage: number,
  subject: Subject,
  priorFiles: Record<string, string>,
  ds: DesignSystem,
  pb: NichePlaybook,
  fast = false,
): Promise<Record<string, string>> {
  const spec = fast ? FAST_STAGE : STAGES[stage]
  let userMsg = `${businessBrief(subject)}\n${spec.instruction}`
  if (stage > 1) {
    const ctx = ['/styles.css', '/main.js', '/index.html']
      .filter((p) => priorFiles[p])
      .map((p) => `===== FILE: ${p.slice(1)} =====\n${priorFiles[p]}`)
      .join('\n\n')
    userMsg += `\n\nEXISTING FILES (match this design exactly; do NOT re-output them):\n\n${ctx}`
  }

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
  const stream = anthropic.messages.stream({
    model: fast ? FAST_MODEL : MODEL,
    max_tokens: spec.maxTokens,
    // Haiku 5.5 thinks by default; off for speed (allowed at its default effort).
    ...(fast ? { thinking: { type: 'disabled' as const } } : {}),
    system: buildSystemPrompt(ds, pb, fast),
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
async function invokeNextStage(
  subject: Subject,
  stage: number,
  files: Record<string, string>,
  ds: DesignSystem,
  pb: NichePlaybook,
): Promise<void> {
  const idField = subject.kind === 'prospect' ? { prospectId: subject.id } : { appointmentId: subject.id }
  const resp = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-site`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-key': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    },
    body: JSON.stringify({ ...idField, stage, files, ds, pb }),
  })
  if (!resp.ok) throw new Error(`stage ${stage} handoff failed (${resp.status}) ${(await resp.text()).slice(0, 150)}`)
  await resp.body?.cancel()
}

async function runStage(
  stage: number,
  subject: Subject,
  priorFiles: Record<string, string>,
  threadedDs?: DesignSystem,
  styleOverride?: string,
  threadedPb?: NichePlaybook,
  fast = false,
): Promise<void> {
  const supa = admin()
  const table = subject.kind === 'prospect' ? 'prospects' : 'appointments'
  const save = (fields: Record<string, unknown>) =>
    supa.from(table).update(fields).eq('id', subject.id)

  // Stages 2-3 receive the resolved style + playbook; stage 1 resolves them (DB, else fallback).
  const ds = threadedDs ?? (await resolveDesignSystem(supa, subject, styleOverride))
  const pb = threadedPb ?? (await resolveNichePlaybook(supa, subject.brief.business_type))

  try {
    if (stage === 1) {
      await save({ site_status: 'generating', site_error: null })
      console.log(`[generate-site] ${subject.kind}=${subject.id} style="${ds.id}" (${ds.name}) trade="${subject.brief.business_type ?? ''}"`)
    }

    const t0 = Date.now()
    const files = { ...priorFiles, ...(await generateStage(stage, subject, priorFiles, ds, pb, fast)) }
    if (fast) console.log(`[generate-site] fast page generated ${subject.kind}=${subject.id} in ${Math.round((Date.now() - t0) / 1000)}s`)

    if (!fast && stage < FINAL_STAGE) {
      await invokeNextStage(subject, stage + 1, files, ds, pb)
      console.log(`[generate-site] stage ${stage} done ${subject.kind}=${subject.id} → stage ${stage + 1}`)
      return
    }

    // ── final stage: create the Netlify site (reuse a previous one) + deploy ────
    const c = subject.brief
    const businessName = c?.business_name?.trim() || `${c?.first_name ?? 'preview'}'s business`
    let siteId = subject.netlify_site_id
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
    console.log(`[generate-site] deployed ${subject.kind}=${subject.id} site=${siteId} files=${Object.keys(files).length}`)
  } catch (err) {
    console.error(`[generate-site] stage ${stage} failed`, subject.id, err)
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

  // ── auth: internal trigger/chain (book + stage 2) OR admin JWT (Retry) ──────
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
  if (!b.appointmentId && !b.prospectId) return json({ error: 'appointmentId or prospectId required' }, 400)
  if (b.appointmentId && b.prospectId) return json({ error: 'pass exactly one of appointmentId / prospectId' }, 400)
  const stage = b.stage ?? 1
  if (!STAGES[stage]) return json({ error: 'invalid stage' }, 400)
  if (stage > 1 && !internal) return json({ error: 'stages are internal' }, 403) // chain only

  const supa = admin()
  const subject = await loadSubject(supa, b)
  if (!subject) return json({ error: `${b.prospectId ? 'prospect' : 'appointment'} not found` }, 404)

  if (stage === 1) {
    if (subject.is_test && subject.kind === 'appointment' && !b.force) {
      return json({ ok: true, skipped: 'test booking' })
    }
    if (subject.site_status === 'deployed' && !b.force) return json({ ok: true, skipped: 'already deployed' })
  }

  const fast = subject.kind === 'prospect' && !b.full && stage === 1
  const task = runStage(stage, subject, b.files ?? {}, b.ds, b.style, b.pb, fast)
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime) {
    EdgeRuntime.waitUntil(task)
  } else {
    // Local dev fallback — no background task API, run inline.
    await task
  }
  return json({ ok: true, started: true, stage, fast }, 202)
})
