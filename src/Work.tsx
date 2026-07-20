import React from 'react'
import { ExternalLink } from 'lucide-react'

import { Section, Eyebrow, GradientHeading, FinalCta } from './components/ui'
import { SeoMeta, organizationLd, breadcrumbForPath } from './seo'

/**
 * Three pieces, not seven.
 *
 * Four sites were pulled from this page 2026-07-20 per
 * docs/REDESIGN_PLAN_2026-07-20.md §1: Chess Teaching USA (hero is an obviously
 * AI-generated composite), Champona (the most AI-looking site of the seven),
 * Hot Pot One (compression-damaged hero) and Oliver's Cafe (hero image does not
 * load at all). Showing them was actively arguing against us. They are still
 * our clients and the work still exists — it just is not the shop window.
 *
 * Every image is a real screenshot of the live site, captured 2026-07-20 and
 * served locally as WebP. No stock, no mockup frames, no invented metrics.
 */

const goContact = () =>
  window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'contact' } }))

interface Project {
  title: string
  trade: string
  description: string
  image: string
  link: string
  /** Only ever a real, attributable quote. Never a metric. */
  quote?: { text: string; author: string }
}

const PROJECTS: Project[] = [
  {
    title: 'Dunn Construction',
    trade: 'Deck building',
    description:
      'A South Shore deck builder with a portfolio that looks as considered as the carpentry. Full-bleed project photography, a quote form that reaches the owner directly, and a dark treatment that keeps the work the loudest thing on the page.',
    image: '/work/dunn.webp',
    link: 'https://dunnconstructionma.com/',
  },
  {
    title: 'Conuco Takeout',
    trade: 'Dominican kitchen',
    description:
      'Bilingual throughout, English and Spanish, with the food photographed properly and ordering that works one-handed on a phone in a car park.',
    image: '/work/conuco.webp',
    link: 'https://conucotakeout.com/',
    quote: {
      text: 'A website that truly represents my restaurant.',
      author: 'Pedro Dipre-Rojas, owner',
    },
  },
  {
    title: 'Told History',
    trade: 'Our own',
    description:
      'Our history channel, turned into a storefront. Branded merch and secure checkout, in a brand world that matches the tone of the videos sending the traffic. We test things here before we try them on anyone else.',
    image: '/work/told.webp',
    link: 'https://toldhistory.com/',
  },
]

const Work: React.FC = () => (
  <>
    <SeoMeta path="/work" jsonLd={[organizationLd(), breadcrumbForPath('/work')!]} />

    <section className="relative bg-cream-50 text-ink-900 bg-paper-noise" aria-label="Our work">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-14 sm:pt-24 lg:pt-28">
        <Eyebrow tone="muted">Work</Eyebrow>
        <GradientHeading level={1} size="display" className="mt-6 max-w-3xl">
          Three we are happy to be judged on.
        </GradientHeading>
        <p className="mt-8 max-w-2xl text-lg text-ink-800 leading-relaxed">
          We have built more than this. These are the ones we would show you if you asked in
          person. Every screenshot is the live site — go and click it.
        </p>
      </div>
    </section>

    {/* Full-bleed image, caption below, alternating alignment. One client at a
        time at full width beats a tidy grid of seven at thumbnail size. */}
    {PROJECTS.map((p, i) => (
      <Section key={p.title} tone={i % 2 === 0 ? 'default' : 'muted'} padding="lg">
        <article className="grid gap-8 lg:grid-cols-12 lg:gap-12 items-start">
          <div className={`lg:col-span-8 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
            <a href={p.link} target="_blank" rel="noopener noreferrer" className="block group">
              <div className="overflow-hidden border border-ink-900/20 bg-cream-200">
                <img
                  src={p.image}
                  alt={`The ${p.title} website`}
                  className="block w-full object-cover object-top transition-transform duration-700 ease-premium group-hover:scale-[1.01]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </a>
          </div>

          <div className={`lg:col-span-4 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
            <span className="label-mono text-signal-600">{p.trade}</span>
            <h2 className="mt-3 font-display text-3xl text-ink-900">{p.title}</h2>
            <p className="mt-4 text-ink-800 leading-relaxed">{p.description}</p>

            {p.quote && (
              <blockquote className="mt-6 border-l-2 border-signal-500 pl-4">
                <p className="font-display text-lg text-ink-900">&ldquo;{p.quote.text}&rdquo;</p>
                <footer className="mt-2 label-mono text-ink-700/70">{p.quote.author}</footer>
              </blockquote>
            )}

            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 label-mono text-ink-900 hover:text-signal-600 underline underline-offset-4 transition-colors"
            >
              Visit the site
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </article>
      </Section>
    ))}

    <FinalCta
      eyebrow="Book a time"
      heading="Yours does not exist yet"
      accent="but it will before we speak"
      body="We build a custom made website mockup for your business before the call, so there is something real on the screen when you join."
      ctaLabel="See available times"
      onCta={goContact}
    />
  </>
)

export default Work
