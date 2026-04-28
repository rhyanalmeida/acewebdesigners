import React from 'react'

type CardTone = 'default' | 'muted' | 'inverted' | 'glass' | 'brand'
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone
  padding?: CardPadding
  interactive?: boolean
  shine?: boolean
  rounded?: 'md' | 'lg' | 'xl' | 'xl2' | 'xl3'
  as?: keyof JSX.IntrinsicElements
}

const toneMap: Record<CardTone, string> = {
  default:  'bg-surface-0 text-surface-900 ring-1 ring-surface-200/70 shadow-soft',
  muted:    'bg-surface-50 text-surface-900 ring-1 ring-surface-200/70',
  inverted: 'bg-surface-900 text-surface-50 ring-1 ring-white/10',
  glass:    'glass-surface text-surface-900 shadow-soft',
  brand:    'bg-brand-gradient text-white shadow-glow-brand ring-1 ring-white/10',
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
        ${interactive ? 'transition-[transform,box-shadow] duration-500 ease-premium hover:-translate-y-1 hover:shadow-lift' : ''}
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
