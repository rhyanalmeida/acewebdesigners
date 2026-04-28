import React, { useState, useMemo } from 'react'
import { ExternalLink, Trophy, ArrowRight, Search } from 'lucide-react'

import {
  Section,
  Eyebrow,
  GradientHeading,
  Card,
  Reveal,
  BadgePill,
  TrustBar,
} from './components/ui'

interface Project {
  title: string
  category: string
  description: string
  image: string
  link?: string
  technologies?: string[]
  features?: string[]
}

const PROJECTS: Project[] = [
  {
    title: 'Hot Pot One',
    category: 'Restaurant',
    description: 'A modern, user-friendly website featuring an intuitive menu system, online ordering capabilities, and seamless mobile experience.',
    image: 'https://i.ibb.co/r2g1Q1Qp/hotpotonegif.gif',
    link: 'https://hotpotone.net/',
    technologies: ['React', 'Tailwind CSS', 'Node.js'],
    features: ['Online Ordering', 'Menu Management', 'Mobile Responsive'],
  },
  {
    title: 'Conuco Takeout',
    category: 'Restaurant',
    description: 'Authentic Dominican cuisine takeout site featuring family recipes, online ordering, and vibrant food photography.',
    image: 'https://i.ibb.co/Myx4nrSr/concuo-gif.gif',
    link: 'https://conucotakeout.com/',
    technologies: ['React', 'Tailwind CSS', 'Firebase'],
    features: ['Online Ordering', 'Menu Showcase', 'Mobile Responsive'],
  },
  {
    title: 'Dunn Construction',
    category: 'Construction',
    description: 'A professional website for a construction company showcasing services, past projects, and testimonials from satisfied clients.',
    image: 'https://i.ibb.co/S1Yv7K9/dunn-consturction-gif.gif',
    link: 'https://dunnconstruction.com/',
    technologies: ['React', 'Tailwind CSS', 'Next.js'],
    features: ['Project Gallery', 'Service Listings', 'Contact Forms'],
  },
  {
    title: "Oliver's Cafe MA",
    category: 'Restaurant',
    description: "A vibrant restaurant website featuring delicious menu items, location info, and a gallery showcasing their signature burgers.",
    image: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXI1Z2M5eHBrNWh0aDhhbTFiM2tjOTE5NTNicGxnenltdjl0dDhvNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TQYGcRBizkMZ5uZYhA/giphy.gif',
    link: 'https://oliverscafema.com/',
    technologies: ['React', 'Tailwind CSS', 'JavaScript'],
    features: ['Photo Gallery', 'Menu Showcase', 'Location Details'],
  },
  {
    title: 'Chess Teaching USA',
    category: 'Education',
    description: 'An engaging educational platform for chess instruction, featuring lesson schedules, instructor profiles, and resources.',
    image: 'https://media.giphy.com/media/vJNRdZIrbg8SLklBZO/giphy.gif',
    link: 'https://chessteachingusa.com/',
    technologies: ['React', 'Tailwind CSS', 'Node.js'],
    features: ['Online Lessons', 'Instructor Profiles', 'Resource Library'],
  },
]

function Work() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  React.useEffect(() => {
    document.title = 'Our Work | Web Design Portfolio in Leominster'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Explore our web design and development portfolio. View our latest projects and see how we help businesses in Leominster achieve their digital goals.'
      )
    }
  }, [])

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
      {/* HERO */}
      <Section tone="mesh" padding="lg">
        <div className="text-center max-w-3xl mx-auto" data-reveal="up">
          <Eyebrow tone="inverted">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            Our portfolio
          </Eyebrow>
          <GradientHeading
            level={1}
            size="display"
            tone="inverted"
            className="mt-5"
            accent="we've built"
          >
            Beautiful work
          </GradientHeading>
          <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed">
            Explore our latest projects and see how we help businesses transform their digital presence.
          </p>
        </div>
      </Section>

      {/* FILTER + SEARCH */}
      <Section tone="default" padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const active = selectedCategory === category
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ease-premium ring-focus-brand ${
                    active
                      ? 'bg-brand-gradient text-white shadow-glow-brand'
                      : 'bg-surface-100 text-surface-700 hover:bg-surface-200 ring-1 ring-surface-200'
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 h-4 w-4" aria-hidden />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-white rounded-full ring-1 ring-surface-200 hover:ring-surface-300 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all duration-300 ease-premium"
              aria-label="Search projects"
            />
          </div>
        </div>
      </Section>

      {/* PROJECTS GRID */}
      <Section tone="muted" padding="lg">
        {filtered.length === 0 ? (
          <p className="text-center text-surface-500 py-12">No projects match your search.</p>
        ) : (
          <Reveal variant="stagger" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project, i) => (
              <article
                key={project.title}
                data-reveal-stagger-child
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <Card tone="default" padding="none" rounded="xl2" interactive shine className="overflow-hidden h-full flex flex-col group">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-premium" aria-hidden />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <BadgePill tone="brand" className="self-start">{project.category}</BadgePill>
                    <h3 className="mt-3 font-display text-xl font-semibold text-surface-900">{project.title}</h3>
                    <p className="mt-2 text-surface-600 leading-relaxed flex-1">{project.description}</p>
                    {project.technologies && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 3).map(tech => (
                          <span key={tech} className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-100 text-surface-700 ring-1 ring-surface-200">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-1.5 text-brand-700 font-semibold ring-focus-brand rounded"
                      >
                        Visit website
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                    ) : (
                      <span className="mt-5 inline-flex items-center gap-1.5 text-surface-500 font-medium">
                        Coming soon
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </span>
                    )}
                  </div>
                </Card>
              </article>
            ))}
          </Reveal>
        )}
      </Section>

      {/* CTA */}
      <Section tone="mesh" padding="lg" containerSize="md">
        <Reveal variant="up" className="text-center">
          <Eyebrow tone="inverted">Want one like this?</Eyebrow>
          <GradientHeading level={2} size="lg" tone="inverted" className="mt-4">
            Get a design like these — for free.
          </GradientHeading>
          <p className="mt-5 text-white/80 max-w-xl mx-auto">
            See your website design before paying anything. Love it? We'll build it together.
          </p>
          <button
            onClick={goContact}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-surface-900 font-bold text-base sm:text-lg px-8 py-4 shadow-lift magnetic-btn ring-focus-brand"
          >
            Get my free design
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
          <div className="mt-6 flex justify-center">
            <TrustBar tone="inverted" />
          </div>
        </Reveal>
      </Section>
    </>
  )
}

export default Work
