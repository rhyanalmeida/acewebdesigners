/**
 * The ONLY facts the reply desk may state about the outbound offer. Mirrors
 * src/config/outboundPlan.ts (display copy) — `outboundFacts.test.ts` asserts the price
 * and support address match so the two can't drift. Change both together.
 *
 * Copy rule (owner): claim only what the system actually does. No invented stats, no
 * social proof, no promises the provisioning chain doesn't keep.
 */

export const OUTBOUND_PRICE = 37 // owner decision 2026-11-04 (was 49); Stripe price + STRIPE_PRICE_DEMO_MONTHLY changed the same day
export const SUPPORT_EMAIL = 'hello@acewebdesigners.com'

export const OUTBOUND_FACTS: readonly string[] = [
  `The preview is free; nothing is owed unless they decide to take it live.`,
  `Taking it live is $${OUTBOUND_PRICE} a month, on a card, cancel anytime, no contract and no setup fee.`,
  `That price includes the domain (a new .com registered for them, or the one they already own), hosting, the SSL certificate, and unlimited updates.`,
  `Updates: they email what to change (menu, hours, photos, a new service, a phone number) and it gets done — no limit, no extra charge. ${SUPPORT_EMAIL} is the support line.`,
  `If they already own a domain they keep it: at checkout they choose "I already have a domain" and type it in; after paying, the preview page shows the two DNS records to add at their registrar, and ${SUPPORT_EMAIL} will walk them through it if they want.`,
  `After checkout the site is usually live within the hour; they can watch it happen on the same preview page.`,
  `Before paying, they can ask for changes to the preview by replying — they only pay when they're happy with it.`,
  `There is a button on the preview page that takes it live; checkout is on Stripe.`,
  `The preview was put together from what's public about their business (their listing, reviews, photos); anything wrong can be changed.`,
]

/** Things the desk must never do — enforced in the prompt AND by lintDraft. */
export const OUTBOUND_NEVER: readonly string[] = [
  'offer a discount, a free month, a refund, or any price other than the monthly price',
  'promise a call at a specific time, a phone number, or a meeting',
  'promise custom features, integrations, e-commerce, booking systems, SEO results, rankings, or leads',
  'state timings in minutes or seconds, or say anything is instant',
  'mention software, tools, AI, automation, templates, or how the site was made',
  'quote statistics, client counts, review counts, or results',
  'send any link other than their preview link',
]
