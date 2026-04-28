import React from 'react'
import { Star, ArrowRight, Sparkles } from 'lucide-react'
import Container from '../ui/Container'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import BadgePill from '../ui/BadgePill'

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
  <section className="relative isolate overflow-hidden bg-surface-950 text-white">
    <div className="absolute inset-0 bg-mesh-2 opacity-90" aria-hidden />
    <div
      className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl animate-float-soft"
      aria-hidden
    />
    <div
      className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl animate-float-soft"
      style={{ animationDelay: '2s' }}
      aria-hidden
    />

    <Container size="lg" className="relative z-10 py-20 sm:py-28 lg:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div data-reveal="up" className="text-center lg:text-left">
          <Eyebrow tone="inverted" className="animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {eyebrow}
          </Eyebrow>

          <GradientHeading
            level={1}
            size="display"
            tone="inverted"
            className="mt-5"
            accent={accent}
          >
            {headline}
          </GradientHeading>

          <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
            {sub}
          </p>

          {urgencyText && (
            <div className="mt-6 inline-flex">
              <BadgePill tone="accent" glow>
                {urgencyText}
              </BadgePill>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center sm:items-start lg:items-start justify-center lg:justify-start">
            <button
              onClick={onCta}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient text-white font-bold text-base sm:text-lg px-8 py-4 shadow-glow-brand magnetic-btn ring-focus-brand"
            >
              {ctaLabel}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center lg:justify-start gap-3 text-sm text-white/80">
            <div className="flex items-center gap-0.5 text-amber-300" aria-label={`${rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-current' : ''}`}
                  aria-hidden
                />
              ))}
            </div>
            <span className="font-medium">{ratingLabel}</span>
          </div>
        </div>

        {videoSrc && (
          <div data-reveal="right" className="relative">
            <div className="relative rounded-xl3 overflow-hidden ring-1 ring-white/15 shadow-glow-brand">
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
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-brand-gradient blur-2xl opacity-60" aria-hidden />
          </div>
        )}
      </div>
    </Container>

    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
  </section>
)

export default LandingHero
