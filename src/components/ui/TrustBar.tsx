import React from 'react'
import { Star, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react'

type TrustBarTone = 'default' | 'inverted' | 'muted'
type TrustBarLayout = 'row' | 'stacked'

interface TrustBarProps {
  rating?: number
  reviewsCount?: number | string
  guarantees?: string[]
  tone?: TrustBarTone
  layout?: TrustBarLayout
  className?: string
}

const defaultGuarantees = [
  'No payment until you love it',
  'Same-day launch available',
  'SSL secured & SEO ready',
]

const TrustBar: React.FC<TrustBarProps> = ({
  rating = 5,
  reviewsCount,
  guarantees = defaultGuarantees,
  tone = 'default',
  layout = 'row',
  className = '',
}) => {
  const isDark = tone === 'inverted'
  const muted = isDark ? 'text-cream-100/60' : 'text-ink-700/70'
  const text  = isDark ? 'text-cream-100/90' : 'text-ink-800'
  const star  = isDark ? 'text-amber-300' : 'text-amber-500'
  const iconColor = isDark ? 'text-rust-300' : 'text-forest-700'

  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${
        layout === 'stacked' ? 'flex-col items-start' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-0.5 ${star}`} aria-label={`${rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-current' : ''}`}
              aria-hidden
            />
          ))}
        </div>
        <span className={`text-sm font-medium ${text}`}>
          {rating.toFixed(1)}
          {reviewsCount && <span className={`ml-1 font-normal ${muted}`}>({reviewsCount})</span>}
        </span>
      </div>

      {guarantees.map((g, idx) => {
        const Icon = idx === 0 ? CheckCircle2 : idx === 1 ? Clock : ShieldCheck
        return (
          <div key={g} className="flex items-center gap-1.5">
            <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden />
            <span className={`text-sm ${text}`}>{g}</span>
          </div>
        )
      })}
    </div>
  )
}

export default TrustBar
