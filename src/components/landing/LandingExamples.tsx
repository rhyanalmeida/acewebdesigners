import React from 'react'
import { Star } from 'lucide-react'
import Section from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import Card from '../ui/Card'
import Reveal from '../ui/Reveal'

export interface LandingExample {
  imageUrl: string
  imageAlt: string
  quote: string
  authorName: string
  rating?: 1 | 2 | 3 | 4 | 5
}

interface LandingExamplesProps {
  eyebrow?: string
  heading: React.ReactNode
  accent?: React.ReactNode
  examples: LandingExample[]
}

const LandingExamples: React.FC<LandingExamplesProps> = ({
  eyebrow = 'Real client work',
  heading,
  accent,
  examples,
}) => (
  <Section tone="default" padding="lg">
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow>{eyebrow}</Eyebrow>
      <GradientHeading level={2} size="lg" className="mt-5" accent={accent}>
        {heading}
      </GradientHeading>
    </div>

    <Reveal variant="stagger" className="mt-12 grid gap-6 md:grid-cols-3">
      {examples.map((ex, i) => (
        <div key={i} data-reveal-stagger-child style={{ transitionDelay: `${i * 100}ms` }}>
          <Card tone="default" padding="none" rounded="xl3" interactive shine className="overflow-hidden h-full flex flex-col">
            <div className="relative overflow-hidden aspect-[16/10] bg-cream-100">
              <img
                src={ex.imageUrl}
                alt={ex.imageAlt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
              />
            </div>
            <div className="p-7 flex flex-col flex-1">
              <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${ex.rating ?? 5} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`h-4 w-4 ${idx < (ex.rating ?? 5) ? 'fill-current' : ''}`}
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="mt-4 font-display text-lg text-ink-900 leading-snug flex-1">
                <span className="text-rust-500 text-2xl leading-none mr-0.5 align-[-0.15em] text-editorial-italic">&ldquo;</span>
                {ex.quote}
                <span className="text-rust-500 text-2xl leading-none ml-0.5 align-[-0.15em] text-editorial-italic">&rdquo;</span>
              </blockquote>
              <hr className="rule-hairline mt-5 mb-4" />
              <p className="label-mono text-ink-700">{ex.authorName}</p>
            </div>
          </Card>
        </div>
      ))}
    </Reveal>
  </Section>
)

export default LandingExamples
