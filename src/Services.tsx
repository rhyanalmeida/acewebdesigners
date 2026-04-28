import React from 'react'
import { Rocket, Palette, Code2, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

import {
  Section,
  Eyebrow,
  GradientHeading,
  Card,
  Reveal,
  IconTile,
  BadgePill,
} from './components/ui'

interface Pkg {
  Icon: typeof Rocket
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
    Icon: Rocket,
    name: 'Website in a Day',
    price: '200',
    monthly: '15',
    description: 'Perfect for businesses needing a professional web presence quickly.',
    features: ['One-day turnaround', 'Mobile responsive design', 'Basic SEO setup', 'Contact form integration'],
    budgetKey: 'basic',
  },
  {
    Icon: Palette,
    name: 'Standard Website',
    price: '1,000',
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
    Icon: Code2,
    name: 'E-commerce Website',
    price: '1,500',
    monthly: '50',
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

// Feature comparison row labels
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
      {/* HERO */}
      <Section tone="mesh" padding="lg" className="!pb-12">
        <div className="text-center max-w-3xl mx-auto" data-reveal="up">
          <Eyebrow tone="inverted">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Our packages
          </Eyebrow>
          <GradientHeading
            level={1}
            size="xl"
            tone="inverted"
            className="mt-5"
            accent="free design"
          >
            Pick the package that fits — after seeing your
          </GradientHeading>
          <p className="mt-5 text-lg text-white/80 leading-relaxed">
            Professional web solutions tailored to your business. Every package starts with a free homepage mockup.
          </p>
          <div className="mt-6 inline-flex">
            <BadgePill tone="success">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              All packages include a free design mockup
            </BadgePill>
          </div>
        </div>
      </Section>

      {/* PACKAGES */}
      <Section tone="muted" padding="lg" className="-mt-8">
        <Reveal variant="stagger" className="grid gap-6 lg:grid-cols-3">
          {PACKAGES.map((pkg, i) => (
            <div
              key={pkg.name}
              data-reveal-stagger-child
              style={{ transitionDelay: `${i * 90}ms` }}
              className="relative h-full"
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <BadgePill tone="brand" glow>
                    ⭐ Most popular
                  </BadgePill>
                </div>
              )}
              <Card
                tone={pkg.popular ? 'default' : 'default'}
                padding="xl"
                rounded="xl3"
                interactive
                shine
                className={`h-full flex flex-col ${pkg.popular ? 'ring-2 ring-brand-300' : ''}`}
              >
                <IconTile tone={pkg.popular ? 'brand' : 'neutral'} size="lg">
                  <pkg.Icon />
                </IconTile>
                <h2 className="mt-6 font-display text-2xl font-bold text-surface-900">{pkg.name}</h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-gradient-brand font-display text-5xl font-bold">${pkg.price}</span>
                  <span className="text-surface-600 font-semibold text-sm">upfront</span>
                </div>
                <p className="text-sm text-surface-500 mt-1">+ ${pkg.monthly}/month hosting & support</p>

                <p className="mt-5 text-surface-600 leading-relaxed">{pkg.description}</p>

                <BadgePill tone="success" className="mt-5 self-start">
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                  Includes free mockup
                </BadgePill>

                <ul className="mt-6 space-y-3 flex-1">
                  {pkg.features.map(feature => (
                    <li key={feature} className="flex items-start gap-3 text-surface-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleGetStarted(pkg)}
                  className={`mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full py-4 px-6 font-bold magnetic-btn ring-focus-brand transition-all duration-300 ease-premium ${
                    pkg.popular
                      ? 'bg-brand-gradient text-white shadow-glow-brand'
                      : 'bg-surface-900 text-white hover:bg-surface-800 shadow-soft hover:shadow-lift'
                  }`}
                >
                  Get my free design
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </Card>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* COMPARISON TABLE */}
      <Section tone="default" padding="lg" containerSize="lg">
        <div className="text-center max-w-2xl mx-auto">
          <Eyebrow>Compare</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-4" accent="best for you">
            Which package is
          </GradientHeading>
        </div>

        <div className="mt-12 overflow-x-auto rounded-xl3 ring-1 ring-surface-200 bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="px-6 py-5 font-semibold text-surface-700">Feature</th>
                {PACKAGES.map(p => (
                  <th key={p.name} className="px-6 py-5 font-display font-semibold text-surface-900">
                    {p.name}
                    {p.popular && (
                      <span className="ml-2 inline-block align-middle">
                        <BadgePill tone="brand">Popular</BadgePill>
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_FEATURES.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? 'bg-surface-50' : 'bg-white'}>
                  <td className="px-6 py-4 font-medium text-surface-800">{row.label}</td>
                  {(['basic', 'standard', 'ecommerce'] as const).map(key => (
                    <td key={key} className="px-6 py-4">
                      {row[key] ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="Included" />
                      ) : (
                        <span className="text-surface-300" aria-label="Not included">—</span>
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
