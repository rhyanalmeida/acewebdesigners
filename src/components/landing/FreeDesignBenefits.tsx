import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import Section from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import Card from '../ui/Card'
import Reveal from '../ui/Reveal'

interface FreeDesignBenefitsProps {
  eyebrow?: string
  heading: React.ReactNode
  accent?: React.ReactNode
  benefits: string[]
  columns?: 2 | 3
}

const FreeDesignBenefits: React.FC<FreeDesignBenefitsProps> = ({
  eyebrow = 'What you get',
  heading,
  accent,
  benefits,
  columns = 2,
}) => (
  <Section tone="default" padding="lg">
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow>{eyebrow}</Eyebrow>
      <GradientHeading level={2} size="lg" className="mt-4" accent={accent}>
        {heading}
      </GradientHeading>
    </div>

    <Reveal variant="stagger" className={`mt-12 grid gap-5 ${columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {benefits.map((b, i) => (
        <div key={i} data-reveal-stagger-child style={{ transitionDelay: `${i * 60}ms` }}>
          <Card tone="default" padding="lg" rounded="xl2" interactive shine>
            <div className="flex items-start gap-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-base sm:text-lg text-surface-800 leading-relaxed">{b}</p>
            </div>
          </Card>
        </div>
      ))}
    </Reveal>
  </Section>
)

export default FreeDesignBenefits
