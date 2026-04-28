import React from 'react'

export interface LiveProofProps {
  message?: string
  tone?: 'default' | 'inverted'
  className?: string
}

/**
 * Subtle social-proof pill — "X businesses booked a free design today."
 * Pure presentation; no live polling. The number is intentionally a soft
 * claim ("recently") rather than a counter that could be wrong.
 */
const LiveProof: React.FC<LiveProofProps> = ({
  message = '3 small businesses booked a free design this week',
  tone = 'default',
  className = '',
}) => {
  const isDark = tone === 'inverted'
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium ring-1 transition-colors duration-300 ease-premium ${
        isDark
          ? 'bg-cream-50/10 text-cream-100/90 ring-cream-50/15'
          : 'bg-cream-50 text-ink-800 ring-ink-900/10'
      } ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span className="animate-pulse-rust absolute inset-0 rounded-full bg-rust-500" />
        <span className="relative h-2 w-2 rounded-full bg-rust-500" />
      </span>
      {message}
    </span>
  )
}

export default LiveProof
