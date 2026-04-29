import React from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'

import {
  Section,
  BadgePill,
  PageHero,
  SectionHeading,
  StaggerGrid,
  PriceCard,
  TrustStack,
} from './components/ui'

interface Pkg {
  name: string
  price: string
  monthly: string
  description: string
  features: string[]
  popular?: boolean
  budgetKey: 'basic' | 'standard' | 'ecommerce'
}

const PACKAGES: Pkg[] = [
  {
    name: 'Website in a Day',
    price: '$200',
    monthly: '15',
    description: 'Perfect for businesses needing a professional web presence quickly.',
    features: ['One-day turnaround', 'Mobile responsive design', 'Basic SEO setup', 'Contact form integration'],
    budgetKey: 'basic',
  },
  {
    name: 'Standard Website',
    price: '$1,000',
    monthly: '30',
    description: 'Professional multi-page website solution for established businesses.',
    popular: true,
    features: [
      'Custom multi-page design',
      'Advanced SEO optimization',
      'Content management system',
      '3 rounds of revisions',
      'Social media integration',
      'Analytics dashboard',
    ],
    budgetKey: 'standard',
  },
  {
    name: 'E-commerce Website',
    price: '$1,500',
    monthly: '45',
    description: 'Complete e-commerce solution for businesses ready to sell online.',
    features: [
      'Full e-commerce setup',
      'Product management system',
      'Secure payment integration',
      'Inventory management',
      'Order processing system',
      'Customer account portal',
    ],
    budgetKey: 'ecommerce',
  },
]

const COMPARE_FEATURES: Array<{ label: string; basic: boolean; standard: boolean; ecommerce: boolean }> = [
  { label: 'Free design mockup', basic: true, standard: true, ecommerce: true },
  { label: 'Mobile responsive', basic: true, standard: true, ecommerce: true },
  { label: 'Hosting included', basic: true, standard: true, ecommerce: true },
  { label: 'SSL secure', basic: true, standard: true, ecommerce: true },
  { label: 'Multi-page design', basic: false, standard: true, ecommerce: true },
  { label: 'Content management', basic: false, standard: true, ecommerce: true },
  { label: 'Advanced SEO', basic: false, standard: true, ecommerce: true },
  { label: 'Online payments', basic: false, standard: false, ecommerce: true },
  { label: 'Inventory management', basic: false, standard: false, ecommerce: true },
]

function Services() {
  React.useEffect(() => {
    document.title = 'Our Services | Web Design & Development in Leominster'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Explore our professional web design and development services in Leominster, MA. From quick launch websites to full e-commerce solutions, we have the perfect package for your business.'
      )
    }
  }, [])

  // PRESERVED: same custom event dispatch that App.tsx listens for.
  const handleGetStarted = (pkg: Pkg) => {
    const event = new CustomEvent('navigate', {
      detail: {
        page: 'contact',
        data: {
          budget: pkg.budgetKey,
          message: `I'm interested in the ${pkg.name} package.`,
        },
      },
    })
    window.dispatchEvent(event)
  }

  return (
    <>
      <PageHero
        eyebrow="Our packages"
        eyebrowIcon={Sparkles}
        size="xl"
        headline="Pick the package that fits — after seeing your"
        accent="free design"
        sub="Professional web solutions tailored to your business. Every package starts with a free homepage mockup."
        className="!pb-12"
      >
        <div className="mt-8 flex justify-center">
          <TrustStack />
        </div>
      </PageHero>

      {/* PRICING — using PriceCard primitive */}
      <Section tone="default" padding="lg" className="-mt-8">
        <StaggerGrid
          items={PACKAGES}
          className="grid gap-6 lg:grid-cols-3"
          delayMs={90}
          keyFn={pkg => pkg.name}
          renderItem={pkg => (
            <PriceCard
              tier={pkg.name}
              price={pkg.price}
              priceSub={`+ $${pkg.monthly}/month hosting & support`}
              description={pkg.description}
              features={pkg.features}
              highlight={pkg.popular ?? false}
              ctaLabel="Get my free design"
              onCta={() => handleGetStarted(pkg)}
            />
          )}
        />
      </Section>

      {/* COMPARISON TABLE — editorial */}
      <Section tone="muted" padding="lg" containerSize="lg">
        <SectionHeading
          eyebrow="Compare"
          heading="Which package is"
          accent="best for you"
        />

        <div className="mt-12 overflow-x-auto rounded-xl3 ring-1 ring-ink-900/10 bg-cream-50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-900/10">
                <th className="px-6 py-5 label-mono text-ink-700/70">Feature</th>
                {PACKAGES.map(p => (
                  <th key={p.name} className="px-6 py-5 font-display text-base font-semibold text-ink-900">
                    <span className="block">{p.name}</span>
                    {p.popular && (
                      <span className="mt-1 inline-flex">
                        <BadgePill tone="brand">Popular</BadgePill>
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_FEATURES.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? 'bg-cream-100/50' : ''}>
                  <td className="px-6 py-4 font-medium text-ink-800">{row.label}</td>
                  {(['basic', 'standard', 'ecommerce'] as const).map(key => (
                    <td key={key} className="px-6 py-4">
                      {row[key] ? (
                        <CheckCircle2 className="h-5 w-5 text-forest-700" aria-label="Included" />
                      ) : (
                        <span className="text-ink-700/30" aria-label="Not included">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  )
}

export default Services
