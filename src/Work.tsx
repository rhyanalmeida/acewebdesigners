import React, { useState, useMemo } from 'react'
import { ExternalLink, Trophy, ArrowRight, Search } from 'lucide-react'

import {
  Section,
  Card,
  BadgePill,
  PageHero,
  StaggerGrid,
  FinalCta,
  TrustStack,
} from './components/ui'
import { SeoMeta, organizationLd, breadcrumbForPath } from './seo'

interface Project {
  title: string
  category: string
  description: string
  image: string
  link?: string
  technologies?: string[]
  features?: string[]
  pullQuote?: string
}

// Every image is a real screenshot of the live site, captured 2026-07-20 and served
// locally as WebP (20-71KB) — previously these were multi-MB third-party GIFs plus,
// for Told History, an Unsplash stock photo standing in for the actual site.
//
// Descriptions are first-person verb phrases about what we built, not adjective
// soup. Ordered strongest-first. No invented metrics: the old `pullQuote` values
// ("40% increase in online orders", "3× more qualified leads") were never measured,
// so the only quote that remains is one a client actually wrote.
const PROJECTS: Project[] = [
  {
    title: 'Dunn Construction',
    category: 'Construction',
    description:
      'We gave a South Shore deck builder a portfolio that looks as considered as the work. Full-bleed project photography, a quote form that reaches the owner directly, and a dark treatment that lets the carpentry carry the page.',
    image: '/work/dunn.webp',
    link: 'https://dunnconstructionma.com/',
    technologies: ['React', 'Tailwind CSS'],
    features: ['Project Gallery', 'Quote Requests', 'Mobile Responsive'],
  },
  {
    title: 'Conuco Takeout',
    category: 'Restaurant',
    description:
      'We built a bilingual ordering site for a Dominican kitchen in Leominster — English and Spanish throughout, the food photographed properly, and online ordering that works one-handed on a phone.',
    image: '/work/conuco.webp',
    link: 'https://conucotakeout.com/',
    technologies: ['React', 'Tailwind CSS', 'Firebase'],
    features: ['Online Ordering', 'Bilingual EN/ES', 'Menu Showcase'],
    pullQuote: '“A website that truly represents my restaurant.” — Pedro Dipre-Rojas, owner',
  },
  {
    title: 'Told History',
    category: 'E-commerce',
    description:
      'We turned a 21k-follower history channel into a storefront. Branded merch, secure checkout, and a brand world that matches the tone of the videos driving the traffic.',
    image: '/work/told.webp',
    link: 'https://toldhistory.com/',
    technologies: ['React', 'Tailwind CSS', 'E-commerce'],
    features: ['Online Store', 'Secure Payments', 'Mobile Responsive'],
  },
  {
    title: 'Hot Pot One',
    category: 'Restaurant',
    description:
      'We put a Quincy hot pot and dim sum restaurant online with a menu that stays current and ordering that does not require a phone call.',
    image: '/work/hotpot.webp',
    link: 'https://hotpotone.net/',
    technologies: ['React', 'Tailwind CSS', 'Node.js'],
    features: ['Online Ordering', 'Menu Management', 'Mobile Responsive'],
  },
  {
    title: 'Chess Teaching USA',
    category: 'Education',
    description:
      'We built a booking platform for a FIDE-certified instructor — lesson scheduling, programme breakdowns, and instructor credentials up front where parents look first.',
    image: '/work/chess.webp',
    link: 'https://chessteachingusa.com/',
    technologies: ['React', 'Tailwind CSS', 'Node.js'],
    features: ['Lesson Booking', 'Instructor Profiles', 'Resource Library'],
  },
  {
    title: 'Champona Champona',
    category: 'E-commerce',
    description:
      'We built the launch site for an anti-bullying childrens book by author Yolanda Quesada — the story, the message, and a direct path to buying a copy.',
    image: '/work/champona.webp',
    link: 'https://champonachampona.com/',
    technologies: ['React', 'Tailwind CSS'],
    features: ['Book Sales', 'Author Story', 'Mobile Responsive'],
  },
  {
    title: "Oliver's Cafe",
    category: 'Restaurant',
    description:
      'We brought a two-location Leominster and Fitchburg breakfast spot online, with menus, a gallery and location details for both storefronts.',
    image: '/work/olivers.webp',
    link: 'https://oliverscafema.com/',
    technologies: ['React', 'Tailwind CSS', 'JavaScript'],
    features: ['Photo Gallery', 'Menu Showcase', 'Two Locations'],
  },
]

function Work() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = useMemo(() => ['All', ...Array.from(new Set(PROJECTS.map(p => p.category)))], [])

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return PROJECTS.filter(p => {
      const okCat = selectedCategory === 'All' || p.category === selectedCategory
      const okSearch =
        !term ||
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      return okCat && okSearch
    })
  }, [selectedCategory, searchTerm])

  const goContact = () => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'contact' } }))
  }

  return (
    <>
      <SeoMeta path="/work" jsonLd={[organizationLd(), breadcrumbForPath('/work')!]} />
      <PageHero
        eyebrow="Our portfolio"
        eyebrowIcon={Trophy}
        headline="Beautiful work"
        accent="we've built"
        sub="Real websites for real local businesses. Click through any of them — they're all live."
      >
        <div className="mt-10 flex justify-center">
          <TrustStack />
        </div>
      </PageHero>

      {/* FILTER + SEARCH */}
      <Section tone="default" padding="md">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const active = selectedCategory === category
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-premium ring-focus-signal ${
                    active
                      ? 'bg-ink-900 text-cream-50'
                      : 'bg-cream-100 text-ink-800 hover:bg-cream-200 ring-1 ring-ink-900/10'
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-700/50 h-4 w-4" aria-hidden />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-cream-50 rounded-full ring-1 ring-ink-900/15 hover:ring-ink-900/30 focus:ring-2 focus:ring-signal-500 focus:outline-none transition-all duration-300 ease-premium"
              aria-label="Search projects"
            />
          </div>
        </div>
      </Section>

      {/* PROJECTS — editorial 2-col asymmetric grid */}
      <Section tone="muted" padding="lg">
        {filtered.length === 0 ? (
          <p className="text-center text-ink-700/70 py-12">No projects match your search.</p>
        ) : (
          <StaggerGrid
            items={filtered}
            className="grid gap-8 lg:grid-cols-2"
            delayMs={120}
            keyFn={p => p.title}
            renderItem={(project, i) => (
              <Card
                tone="default"
                padding="none"
                rounded="xl3"
                interactive
                shine
                className={`overflow-hidden h-full flex flex-col group ${
                  i % 2 === 0 ? 'lg:translate-y-0' : 'lg:translate-y-12'
                }`}
              >
                <div className="aspect-[16/10] overflow-hidden relative bg-cream-100">
                  <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-7 sm:p-9 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="label-mono text-signal-700">
                      {project.category}
                      {project.technologies && project.technologies[0] && (
                        <>
                          <span className="text-ink-700/30 mx-2">·</span>
                          {project.technologies.slice(0, 2).join(' / ')}
                        </>
                      )}
                    </span>
                    {project.pullQuote && (
                      <BadgePill tone="forest">
                        {project.pullQuote}
                      </BadgePill>
                    )}
                  </div>
                  <h3 className="mt-4 font-display text-2xl sm:text-3xl font-semibold text-ink-900 leading-tight">
                    {project.title}
                  </h3>
                  <p className="mt-3 text-ink-800 leading-relaxed flex-1">{project.description}</p>
                  {project.features && (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {project.features.slice(0, 3).map(feat => (
                        <span
                          key={feat}
                          className="text-xs font-medium px-2.5 py-1 rounded-full bg-cream-100 text-ink-800 ring-1 ring-ink-900/10"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                  <hr className="rule-hairline my-6" />
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-signal-700 hover:text-signal-800 font-semibold ring-focus-signal rounded font-display"
                    >
                      Visit live site
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-ink-700/50 font-medium">
                      Coming soon
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                </div>
              </Card>
            )}
          />
        )}
      </Section>

      <FinalCta
        eyebrow="Want one like this?"
        heading="Get a design like these —"
        accent="for free."
        body="See your website design before paying anything. Love it? We'll build it together."
        ctaLabel="Get my free design"
        onCta={goContact}
      />
    </>
  )
}

export default Work
