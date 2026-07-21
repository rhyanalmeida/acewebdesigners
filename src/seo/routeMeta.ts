/**
 * Per-route SEO metadata.
 *
 * Each path → { title, description, canonical (absolute URL),
 *               ogImage (absolute URL), keywords?, robots? }
 *
 * Used by `<SeoMeta />` to set runtime <head> tags via react-helmet-async.
 * Once SSG (vite-react-ssg or react-snap) is wired up, the same map drives
 * static HTML emission per route — single source of truth.
 */

export interface RouteMeta {
  title: string
  description: string
  canonical: string
  ogImage?: string
  keywords?: string
  /** Defaults to "index, follow". Use "noindex, follow" for thin/legal pages if desired. */
  robots?: string
}

const SITE = 'https://acewebdesigners.com'
const DEFAULT_OG = `${SITE}/logo.png`

const baseMeta = (path: string, partial: Omit<RouteMeta, 'canonical'>): RouteMeta => ({
  ...partial,
  canonical: `${SITE}${path}`,
  ogImage: partial.ogImage ?? DEFAULT_OG,
})

export const ROUTE_META: Record<string, RouteMeta> = {
  '/': baseMeta('/', {
    title: 'Websites for Contractors | Ace Web Designers',
    description:
      'We build websites for people who do the actual work. You see a custom made mockup on a 15-minute call before you pay anything.',
    keywords:
      'contractor website design, trades website, plumber website, electrician website, remodeler website',
  }),
  '/about': baseMeta('/about', {
    title: 'Rhyan and Valerie | Ace Web Designers',
    description:
      'Two people who started this because Rhyan’s dad built bathrooms for a living and had no website. What we do and who we do it for.',
  }),
  '/services': baseMeta('/services', {
    title: 'What We Build | Ace Web Designers',
    description:
      'Websites, social media, and the software that usually gets overpriced: email dashboards, automatic reminders, and CRMs. Basic SEO on every site.',
  }),
  '/work': baseMeta('/work', {
    title: 'Work | Ace Web Designers',
    description:
      'A few sites we have built, and the accounts we run. Every screenshot is the live site.',
  }),
  '/contact': baseMeta('/contact', {
    title: 'Book a Call | Ace Web Designers',
    description:
      'Pick a time. It takes 10–15 minutes, we show you a custom made website mockup, and it costs nothing to get on the call.',
  }),
  '/socialmedia': baseMeta('/socialmedia', {
    title: 'Social Media for Trades | Ace Web Designers',
    description:
      'One account we run has 198 followers and 51,400 likes, and it brought its owner two bathrooms worth over $20,000. Follower counts are not the point.',
    keywords:
      'contractor social media, trades social media, TikTok for contractors, Instagram for trades, Google Business Profile management',
  }),
  '/refer': baseMeta('/refer', {
    title: 'Refer Someone | Ace Web Designers',
    description:
      'Send us a business that needs a website. When they launch with us, you get half the profit on their site.',
  }),
  '/landing': baseMeta('/landing', {
    title: 'Free Website Design for Small Business | Ace Web Designers',
    description:
      'Your website designed for free. Pay only if you love it. Same-day launches. Built for restaurants, services, and local businesses nationwide.',
  }),
  '/contractorlanding': baseMeta('/contractorlanding', {
    title: 'Contractor Website + Social Media | Free Design First | Ace Web Designers',
    description:
      'Websites and social media built to bring in more jobs for contractors and home service pros. Free homepage design + first week of posts free. Same-day launches available.',
    keywords:
      'contractor website design, contractor social media, home service website, construction website, plumber website, electrician website, free contractor website design',
  }),
  '/buildyoursite': baseMeta('/buildyoursite', {
    title: 'Build Your Restaurant Website — from $99/mo | Ace Web Designers',
    description:
      'Design your restaurant’s website in minutes with a live preview, then go live on a simple monthly plan. Menu, reservations, online ordering — we build, host & update it.',
    keywords:
      'restaurant website design, restaurant website builder, menu website, online ordering website, restaurant web design monthly',
  }),
  '/privacy': baseMeta('/privacy', {
    title: 'Privacy Policy | Ace Web Designers',
    description: 'How Ace Web Designers handles your data — privacy policy and contact details.',
    robots: 'noindex, follow',
  }),
  '/termsofservice': baseMeta('/termsofservice', {
    title: 'Terms of Service | Ace Web Designers',
    description: 'Terms of service for engagements with Ace Web Designers.',
    robots: 'noindex, follow',
  }),
}

export const getRouteMeta = (path: string): RouteMeta => {
  // Normalize: strip trailing slash (except root), drop query/hash.
  const cleanPath = path.split('?')[0].split('#')[0]
  const normalized =
    cleanPath !== '/' && cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath
  return ROUTE_META[normalized] ?? ROUTE_META['/']
}
