/**
 * JSON-LD structured-data builders.
 *
 * Each builder returns a plain object that callers serialize via JSON.stringify
 * into a <script type="application/ld+json"> tag (typically through
 * react-helmet-async).
 *
 * Honesty rule: no `aggregateRating` or numeric review counts here unless
 * sourced from real verified data. Empty/omitted is better than fabricated.
 */

const SITE = 'https://acewebdesigners.com'
const PHONE = '+1-774-446-7375'
const EMAIL = 'hello@acewebdesigners.com'
const ADDRESS = {
  '@type': 'PostalAddress' as const,
  addressLocality: 'Leominster',
  addressRegion: 'MA',
  addressCountry: 'US',
}

export const organizationLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'Ace Web Designers',
  url: SITE,
  logo: `${SITE}/logo.png`,
  email: EMAIL,
  telephone: PHONE,
  address: ADDRESS,
  sameAs: ['https://www.facebook.com/acewebdesigners', 'https://www.instagram.com/acewebdesigners'],
})

export const localBusinessLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE}/#localbusiness`,
  name: 'Ace Web Designers',
  url: SITE,
  image: `${SITE}/logo.png`,
  telephone: PHONE,
  email: EMAIL,
  priceRange: '$',
  address: ADDRESS,
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 42.5251,
    longitude: -71.7598,
  },
})

export const serviceLd = (params: {
  name: string
  description: string
  serviceType: string
  url: string
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: params.name,
  description: params.description,
  serviceType: params.serviceType,
  url: params.url,
  provider: { '@id': `${SITE}/#organization` },
  areaServed: {
    '@type': 'Country',
    name: 'United States',
  },
})

export const faqPageLd = (items: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
})

export const breadcrumbLd = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
})

const BREADCRUMB_LABELS: Record<string, string> = {
  '/about': 'About',
  '/services': 'Services',
  '/work': 'Our Work',
  '/reviews': 'Reviews',
  '/contact': 'Contact',
  '/socialmedia': 'Social Media',
  '/refer': 'Refer & Earn',
  '/landing': 'Free Website Design',
  '/contractorlanding': 'Contractor Websites',
  '/privacy': 'Privacy Policy',
  '/termsofservice': 'Terms of Service',
}

/**
 * Two-level breadcrumb (Home → current page) derived from the route path.
 * Returns null for the home route since a single-item breadcrumb is meaningless.
 */
export const breadcrumbForPath = (path: string) => {
  if (path === '/' || path === '') return null
  const label = BREADCRUMB_LABELS[path] ?? path.replace(/^\//, '').replace(/-/g, ' ')
  return breadcrumbLd([
    { name: 'Home', url: SITE },
    { name: label, url: `${SITE}${path}` },
  ])
}
