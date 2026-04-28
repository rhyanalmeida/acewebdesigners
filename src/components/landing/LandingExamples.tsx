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
      <GradientHeading level={2} size="lg" className="mt-4" accent={accent}>
        {heading}
      </GradientHeading>
    </div>

    <Reveal variant="stagger" className="mt-12 grid gap-6 md:grid-cols-3">
      {examples.map((ex, i) => (
        <div key={i} data-reveal-stagger-child style={{ transitionDelay: `${i * 100}ms` }}>
          <Card tone="default" padding="none" rounded="xl2" interactive shine className="overflow-hidden h-full flex flex-col">
            <div className="relative overflow-hidden aspect-[16/10]">
              <img
                src={ex.imageUrl}
                alt={ex.imageAlt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-950/30 via-transparent to-transparent" aria-hidden />
            </div>
            <div className="p-6 sm:p-7 flex flex-col flex-1">
              <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${ex.rating ?? 5} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`h-4 w-4 ${idx < (ex.rating ?? 5) ? 'fill-current' : ''}`}
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="mt-4 text-surface-800 leading-relaxed flex-1">
                &ldquo;{ex.quote}&rdquo;
              </blockquote>
              <p className="mt-5 font-semibold text-surface-900">{ex.authorName}</p>
            </div>
          </Card>
        </div>
      ))}
    </Reveal>
  </Section>
)

export default LandingExamples
