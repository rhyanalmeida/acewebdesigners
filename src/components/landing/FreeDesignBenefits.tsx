import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import Section from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import Card from '../ui/Card'

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
  <Section tone="muted" padding="lg">
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow tone="forest">{eyebrow}</Eyebrow>
      <GradientHeading level={2} size="lg" className="mt-5" accent={accent}>
        {heading}
      </GradientHeading>
    </div>

    <div className={`mt-12 grid gap-5 ${columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {benefits.map((b, i) => (
        <Card key={i} tone="default" padding="lg" interactive className="h-full">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-forest-500/40 text-forest-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-base sm:text-lg text-ink-800 leading-relaxed">{b}</p>
          </div>
        </Card>
      ))}
    </div>
  </Section>
)

export default FreeDesignBenefits
