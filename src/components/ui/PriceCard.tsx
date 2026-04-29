import React from 'react'
import { Check } from 'lucide-react'

export interface PriceCardProps {
  tier: string
  price: string
  /** Optional small line under the big price, e.g. "+ $15/month hosting" */
  priceSub?: string
  description?: string
  features: string[]
  highlight?: boolean
  ctaLabel?: string
  onCta?: () => void
  href?: string
  footnote?: string
  className?: string
}

const PriceCard: React.FC<PriceCardProps> = ({
  tier,
  price,
  priceSub,
  description,
  features,
  highlight = false,
  ctaLabel = 'Get this package',
  onCta,
  href,
  footnote,
  className = '',
}) => {
  const Tag = (href ? 'a' : 'button') as React.ElementType
  const tagProps = href
    ? { href }
    : { type: 'button' as const, onClick: onCta }

  return (
    <div
      className={`relative flex flex-col rounded-xl3 p-8 sm:p-10 transition-shadow duration-500 ease-premium ${
        highlight
          ? 'bg-ink-900 text-cream-50 shadow-lift ring-1 ring-ink-900'
          : 'bg-cream-50 text-ink-900 ring-1 ring-ink-900/10 hover:ring-ink-900/20'
      } ${className}`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-rust-500 text-white px-3 py-1 text-xs font-semibold tracking-wide uppercase shadow-glow-rust">
          Most popular
        </span>
      )}

      <div className={highlight ? 'text-cream-100/70' : 'text-ink-700'}>
        <span className="label-mono">{tier}</span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`font-display text-6xl sm:text-7xl font-semibold tracking-tight ${highlight ? 'text-cream-50' : 'text-ink-900'}`}>
          {price}
        </span>
      </div>

      {priceSub && (
        <p className={`mt-1.5 text-sm ${highlight ? 'text-cream-100/70' : 'text-ink-700/75'}`}>
          {priceSub}
        </p>
      )}

      {description && (
        <p className={`mt-3 text-base leading-relaxed ${highlight ? 'text-cream-100/80' : 'text-ink-700'}`}>
          {description}
        </p>
      )}

      <hr className={`mt-6 mb-6 ${highlight ? 'border-cream-50/20' : 'rule-hairline'}`} />

      <ul className="space-y-3 flex-1">
        {features.map((feat, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check
              className={`h-5 w-5 mt-0.5 shrink-0 ${highlight ? 'text-rust-300' : 'text-rust-600'}`}
              aria-hidden
            />
            <span className={`text-sm sm:text-base ${highlight ? 'text-cream-100/90' : 'text-ink-800'}`}>
              {feat}
            </span>
          </li>
        ))}
      </ul>

      <Tag
        {...tagProps}
        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all duration-300 ease-premium magnetic-btn ring-focus-rust ${
          highlight
            ? 'bg-rust-500 text-white hover:bg-rust-600 shadow-glow-rust'
            : 'bg-ink-900 text-cream-50 hover:bg-ink-800'
        }`}
      >
        {ctaLabel}
      </Tag>

      {footnote && (
        <p className={`mt-4 text-center text-xs ${highlight ? 'text-cream-100/60' : 'text-ink-700/70'}`}>
          {footnote}
        </p>
      )}
    </div>
  )
}

export default PriceCard
