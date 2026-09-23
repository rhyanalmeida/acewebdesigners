/**
 * Outbound demo-site funnel — the single monthly plan offered on /demo/<token>.
 *
 * SECURITY + pricing truth: the real charge comes from the Stripe Price in the
 * STRIPE_PRICE_DEMO_MONTHLY Edge secret; `monthly` below is DISPLAY ONLY and
 * must be kept in sync with that Price (same convention as restaurantPlans.ts).
 *
 * This funnel fires NO Meta pixel/CAPI events — it's cold-email driven, not
 * ad-driven (see CLAUDE.md, outbound funnel).
 */

export interface OutboundPlan {
  key: 'demo_monthly'
  name: string
  /** Display price in USD / month — sync with the Stripe Price. */
  monthly: number
  tagline: string
  features: string[]
}

export const OUTBOUND_PLAN: OutboundPlan = {
  key: 'demo_monthly',
  name: 'Your Website, Live',
  monthly: 49,
  tagline: 'The site you just previewed — on your own domain, handled for you.',
  features: [
    'The exact website from your preview, refined and taken live',
    'Your own .com domain — registered for you, included',
    'Hosting, SSL and security included',
    'Unlimited updates — email hello@acewebdesigners.com, we make the change',
    'Cancel anytime',
  ],
}

/** Where customers send change requests (unlimited, included in the plan). */
export const SUPPORT_EMAIL = 'hello@acewebdesigners.com'

/** Google review link (owner-supplied 2026-09-22) — asked for AFTER purchase only, never before. */
export const GOOGLE_REVIEW_URL = 'https://share.google/zIg87wr3mBcAgLpDv'
