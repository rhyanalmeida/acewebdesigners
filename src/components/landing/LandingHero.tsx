import React from 'react'
import { Star, ArrowRight, Sparkles } from 'lucide-react'
import Container from '../ui/Container'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import BadgePill from '../ui/BadgePill'
import PhoneCta from '../ui/PhoneCta'

interface LandingHeroProps {
  eyebrow?: string
  headline: React.ReactNode
  accent?: React.ReactNode
  sub: React.ReactNode
  urgencyText?: string
  ctaLabel: string
  onCta: () => void
  videoSrc?: string
  videoTitle?: string
  rating?: number
  ratingLabel?: string
}

const LandingHero: React.FC<LandingHeroProps> = ({
  eyebrow = 'Free design — pay only if you love it',
  headline,
  accent,
  sub,
  urgencyText,
  ctaLabel,
  onCta,
  videoSrc,
  videoTitle = 'Hero video',
  rating = 5,
  ratingLabel = 'Rated 5.0 / 5 on Google',
}) => (
  <section className="relative isolate overflow-hidden bg-cream-50 text-ink-900 bg-paper-noise">
    <Container size="lg" className="relative z-10 py-20 sm:py-24 lg:py-28">
      <hr className="rule-hairline mb-12 sm:mb-14" />
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div data-reveal="up" className="text-center lg:text-left">
          <Eyebrow tone="brand">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {eyebrow}
          </Eyebrow>

          <GradientHeading
            level={1}
            size="display"
            className="mt-6"
            accent={accent}
          >
            {headline}
          </GradientHeading>

          <p className="mt-6 text-lg sm:text-xl text-ink-700 leading-relaxed max-w-xl mx-auto lg:mx-0">
            {sub}
          </p>

          {urgencyText && (
            <div className="mt-6 inline-flex">
              <BadgePill tone="brand" glow>
                {urgencyText}
              </BadgePill>
            </div>
          )}

          <div className="mt-9 flex flex-col sm:flex-row gap-3 items-center sm:items-start lg:items-start justify-center lg:justify-start">
            <button
              onClick={onCta}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-semibold text-base sm:text-lg px-8 py-4 shadow-glow-rust magnetic-btn ring-focus-rust transition-colors duration-300"
            >
              {ctaLabel}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center lg:justify-start gap-3 text-sm text-ink-700">
            <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-current' : ''}`}
                  aria-hidden
                />
              ))}
            </div>
            <span className="font-medium text-ink-800">{ratingLabel}</span>
          </div>

          <hr className="rule-hairline my-8 max-w-sm lg:mx-0 mx-auto" />
          <div className="flex justify-center lg:justify-start">
            <PhoneCta showLabels={false} />
          </div>
        </div>

        {videoSrc && (
          <div data-reveal="right" className="relative">
            <div className="absolute -inset-3 bg-rust-100/60 rounded-xl3 -z-10" aria-hidden />
            <div className="relative rounded-xl3 overflow-hidden ring-1 ring-ink-900/10 shadow-lift bg-cream-100">
              <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                <iframe
                  src={videoSrc}
                  loading="lazy"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                  referrerPolicy="strict-origin-when-cross-origin"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  title={videoTitle}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
    <hr className="rule-hairline" />
  </section>
)

export default LandingHero
