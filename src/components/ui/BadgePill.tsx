import React from 'react'

type BadgeTone = 'brand' | 'accent' | 'success' | 'neutral' | 'inverted' | 'danger' | 'forest'

interface BadgePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  icon?: React.ReactNode
  glow?: boolean
}

const toneMap: Record<BadgeTone, string> = {
  brand:    'bg-signal-50 text-signal-700 ring-signal-100',
  accent:   'bg-signal-50 text-signal-800 ring-signal-100',
  success:  'bg-forest-50 text-forest-700 ring-forest-100',
  forest:   'bg-forest-50 text-forest-700 ring-forest-100',
  neutral:  'bg-cream-100 text-ink-800 ring-ink-900/10',
  inverted: 'bg-cream-50/10 text-cream-50 ring-cream-50/15',
  danger:   'bg-rose-50 text-rose-700 ring-rose-100',
}

const BadgePill: React.FC<BadgePillProps> = ({
  tone = 'brand',
  icon,
  glow = false,
  className = '',
  children,
  ...rest
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ring-1 ring-inset text-xs font-medium tracking-wide ${toneMap[tone]} ${
      glow ? 'animate-pulse-signal' : ''
    } ${className}`}
    {...rest}
  >
    {icon && <span className="inline-flex shrink-0">{icon}</span>}
    {children}
  </span>
)

export default BadgePill
