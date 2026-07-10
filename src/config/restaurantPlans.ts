/**
 * Restaurant "Build Your Site" plan + wizard configuration.
 *
 * This is the self-serve, monthly-subscription funnel (separate from the
 * contractor free-design/booking funnel). The visitor configures a restaurant
 * site in a guided wizard, then subscribes monthly via Stripe; we build and
 * deliver the real site after purchase.
 *
 * SECURITY: Stripe Price IDs live ONLY in Edge secrets (STRIPE_PRICE_<PLAN>).
 * The client sends a plan KEY; `create-subscription` resolves it to a Price ID
 * server-side — no price ids in the bundle. Prices below are display-only.
 *
 * This funnel uses the MAIN pixel/dataset (1703925480259996) — restaurants are
 * NOT the contractor dataset. See src/config/pixels.ts.
 */

export type PlanKey = 'starter' | 'pro' | 'premium'

export interface RestaurantPlan {
  key: PlanKey
  name: string
  /** Display price in USD / month (the real charge comes from the Stripe Price). */
  monthly: number
  tagline: string
  features: string[]
  /** Visually flag the recommended tier. */
  highlighted?: boolean
}

export const RESTAURANT_PLANS: RestaurantPlan[] = [
  {
    key: 'starter',
    name: 'Starter',
    monthly: 99,
    tagline: 'Everything a new spot needs to look great online.',
    features: [
      'Custom 1-page site (menu, hours, location, contact)',
      'Mobile-first design + your photos',
      'Click-to-call & Google Maps directions',
      'Hosting, SSL & monthly updates included',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    monthly: 149,
    highlighted: true,
    tagline: 'For restaurants that want reservations & ordering.',
    features: [
      'Everything in Starter',
      'Multi-page site + photo gallery',
      'Online reservations / waitlist link',
      'Online-ordering button (your provider)',
      'Local SEO + Google Business Profile setup',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    monthly: 249,
    tagline: 'Full presence — site, ordering & ongoing marketing.',
    features: [
      'Everything in Pro',
      'Digital menu with seasonal updates',
      'Events / specials section you can refresh',
      'Priority same-week edits',
      'Monthly performance check-in',
    ],
  },
]

export function getPlan(key: PlanKey): RestaurantPlan {
  return RESTAURANT_PLANS.find((p) => p.key === key) ?? RESTAURANT_PLANS[0]
}

/** Cuisine / restaurant types — drive the wizard preset + preview copy. */
export const CUISINES = [
  'Italian',
  'Mexican',
  'American / Diner',
  'Pizza',
  'Asian',
  'Café / Bakery',
  'Bar & Grill',
  'Fine Dining',
  'Food Truck',
  'Other',
] as const
export type Cuisine = (typeof CUISINES)[number]

/** Sections the owner can toggle for their site. id is sent in custom_data. */
export interface SiteSection {
  id: string
  label: string
  desc: string
  /** Pre-checked by default. */
  default?: boolean
}

export const SITE_SECTIONS: SiteSection[] = [
  { id: 'menu', label: 'Menu', desc: 'Show your dishes & prices', default: true },
  { id: 'hours', label: 'Hours & Location', desc: 'Open times + map', default: true },
  { id: 'reservations', label: 'Reservations', desc: 'Book-a-table / waitlist link' },
  { id: 'ordering', label: 'Online Ordering', desc: 'Order / delivery button' },
  { id: 'gallery', label: 'Photo Gallery', desc: 'Show off the food & space', default: true },
  { id: 'about', label: 'Our Story', desc: 'About the restaurant' },
  { id: 'reviews', label: 'Reviews', desc: 'Pull in your Google reviews' },
  { id: 'events', label: 'Events & Specials', desc: 'Happy hour, live music, etc.' },
]

/** Color themes for the live preview. */
export interface SiteTheme {
  id: string
  name: string
  /** Tailwind-ish hex used to paint the preview. */
  accent: string
  bg: string
  text: string
}

export const SITE_THEMES: SiteTheme[] = [
  { id: 'rustic', name: 'Rustic', accent: '#9a3412', bg: '#fdf6ec', text: '#1c1917' },
  { id: 'fresh', name: 'Fresh', accent: '#15803d', bg: '#f4fbf4', text: '#14241a' },
  { id: 'bold', name: 'Bold', accent: '#b91c1c', bg: '#0f0f10', text: '#f5f5f4' },
  { id: 'coastal', name: 'Coastal', accent: '#0e7490', bg: '#f0fafb', text: '#0c2329' },
]

/** The full wizard selection — serialized into Stripe metadata + sent to CAPI. */
export interface BuilderConfig {
  restaurantName: string
  cuisine: Cuisine
  sections: string[]
  themeId: string
}
