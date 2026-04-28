import React from 'react'

type CardTone = 'default' | 'muted' | 'inverted' | 'glass' | 'brand' | 'panel'
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone
  padding?: CardPadding
  interactive?: boolean
  shine?: boolean
  rounded?: 'md' | 'lg' | 'xl' | 'xl2' | 'xl3'
  as?: keyof JSX.IntrinsicElements
}

// Editorial card: hairline ruled instead of shadowed.
const toneMap: Record<CardTone, string> = {
  default:  'bg-cream-50 text-ink-900 ring-1 ring-ink-900/10',
  muted:    'bg-cream-100 text-ink-900 ring-1 ring-ink-900/8',
  panel:    'bg-cream-200 text-ink-900 ring-1 ring-ink-900/8',
  inverted: 'bg-ink-900 text-cream-50 ring-1 ring-cream-50/10',
  glass:    'glass-surface text-ink-900 shadow-soft',
  brand:    'bg-rust-500 text-white shadow-glow-rust ring-1 ring-rust-600/40',
}

const paddingMap: Record<CardPadding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
  xl:   'p-10',
}

const roundedMap = {
  md:   'rounded-md',
  lg:   'rounded-lg',
  xl:   'rounded-xl',
  xl2:  'rounded-xl2',
  xl3:  'rounded-xl3',
}

const Card: React.FC<CardProps> = ({
  tone = 'default',
  padding = 'lg',
  interactive = false,
  shine = false,
  rounded = 'xl2',
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}) => {
  const Component = Tag as React.ElementType
  return (
    <Component
      className={`
        ${roundedMap[rounded]}
        ${toneMap[tone]}
        ${paddingMap[padding]}
        ${interactive ? 'transition-[transform,box-shadow,border-color] duration-500 ease-premium hover:-translate-y-1 hover:shadow-lift hover:ring-ink-900/20' : ''}
        ${shine ? 'premium-card-shine' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </Component>
  )
}

export default Card
