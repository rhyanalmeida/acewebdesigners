/**
 * Outbound demo-site funnel — the single monthly plan offered on /demo/<token>,
 * plus every piece of "what happens next" copy the page shows (single source).
 *
 * SECURITY + pricing truth: the real charge comes from the Stripe Price in the
 * STRIPE_PRICE_DEMO_MONTHLY Edge secret; `monthly` below is DISPLAY ONLY and
 * must be kept in sync with that Price (same convention as restaurantPlans.ts).
 *
 * This funnel fires NO Meta pixel/CAPI events — it's cold-email driven, not
 * ad-driven (see CLAUDE.md, outbound funnel).
 *
 * Copy rule (owner): claim only what the system actually does. No invented
 * stats, no social proof, no promises the provisioning chain doesn't keep.
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
  monthly: 37, // owner decision 2026-11-04 (was 49) — matches the live Stripe Price
  tagline: 'The site you just previewed — on your own domain, handled for you.',
  features: [
    'The exact website from your preview, taken live',
    'Your own .com domain — registered for you, included',
    'Hosting, SSL certificate and security included',
    'Unlimited updates — email us, we make the change',
    'Cancel anytime, no contract',
  ],
}

/** Where customers send change requests (unlimited, included in the plan). */
export const SUPPORT_EMAIL = 'hello@acewebdesigners.com'

/** Google review link (owner-supplied 2026-09-22) — asked for AFTER purchase only, never before. */
export const GOOGLE_REVIEW_URL = 'https://share.google/zIg87wr3mBcAgLpDv'

/** The three things that happen after the Stripe checkout, in order. */
export const GO_LIVE_STEPS: { title: string; body: string }[] = [
  {
    title: 'Confirm your domain',
    body: "We've suggested one from your business name and checked it's available. Change it if you like.",
  },
  {
    title: 'Secure checkout',
    body: `$${OUTBOUND_PLAN.monthly}/month on Stripe. Card on file, cancel anytime — nothing else to sign.`,
  },
  {
    title: 'We take it live',
    body: 'We register the domain, connect it and turn on SSL. Usually live within the hour — you can watch it happen right on this page.',
  },
]

/** What the plan covers once the site is live — the "maintenance" story. */
export const AFTER_LIVE: { title: string; body: string }[] = [
  {
    title: 'Unlimited updates, included',
    body: `New photos, a new service, changed hours, a phone number — email ${SUPPORT_EMAIL} and we make the change. No limit, no extra charge.`,
  },
  {
    title: 'Hosting and security handled',
    body: 'Hosting, SSL certificate and domain renewal are all part of the monthly price. You never log in to anything.',
  },
  {
    title: 'Cancel anytime',
    body: `No contract. One email to ${SUPPORT_EMAIL} and your subscription ends — no fees, no questions.`,
  },
]

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What if I want something changed before I pay?',
    a: `Just reply to the email this link came from, or write ${SUPPORT_EMAIL}. Tell us what to change and we'll update the preview — you only pay when you're happy with it.`,
  },
  {
    q: 'What do I have to do after I pay?',
    a: 'Nothing. We handle the domain, the connection and the security certificate. You get a welcome email right away, and this page shows you the moment the site is live — usually within the hour.',
  },
  {
    q: 'I already own a domain. Can I use it?',
    a: `Yes. At checkout choose "I already have a domain" and type it in. After you pay, this page shows the two records to add where your domain is registered (GoDaddy, Google, Squarespace, Wix…). It takes a few minutes, and if you'd rather not touch it, email ${SUPPORT_EMAIL} and we'll walk you through it.`,
  },
  {
    q: 'Is there a contract or setup fee?',
    a: `No. It's $${OUTBOUND_PLAN.monthly} a month, including the domain, hosting and every update. Cancel anytime by email.`,
  },
  {
    q: 'Who do I talk to once it’s live?',
    a: `${SUPPORT_EMAIL} — that's your support line. A real person reads it and makes the change.`,
  },
]

/**
 * /demo/<token> opened before a build exists (site_status 'none'): the click on the
 * email link IS the interest signal, so the page starts the build on open — no button
 * (owner, 2026-11-02). It runs the FAST single-page path (Haiku 5.5, ~50s, ~$0.005), so
 * nobody who never clicks costs anything and nobody who clicks waits long.
 * Copy claims only what the chain does.
 */
export const BUILDING_COPY = {
  heading: "Putting the finishing touches on {business}'s new website…",
  body: "It'll be ready to view right here in a minute or two. Keep this tab open — it refreshes on its own, and the preview stays at this link.",
  failed: "We couldn't open your preview just now.",
  retry: 'Try again',
} as const

/**
 * Post-purchase change requests (owner, 2026-11-02): the customer's page has a
 * "send us a change" form with photos; the edit is applied to the live site and the
 * status shows here. Copy rule: say "send it to us" — never who or what does the work.
 */
export const CHANGE_REQUEST = {
  heading: 'Want something changed?',
  body: 'Send it to us right here — new photos, a different headline, a service added, hours, anything. Describe the change and where it goes; attach photos if you have them. Updates are unlimited and included.',
  placeholder: 'e.g. "Swap the top photo for the attached one, and add Gutter Cleaning to the services list."',
  photoLabel: 'Add photos',
  submit: 'Send the change',
  sending: 'Sending…',
  statuses: {
    queued: "Received — we're on it",
    applying: "Received — we're on it",
    applied: 'Done — live on your site',
    failed: "Needs a closer look — we've got it",
  } as Record<string, string>,
  afterSubmit: "Got it. We'll have it done within the hour — this page updates when it's live.",
  emailFallback: `Prefer email? ${SUPPORT_EMAIL} works too.`,
} as const

/** How a customer finds their way back here (owner, 2026-11-02: "make sure they can save that"). */
export const KEEP_PAGE = {
  heading: "Keep this page — it's where you send changes",
  body: 'Bookmark it, or send the link to yourself. It never expires, and your welcome email has it too.',
  copy: 'Copy link',
  copied: 'Copied',
  email: 'Email it to myself',
  emailSubject: 'My website page — Ace Web Designers',
  emailBody: `Your website page (send changes from here any time):\n\n{url}\n\nUpdates are unlimited and included. Questions: ${SUPPORT_EMAIL}`,
} as const

/** Netlify's apex load balancer — the A record an owned domain points at (same as provision-domain). */
export const NETLIFY_APEX_IP = '75.2.60.5'

/** Post-purchase copy for the "I already have a domain" path (DemoPage PurchasedView). */
export const OWN_DOMAIN_HELP = {
  heading: 'Two records to add where your domain lives',
  body: 'Log in where you bought the domain (GoDaddy, Google, Squarespace, Wix, Namecheap…), open its DNS settings and add these. Most registrars apply them within an hour; this page turns green on its own once we can see them.',
  rather: `Rather not touch DNS? Email ${SUPPORT_EMAIL} and we'll walk you through it on a quick screen-share — no passwords by email, please.`,
}
