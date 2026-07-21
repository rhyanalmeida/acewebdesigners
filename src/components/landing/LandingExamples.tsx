import React from 'react'
import { Star } from 'lucide-react'
import Section, { type SectionPadding } from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import Card from '../ui/Card'

export interface LandingExample {
  imageUrl: string
  imageAlt: string
  /** Verbatim client quote. Omit when we have no real review for this client —
   *  the card then shows the work with a plain caption instead. Never pair a
   *  quote with a business that did not say it. */
  quote?: string
  /** Who actually said `quote`. Required whenever `quote` is present. */
  authorName?: string
  /** Shown instead of a quote when there is no review for this client. */
  caption?: string
  /** Live URL, so the work can be verified rather than just claimed. */
  href?: string
  /** Overrides the link text. Defaults to 'Visit site' — set it when the target
   *  is not a website (e.g. a social account we run). */
  linkLabel?: string
  rating?: 1 | 2 | 3 | 4 | 5
}

interface LandingExamplesProps {
  eyebrow?: string
  heading: React.ReactNode
  accent?: React.ReactNode
  examples: LandingExample[]
  padding?: SectionPadding
}

const LandingExamples: React.FC<LandingExamplesProps> = ({
  eyebrow = 'Real client work',
  heading,
  accent,
  examples,
  padding = 'lg',
}) => (
  <Section tone="default" padding={padding}>
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <GradientHeading level={2} size="lg" className="mt-5" accent={accent}>
        {heading}
      </GradientHeading>
    </div>

    <div className="mt-10 grid gap-6 md:grid-cols-3">
      {examples.map((ex, i) => (
        <div key={i}>
          <Card tone="default" padding="none" interactive className="overflow-hidden h-full flex flex-col">
            <div className="relative overflow-hidden aspect-[16/10] bg-cream-100 border-b border-ink-900/10">
              <img
                src={ex.imageUrl}
                alt={ex.imageAlt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-7 flex flex-col flex-1">
              {/* Stars only accompany a real review — showing them over a caption
                  would imply a rating nobody gave. */}
              {ex.quote && (
                <div className="flex items-center gap-0.5 text-ink-900" aria-label={`${ex.rating ?? 5} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${idx < (ex.rating ?? 5) ? 'fill-current' : ''}`}
                      aria-hidden
                    />
                  ))}
                </div>
              )}

              {ex.quote ? (
                <blockquote className="mt-4 font-display text-lg text-ink-900 leading-snug flex-1">
                  <span className="text-signal-500 text-2xl leading-none mr-0.5 align-[-0.15em]">&ldquo;</span>
                  {ex.quote}
                  <span className="text-signal-500 text-2xl leading-none ml-0.5 align-[-0.15em]">&rdquo;</span>
                </blockquote>
              ) : (
                <p className="font-display text-lg text-ink-900 leading-snug flex-1">{ex.caption}</p>
              )}

              <hr className="rule-hairline mt-5 mb-4" />
              <div className="flex items-center justify-between gap-3">
                <p className="label-mono text-ink-700">{ex.authorName}</p>
                {ex.href && (
                  <a
                    href={ex.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-mono text-signal-600 underline decoration-signal-300 underline-offset-4 hover:text-signal-700"
                  >
                    {ex.linkLabel ?? 'Visit site'}
                  </a>
                )}
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  </Section>
)

export default LandingExamples
