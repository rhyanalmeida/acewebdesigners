import React from 'react'
import { Star } from 'lucide-react'

export interface TestimonialEditorialProps {
  quote: string
  authorName: string
  business?: string
  city?: string
  avatar?: string
  /** Optional result/metric tag, e.g. "40% more orders" */
  result?: string
  /** Number of stars to render (default 5) */
  stars?: number
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
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold ${
        isDark
          ? 'bg-cream-50 text-ink-900'
          : 'bg-ink-900 text-cream-50'
      }`}
      aria-hidden
    >
      {initials || '★'}
    </span>
  )
}

const TestimonialEditorial: React.FC<TestimonialEditorialProps> = ({
  quote,
  authorName,
  business,
  city,
  avatar,
  result,
  stars = 5,
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
      className={`relative flex flex-col rounded-xl3 p-7 sm:p-9 transition-all duration-500 ease-premium ${
        isDark
          ? 'bg-ink-900 text-cream-50 ring-1 ring-cream-50/10'
          : 'bg-cream-50 text-ink-900 ring-1 ring-ink-900/10 hover:ring-ink-900/20'
      } ${className}`}
    >
      {result && (
        <span className={`inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase mb-5 ${
          isDark ? 'bg-rust-500/20 text-rust-200' : 'bg-rust-50 text-rust-700'
        }`}>
          {result}
        </span>
      )}

      <div className="flex items-center gap-1 mb-4 text-amber-500" aria-label={`${stars} out of 5 stars`}>
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
        ))}
      </div>

      <blockquote className={quoteSize}>
        <span className={`text-rust-500 ${isFeature ? 'text-5xl' : 'text-3xl'} leading-none mr-1 align-[-0.2em] text-editorial-italic`}>
          &ldquo;
        </span>
        {quote}
        <span className={`text-rust-500 ${isFeature ? 'text-5xl' : 'text-3xl'} leading-none ml-0.5 align-[-0.2em] text-editorial-italic`}>
          &rdquo;
        </span>
      </blockquote>

      <hr className={`my-6 ${isDark ? 'border-cream-50/15' : 'rule-hairline'}`} />

      <figcaption className="flex items-center gap-4">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-ink-900/10"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Monogram name={authorName} tone={tone} />
        )}
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
