import React from 'react'

type EyebrowTone = 'brand' | 'muted' | 'inverted' | 'accent'

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: EyebrowTone
  pill?: boolean
}

const toneMap: Record<EyebrowTone, string> = {
  brand:    'text-brand-700 bg-brand-50 ring-brand-100',
  muted:    'text-surface-600 bg-surface-100 ring-surface-200',
  inverted: 'text-white/80 bg-white/10 ring-white/15',
  accent:   'text-accent-700 bg-accent-50 ring-accent-100',
}

const Eyebrow: React.FC<EyebrowProps> = ({
  tone = 'brand',
  pill = true,
  className = '',
  children,
  ...rest
}) => (
  <span
    className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-[0.18em] uppercase ${
      pill
        ? `px-3 py-1.5 rounded-full ring-1 ring-inset ${toneMap[tone]}`
        : `${tone === 'inverted' ? 'text-white/80' : tone === 'accent' ? 'text-accent-600' : tone === 'muted' ? 'text-surface-500' : 'text-brand-600'}`
    } ${className}`}
    {...rest}
  >
    {children}
  </span>
)

export default Eyebrow
