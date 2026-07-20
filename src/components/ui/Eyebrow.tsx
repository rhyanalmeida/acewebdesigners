import React from 'react'

type EyebrowTone = 'brand' | 'muted' | 'inverted' | 'accent' | 'forest'

interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: EyebrowTone
  /**
   * Renders the label inside a bordered tag. Default flipped to `false`
   * 2026-07-20 — it used to default `true`, which put a soft rounded-full pill
   * with an inset ring at the top of every single section on the site. That
   * shape is the clearest generated-site tell in the library.
   */
  pill?: boolean
}

/**
 * The section label. Mono, uppercase, tracked wide — this is the annotation
 * voice, and it does a lot of the technical character on its own.
 *
 * FIXED 2026-07-20: this component carried an inline
 * `style={{ fontFamily: 'ui-monospace, …' }}` which overrode Tailwind entirely,
 * so every eyebrow on the site rendered in the *system* mono (Consolas on
 * Windows, Menlo on Mac) and the IBM Plex Mono token never applied anywhere it
 * was most visible. The inline style is gone; `font-mono` now resolves properly.
 */
const toneMap: Record<EyebrowTone, string> = {
  brand:    'text-signal-600',
  accent:   'text-signal-600',
  muted:    'text-ink-700',
  inverted: 'text-cream-100/70',
  forest:   'text-forest-700',
}

const pillToneMap: Record<EyebrowTone, string> = {
  brand:    'text-signal-600 border-signal-500/40',
  accent:   'text-signal-600 border-signal-500/40',
  muted:    'text-ink-700 border-ink-900/25',
  inverted: 'text-cream-100/70 border-cream-50/25',
  forest:   'text-forest-700 border-forest-500/40',
}

const Eyebrow: React.FC<EyebrowProps> = ({
  tone = 'brand',
  pill = false,
  className = '',
  children,
  ...rest
}) => (
  <span
    className={[
      'inline-flex items-center gap-2 font-mono text-[0.7rem] sm:text-xs font-medium tracking-[0.2em] uppercase',
      pill ? `px-2.5 py-1 border ${pillToneMap[tone]}` : toneMap[tone],
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </span>
)

export default Eyebrow
