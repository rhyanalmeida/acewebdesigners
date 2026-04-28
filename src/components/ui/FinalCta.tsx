import React from 'react'
import { ArrowRight } from 'lucide-react'
import Section from './Section'
import Eyebrow from './Eyebrow'
import GradientHeading from './GradientHeading'
import Reveal from './Reveal'
import TrustBar from './TrustBar'

interface FinalCtaProps {
  eyebrow?: React.ReactNode
  heading: React.ReactNode
  body?: React.ReactNode
  ctaLabel: string
  onCta: () => void
  showTrustBar?: boolean
}

const FinalCta: React.FC<FinalCtaProps> = ({
  eyebrow,
  heading,
  body,
  ctaLabel,
  onCta,
  showTrustBar = true,
}) => (
  <Section tone="mesh" padding="lg" containerSize="md">
    <Reveal variant="up" className="text-center">
      {eyebrow && <Eyebrow tone="inverted">{eyebrow}</Eyebrow>}
      <GradientHeading level={2} size="lg" tone="inverted" className="mt-4">
        {heading}
      </GradientHeading>
      {body && <p className="mt-5 text-white/80 max-w-xl mx-auto">{body}</p>}
      <button
        onClick={onCta}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-surface-900 font-bold text-base sm:text-lg px-8 py-4 shadow-lift magnetic-btn ring-focus-brand"
      >
        {ctaLabel}
        <ArrowRight className="h-5 w-5" aria-hidden />
      </button>
      {showTrustBar && (
        <div className="mt-6 flex justify-center">
          <TrustBar tone="inverted" />
        </div>
      )}
    </Reveal>
  </Section>
)

export default FinalCta
