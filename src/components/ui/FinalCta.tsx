import React from 'react'
import { ArrowRight } from 'lucide-react'
import Section from './Section'
import Eyebrow from './Eyebrow'
import GradientHeading from './GradientHeading'
import Button from './Button'

/**
 * The closing block on 5 of the 6 public pages.
 *
 * It is the one section on the site that is still a centred stack, on purpose.
 * After a page of left-aligned ruled rows a centred block reads as a deliberate
 * stop rather than as the default.
 *
 * The TrustStack was removed from here 2026-07-20: it already renders in every
 * page hero, so repeating it inside every FinalCta put the same four claims in
 * front of the visitor twice per page, which is how a small true rating starts
 * to feel like an inflated one.
 *
 * No Reveal wrapper either. Scroll-reveal held this at opacity-0 until an
 * IntersectionObserver fired, so the closing CTA rendered as an empty black
 * block in every full-page screenshot — including the ones generate-site
 * produces for client previews. Nothing below the fold animates.
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
    <div className="text-center">
      <hr className="border-0 h-px bg-cream-50/20 mb-12 max-w-[8rem] mx-auto" />
      {eyebrow && <Eyebrow tone="inverted">{eyebrow}</Eyebrow>}
      <GradientHeading level={2} size="xl" tone="inverted" className="mt-6" accent={accent}>
        {heading}
      </GradientHeading>
      {body && (
        <p className="mt-6 text-cream-100/75 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          {body}
        </p>
      )}
      <div className="mt-10">
        <Button variant="primary" size="lg" tone="inverted" onClick={onCta}>
          {ctaLabel}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Button>
      </div>
    </div>
  </Section>
)

export default FinalCta
