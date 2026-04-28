import React from 'react'

type Level = 1 | 2 | 3 | 4
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'display'
type Tone = 'default' | 'inverted'

interface GradientHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: Level
  size?: Size
  tone?: Tone
  accent?: React.ReactNode
  accentPlacement?: 'inline' | 'after' | 'before'
}

const sizeMap: Record<Size, string> = {
  sm:      'text-2xl sm:text-3xl',
  md:      'text-3xl sm:text-4xl',
  lg:      'text-4xl sm:text-5xl lg:text-6xl',
  xl:      'text-5xl sm:text-6xl lg:text-7xl',
  display: 'text-5xl sm:text-7xl lg:text-[5.5rem] leading-[1.05]',
}

const toneMap: Record<Tone, string> = {
  default:  'text-surface-900',
  inverted: 'text-white',
}

const GradientHeading: React.FC<GradientHeadingProps> = ({
  level = 2,
  size = 'lg',
  tone = 'default',
  accent,
  accentPlacement = 'inline',
  className = '',
  children,
  ...rest
}) => {
  const Tag = (`h${level}`) as React.ElementType
  const accentEl = accent ? (
    <span className="text-gradient-brand-animated">{accent}</span>
  ) : null

  return (
    <Tag
      className={`font-display font-bold tracking-tight ${sizeMap[size]} ${toneMap[tone]} ${className}`}
      {...rest}
    >
      {accentPlacement === 'before' && accentEl ? <>{accentEl} </> : null}
      {children}
      {accentPlacement === 'after' && accentEl ? <> {accentEl}</> : null}
      {accentPlacement === 'inline' && accentEl ? <> {accentEl}</> : null}
    </Tag>
  )
}

export default GradientHeading
