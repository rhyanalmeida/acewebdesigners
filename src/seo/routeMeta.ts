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
    title: 'Small Business Web Design + Social Media | Ace Web Designers',
    description:
      'Beautiful websites and social media management for small businesses. Free design first — pay only if you love it. Same-day launches available. Based in Leominster, MA.',
    keywords:
      'small business website design, contractor websites, social media management, web design Massachusetts',
  }),
  '/about': baseMeta('/about', {
    title: 'About Ace Web Designers | Built for Small Business',
    description:
      'A small Leominster, MA team helping small businesses across the U.S. get online and stay there. Free design first, no risk to start.',
  }),
  '/services': baseMeta('/services', {
    title: 'Web Design + Social Media Services | Ace Web Designers',
    description:
      'Websites from $200, hosting from $15/mo, and social media management from $30/wk. Free design and free first week — pay only if you love it.',
  }),
  '/work': baseMeta('/work', {
    title: 'Our Work | Real Small Business Websites | Ace Web Designers',
    description:
      'Real websites and social campaigns we’ve built for restaurants, contractors, and service businesses across the United States.',
  }),
  '/reviews': baseMeta('/reviews', {
    title: 'Client Reviews & Testimonials | Ace Web Designers',
    description:
      'Verified Google reviews from small business owners we’ve worked with. Real stories, real results.',
  }),
  '/contact': baseMeta('/contact', {
    title: 'Book a Free Design Call | Ace Web Designers',
    description:
      'Pick a 15-minute slot. We send you a free homepage design within 24 hours. No card on file, no commitment.',
  }),
  '/socialmedia': baseMeta('/socialmedia', {
    title: 'Social Media Management for Small Business | Ace Web Designers',
    description:
      'Posts that show your craft and bring work in. Standard $30/wk or Deluxe $99/wk — first week free, no card on file.',
    keywords:
      'social media management small business, contractor social media, Instagram management, TikTok for trades, Google Business Profile management',
  }),
  '/refer': baseMeta('/refer', {
    title: 'Refer & Earn — $200 Per Referral | Ace Web Designers',
    description:
      'Send us a small business that needs a website. When they launch with us, you get $200. Simple.',
  }),
  '/landing': baseMeta('/landing', {
    title: 'Free Website Design for Small Business | Ace Web Designers',
    description:
      'Your website designed for free. Pay only if you love it. Same-day launches. Built for restaurants, services, and local businesses nationwide.',
  }),
  '/contractorlanding': baseMeta('/contractorlanding', {
    title: 'Contractor Website + Social Media | Free Design First | Ace Web Designers',
    description:
      'Websites and social media that bring jobs in for contractors and home service pros. Free homepage design + first week of posts free. Same-day launches available.',
    keywords:
      'contractor website design, contractor social media, home service website, construction website, plumber website, electrician website, free contractor website design',
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
