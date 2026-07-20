import React from 'react'

type CardTone = 'default' | 'muted' | 'inverted' | 'brand' | 'panel'
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * A ruled box. Square corners, a real 1px border, no shadow, no blur.
 *
 * Removed 2026-07-20:
 *   - `glass` tone      → `.glass-surface`, i.e. glassmorphism. Explicitly banned.
 *   - `shine` prop      → `.premium-card-shine`, a conic sheen sweep on hover.
 *   - `rounded` prop    → everything is square now, so the choice was noise.
 *   - `shadow-glow-*`   → a coloured glow is the soft/premium register we removed.
 * None of `glass`, `shine` or a non-default `rounded` was passed by any call
 * site, so this is a prune of unused API rather than a behaviour change.
 *
 * `interactive` now shifts the card against a hard offset instead of floating
 * and blurring — the same mechanical feedback as Button.
 */
const toneMap: Record<CardTone, string> = {
  default:  'bg-cream-50 text-ink-900 border border-ink-900/15',
  muted:    'bg-cream-100 text-ink-900 border border-ink-900/12',
  panel:    'bg-cream-200 text-ink-900 border border-ink-900/12',
  inverted: 'bg-ink-900 text-cream-50 border border-cream-50/15',
  brand:    'bg-signal-500 text-white border border-signal-500',
}

const paddingMap: Record<CardPadding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
  xl:   'p-10',
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone
  padding?: CardPadding
  interactive?: boolean
  as?: keyof JSX.IntrinsicElements
}

const Card: React.FC<CardProps> = ({
  tone = 'default',
  padding = 'lg',
  interactive = false,
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}) => {
  const Component = Tag as React.ElementType
  return (
    <Component
      className={[
        toneMap[tone],
        paddingMap[padding],
        interactive
          ? 'group transition-[transform,box-shadow,border-color] duration-150 ease-out hover:border-ink-900/40 hover:shadow-[3px_3px_0_0_#111110] motion-safe:hover:-translate-x-[2px] motion-safe:hover:-translate-y-[2px]'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </Component>
  )
}

export default Card
