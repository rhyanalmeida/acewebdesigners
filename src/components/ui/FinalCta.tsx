import React from 'react'
import { ArrowRight } from 'lucide-react'
import Section from './Section'
import Eyebrow from './Eyebrow'
import GradientHeading from './GradientHeading'

/**
 * The one section on the site that is still a centred stack, on purpose. It is
 * the close, and after a page of left-aligned ruled rows a centred block reads
 * as a deliberate stop rather than the default.
 *
 * The TrustStack was removed from here 2026-07-20. It already renders in every
 * page hero, so repeating it inside every FinalCta put the same four claims in
 * front of the visitor twice per page — which is how a small true rating starts
 * to feel like an inflated one.
 */
interface FinalCtaProps {
  eyebrow?: React.ReactNode
  heading: React.ReactNode
  accent?: React.ReactNode
  body?: React.ReactNode
  ctaLabel: string
  onCta: () => void
}

const FinalCta: React.FC<FinalCtaProps> = ({
  eyebrow,
  heading,
  accent,
  body,
  ctaLabel,
  onCta,
}) => (
  <Section tone="inverted" padding="lg" containerSize="md">
    {/* No Reveal wrapper. Scroll-reveal held this at opacity-0 until an
        IntersectionObserver fired, so the closing CTA rendered as an empty black
        block in every full-page screenshot — including the ones generate-site
        produces for client previews. Nothing below the fold animates. */}
    <div className="text-center">
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
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-signal-500 hover:bg-signal-600 text-white font-semibold text-base sm:text-lg px-8 py-4 shadow-glow-signal magnetic-btn ring-focus-signal transition-colors duration-300 ease-premium"
      >
        {ctaLabel}
        <ArrowRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  </Section>
)

export default FinalCta
