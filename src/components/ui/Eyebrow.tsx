import React from 'react'

type EyebrowTone = 'brand' | 'muted' | 'inverted' | 'accent' | 'forest'

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: EyebrowTone
  pill?: boolean
}

// Editorial: rust = primary accent, forest = trust/safety accent.
// Tone names kept for backward compat; visuals warmed up.
const toneMap: Record<EyebrowTone, string> = {
  brand:    'text-rust-700 bg-rust-50 ring-rust-100',
  muted:    'text-ink-700 bg-cream-100 ring-ink-900/10',
  inverted: 'text-cream-100/85 bg-cream-50/10 ring-cream-50/15',
  accent:   'text-rust-700 bg-rust-50 ring-rust-100',
  forest:   'text-forest-700 bg-forest-50 ring-forest-100',
}

const Eyebrow: React.FC<EyebrowProps> = ({
  tone = 'brand',
  pill = true,
  className = '',
  children,
  ...rest
}) => (
  <span
    className={`inline-flex items-center gap-2 text-xs sm:text-sm font-medium tracking-[0.18em] uppercase ${
      pill
        ? `px-3 py-1.5 rounded-full ring-1 ring-inset ${toneMap[tone]}`
        : `${
            tone === 'inverted'
              ? 'text-cream-100/85'
              : tone === 'forest'
              ? 'text-forest-700'
              : tone === 'muted'
              ? 'text-ink-700'
              : 'text-rust-700'
          }`
    } ${className}`}
    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
    {...rest}
  >
    {children}
  </span>
)

export default Eyebrow
