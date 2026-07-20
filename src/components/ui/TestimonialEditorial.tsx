import React from 'react'

/**
 * Verbatim-review card.
 *
 * Deliberately has NO `result`/`metric` prop and NO `avatar` prop. Both existed
 * before 2026-07-20 and both held fabrications: `result` carried invented
 * numbers ("40% more orders", "3× qualified leads") and `avatar` carried stock
 * Unsplash headshots of people who were not our clients. They were removed in
 * ec71609; the props survived and were an open invitation to put them back.
 *
 * Quotes are VERBATIM Google reviews. Do not tidy the grammar — the imperfection
 * is the proof of authenticity, and polished testimonials are what read as fake.
 * Nothing here may be attributed to anyone who did not say it.
 *
 * The star row was removed too: it rendered in stock `amber-500` (off-palette)
 * on every card, which amplified a small real rating into implied volume. The
 * rating is now stated once per page, next to a link to the Google profile.
 */
export interface TestimonialEditorialProps {
  quote: string
  authorName: string
  business?: string
  city?: string
  /** Layout variant — `compact` for grids, `feature` for hero/billboard */
  variant?: 'compact' | 'feature'
  tone?: 'default' | 'inverted'
  className?: string
}

const Monogram: React.FC<{ name: string; tone: 'default' | 'inverted' }> = ({
  name,
  tone,
}) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('')
  const isDark = tone === 'inverted'
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center font-mono text-sm font-medium ${
        isDark ? 'bg-cream-50 text-ink-900' : 'bg-ink-900 text-cream-50'
      }`}
      aria-hidden
    >
      {initials}
    </span>
  )
}

const TestimonialEditorial: React.FC<TestimonialEditorialProps> = ({
  quote,
  authorName,
  business,
  city,
  variant = 'compact',
  tone = 'default',
  className = '',
}) => {
  const isDark = tone === 'inverted'
  const isFeature = variant === 'feature'

  const quoteSize = isFeature
    ? 'font-display text-2xl sm:text-3xl lg:text-4xl leading-snug'
    : 'font-display text-lg sm:text-xl leading-snug'

  return (
    <figure
      className={`relative flex flex-col p-7 sm:p-9 ${
        isDark
          ? 'bg-ink-900 text-cream-50 border border-cream-50/15'
          : 'bg-cream-50 text-ink-900 border border-ink-900/15'
      } ${className}`}
    >
      <blockquote className={quoteSize}>
        <span
          className={`text-signal-500 ${isFeature ? 'text-5xl' : 'text-3xl'} leading-none mr-1 align-[-0.2em]`}
        >
          &ldquo;
        </span>
        {quote}
        <span
          className={`text-signal-500 ${isFeature ? 'text-5xl' : 'text-3xl'} leading-none ml-0.5 align-[-0.2em]`}
        >
          &rdquo;
        </span>
      </blockquote>

      <hr className={`my-6 ${isDark ? 'border-cream-50/15' : 'rule-hairline'}`} />

      <figcaption className="flex items-center gap-4">
        <Monogram name={authorName} tone={tone} />
        <span className="flex flex-col leading-tight">
          <span className={`label-mono ${isDark ? 'text-cream-100/60' : 'text-ink-700/70'}`}>
            {authorName}
          </span>
          {(business || city) && (
            <span className={`mt-0.5 text-sm ${isDark ? 'text-cream-100/85' : 'text-ink-800'}`}>
              {business}
              {business && city && ' · '}
              {city}
            </span>
          )}
        </span>
      </figcaption>
    </figure>
  )
}

export default TestimonialEditorial
