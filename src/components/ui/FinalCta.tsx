import React from 'react'
import { ArrowRight } from 'lucide-react'
import Section from './Section'
import Eyebrow from './Eyebrow'
import GradientHeading from './GradientHeading'
import Reveal from './Reveal'
import TrustStack from './TrustStack'

interface FinalCtaProps {
  eyebrow?: React.ReactNode
  heading: React.ReactNode
  accent?: React.ReactNode
  body?: React.ReactNode
  ctaLabel: string
  onCta: () => void
  showTrustBar?: boolean
}

const FinalCta: React.FC<FinalCtaProps> = ({
  eyebrow,
  heading,
  accent,
  body,
  ctaLabel,
  onCta,
  showTrustBar = true,
}) => (
  <Section tone="inverted" padding="lg" containerSize="md">
    <Reveal variant="up" className="text-center">
      <hr className="border-cream-50/15 mb-12 max-w-xs mx-auto" />
      {eyebrow && <Eyebrow tone="inverted">{eyebrow}</Eyebrow>}
      <GradientHeading level={2} size="xl" tone="inverted" className="mt-5" accent={accent}>
        {heading}
      </GradientHeading>
      {body && (
        <p className="mt-6 text-cream-100/80 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          {body}
        </p>
      )}
      <button
        onClick={onCta}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-semibold text-base sm:text-lg px-8 py-4 shadow-glow-rust magnetic-btn ring-focus-rust transition-colors duration-300 ease-premium"
      >
        {ctaLabel}
        <ArrowRight className="h-5 w-5" aria-hidden />
      </button>
      {showTrustBar && (
        <div className="mt-10 flex justify-center">
          <TrustStack tone="inverted" />
        </div>
      )}
    </Reveal>
  </Section>
)

export default FinalCta
