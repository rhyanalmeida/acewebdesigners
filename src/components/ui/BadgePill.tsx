import React from 'react'

type BadgeTone = 'brand' | 'accent' | 'success' | 'neutral' | 'inverted' | 'danger'

interface BadgePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  icon?: React.ReactNode
  glow?: boolean
}

const toneMap: Record<BadgeTone, string> = {
  brand:    'bg-brand-50 text-brand-700 ring-brand-100',
  accent:   'bg-accent-50 text-accent-700 ring-accent-100',
  success:  'bg-emerald-50 text-emerald-700 ring-emerald-100',
  neutral:  'bg-surface-100 text-surface-700 ring-surface-200',
  inverted: 'bg-white/10 text-white ring-white/15',
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
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ring-1 ring-inset text-xs font-semibold ${toneMap[tone]} ${
      glow ? 'animate-glow-pulse' : ''
    } ${className}`}
    {...rest}
  >
    {icon && <span className="inline-flex shrink-0">{icon}</span>}
    {children}
  </span>
)

export default BadgePill
