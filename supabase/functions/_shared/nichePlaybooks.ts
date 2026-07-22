// Niche playbooks — the per-trade sales knowledge base.
//
// SOURCE OF TRUTH: the `niche_playbooks` Postgres table (migration 0009), whose
// rows are written by generate-brief's research stage (Claude + web search) and
// refreshed when stale. FALLBACK_PLAYBOOK below is the runtime fallback when the
// DB is empty/unreadable AND research is unavailable — brief/site generation is
// never blocked on the table.
//
// Selection reuses the exact trade matcher design systems use (matchesTrade in
// designSystems.ts), so a booking's trade resolves to its playbook and its art
// direction consistently.
//
// Pure Deno-compatible TS (no Deno.* / npm:*) so it bundles into Edge Functions
// AND is exercised by vitest (nichePlaybooks.test.ts).

import { matchesTrade } from './designSystems.ts'

export interface PricingRange {
  item: string
  low: number
  high: number
  source: string
  as_of: string
}

export interface NichePlaybook {
  id: string
  display_name: string
  /** lowercase trade keywords this playbook covers (matched like design-system trades). */
  trades: string[]
  how_customers_buy: string
  must_have_site_features: string
  credibility_levers: string
  pitch_angles: string
  upsell_ladder: string
  common_objections: string
  pricing: PricingRange[]
  sources: { title: string; url: string }[]
  researched_at?: string | null
}

/** Re-research a playbook when its data is older than this. */
export const PLAYBOOK_STALE_DAYS = 120

export function isPlaybookStale(pb: NichePlaybook, nowMs: number): boolean {
  if (!pb.researched_at) return true
  const age = nowMs - Date.parse(pb.researched_at)
  return !Number.isFinite(age) || age > PLAYBOOK_STALE_DAYS * 24 * 60 * 60 * 1000
}

/**
 * Generic local-service playbook — the floor, not the goal. Used only when no
 * researched row matches and live research is unavailable/fails. Deliberately
 * carries NO pricing figures: fabricated numbers are worse than none, so the
 * brief prompt tells the model to widen ranges / say research is thin instead.
 */
export const FALLBACK_PLAYBOOK: NichePlaybook = {
  id: 'generic-local-service',
  display_name: 'Local Service Business (generic)',
  trades: [],
  how_customers_buy:
    'Local service customers start with a Google search or a referral, compare 2-3 providers, and judge in seconds on reviews, photos of real work, and how easy it is to contact someone. Most call or submit a form from a phone; slow or confusing sites lose the job to the next result.',
  must_have_site_features:
    'One-tap call button visible at all times on mobile; a short quote-request form (name, phone, what they need); real photos of completed work; the service area stated plainly; Google reviews surfaced on the page.',
  credibility_levers:
    'Real job photos with a sentence of context beat stock imagery; a named owner with a face builds trust; licensing/insurance stated where applicable; review count and rating pulled from Google.',
  pitch_angles:
    "Lead with the value they can already see (the preview site exists — Hormozi's value equation: maximize dream outcome and likelihood, minimize their time and effort). Frame the cost of the status quo (SPIN implication questions: jobs going to competitors who look more established online). The close is a decision on something already built, not a commitment to a project.",
  upsell_ladder:
    'Website build → hosting/maintenance plan (keeps it fast, secure, updated) → local SEO / Google Business Profile management → social media content from job-site photos.',
  common_objections:
    '"I get all my work from referrals" → referrals check the website before calling; a weak site silently kills warm leads. "Too expensive" → anchor against the value of one booked job in their trade and the monthly cost spread.',
  pricing: [],
  sources: [],
  researched_at: null,
}

/**
 * Pick the playbook for a booking's trade. Returns the first active row whose
 * trade tags match (rows are ordered by sort), or undefined — the caller decides
 * whether to research or fall back.
 */
export function selectNichePlaybook(
  playbooks: NichePlaybook[],
  trade: string | undefined | null,
): NichePlaybook | undefined {
  return playbooks.find((p) => matchesTrade(p.trades, trade))
}

/** Compact prompt block for generate-site: what this trade's site must accomplish. */
export function renderPlaybookForPrompt(pb: NichePlaybook): string {
  return `TRADE INSIGHT — what ${pb.display_name} customers need this site to do (fold these into the copy and structure; never invent facts about THIS business):
- HOW CUSTOMERS BUY: ${pb.how_customers_buy}
- MUST-HAVE FEATURES: ${pb.must_have_site_features}
- CREDIBILITY: ${pb.credibility_levers}`
}
