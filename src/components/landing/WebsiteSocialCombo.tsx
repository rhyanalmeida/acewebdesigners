import React from 'react'
import { Instagram, Globe, ArrowRight, Sparkles, MapPin, Users } from 'lucide-react'
import Section from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import BadgePill from '../ui/BadgePill'
import Magnetic from '../ui/Magnetic'

interface WebsiteSocialComboProps {
  /** Image URL for the website screenshot panel (right side on desktop). */
  websiteImage: string
  websiteAlt: string
  /** Image URL for the social-feed mock (left side on desktop). */
  socialImage: string
  socialAlt: string
  /** CTA click → scrolls to booking. */
  onCta: () => void
  ctaLabel?: string
}

const COMBO_BENEFITS = [
  {
    Icon: Sparkles,
    title: 'Posts that show real work',
    desc: 'Job-site photos and reels — no stock images, no AI fluff.',
  },
  {
    Icon: MapPin,
    title: 'Found by neighbors',
    desc: 'Google Business Profile and local SEO so the right homes find you.',
  },
  {
    Icon: Users,
    title: 'One team, no hand-offs',
    desc: 'Same people who built your site run your social. Calls land where they convert.',
  },
]

const WebsiteSocialCombo: React.FC<WebsiteSocialComboProps> = ({
  websiteImage,
  websiteAlt,
  socialImage,
  socialAlt,
  onCta,
  ctaLabel = 'Book a call to set up the combo',
}) => (
  <Section tone="inverted" padding="lg">
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow tone="inverted">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Website + Social Media
      </Eyebrow>
      <GradientHeading
        level={2}
        size="lg"
        className="mt-5"
        accent="that work together"
        accentUnderline
      >
        Two channels,
      </GradientHeading>
      <p className="mt-5 text-base sm:text-lg text-cream-100/85 leading-relaxed">
        Your website turns clicks into booked jobs. Your social keeps you top-of-mind for the next
        one. We handle both so neither falls behind.
      </p>
    </div>

    <div className="mt-14 grid items-center gap-10 lg:grid-cols-[0.85fr_1fr] max-w-6xl mx-auto">
      {/* Phone mock — social feed */}
      <div className="relative mx-auto w-full max-w-[280px] sm:max-w-xs">
        <div
          aria-hidden
          className="absolute -inset-4 bg-rust-500/10 rounded-[2.5rem] blur-2xl -z-10"
        />
        <div className="relative rounded-[2.25rem] bg-ink-800 p-2 ring-1 ring-cream-50/15 shadow-lift">
          <div className="rounded-[1.85rem] overflow-hidden bg-cream-50 aspect-[9/19]">
            <img
              src={socialImage}
              alt={socialAlt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-rust-500 text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1 shadow-glow-rust">
          <Instagram className="h-3 w-3" aria-hidden />
          Social
        </div>
      </div>

      {/* Connector + Website mock */}
      <div className="relative">
        <div
          aria-hidden
          className="hidden lg:block absolute -left-10 top-1/2 -translate-y-1/2 text-rust-300"
        >
          <ArrowRight className="h-7 w-7" />
        </div>
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 bg-cream-50/5 rounded-xl3 blur-xl -z-10"
          />
          <div className="relative rounded-xl3 bg-ink-800 p-3 ring-1 ring-cream-50/15 shadow-lift">
            <div className="flex items-center gap-1.5 px-2 pb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rust-400/70" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-forest-400/70" aria-hidden />
            </div>
            <div className="rounded-xl2 overflow-hidden bg-cream-50 aspect-[16/10]">
              <img
                src={websiteImage}
                alt={websiteAlt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-cream-50 text-ink-900 text-[11px] font-semibold uppercase tracking-wide px-3 py-1 shadow-soft ring-1 ring-ink-900/10">
            <Globe className="h-3 w-3" aria-hidden />
            Website
          </div>
        </div>
      </div>
    </div>

    {/* Benefits row */}
    <div className="mt-14 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
      {COMBO_BENEFITS.map(({ Icon, title, desc }) => (
        <div
          key={title}
          className="rounded-xl2 bg-ink-800/60 ring-1 ring-cream-50/10 p-5 sm:p-6 backdrop-blur-sm"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rust-500/15 text-rust-300 ring-1 ring-rust-300/30">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold text-cream-50">{title}</h3>
          <p className="mt-2 text-sm text-cream-100/80 leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>

    {/* Bundle pitch + CTA */}
    <div className="mt-12 flex flex-col items-center gap-5 max-w-2xl mx-auto text-center">
      <BadgePill tone="brand" glow>
        Most contractors take the combo
      </BadgePill>
      <p className="text-cream-100/85 leading-relaxed">
        Website + Standard social runs <span className="text-cream-50 font-semibold">$30/wk</span>{' '}
        on top of your site. First week of posts free — same risk reversal as the design.
      </p>
      <Magnetic strength={6}>
        <button
          onClick={onCta}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-semibold text-base px-7 py-3.5 shadow-glow-rust magnetic-btn ring-focus-rust transition-colors duration-300"
        >
          {ctaLabel}
          <ArrowRight className="h-5 w-5 icon-nudge" aria-hidden />
        </button>
      </Magnetic>
      <p className="text-xs text-cream-100/60">
        No card on file. Discuss the combo on the call — buy only if you love it.
      </p>
    </div>
  </Section>
)

export default WebsiteSocialCombo
