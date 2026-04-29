import React from 'react'
import HandUnderline from './HandUnderline'

type Level = 1 | 2 | 3 | 4
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'display'
type Tone = 'default' | 'inverted'

interface GradientHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: Level
  size?: Size
  tone?: Tone
  /** Italic accent phrase — rendered as Fraunces italic in rust */
  accent?: React.ReactNode
  accentPlacement?: 'inline' | 'after' | 'before'
  /** Draws a hand-drawn underline beneath the accent on scroll-into-view */
  accentUnderline?: boolean
}

const sizeMap: Record<Size, string> = {
  sm:      'text-2xl sm:text-3xl',
  md:      'text-3xl sm:text-4xl',
  lg:      'text-4xl sm:text-5xl lg:text-6xl',
  xl:      'text-5xl sm:text-6xl lg:text-7xl',
  display: 'text-5xl sm:text-7xl lg:text-[5.5rem] leading-[1.05]',
}

const toneMap: Record<Tone, string> = {
  default:  'text-ink-900',
  inverted: 'text-cream-50',
}

const accentToneMap: Record<Tone, string> = {
  default:  'text-rust-600',
  inverted: 'text-rust-300',
}

/**
 * GradientHeading — editorial: serif Fraunces, italic accent in rust.
 * Component name preserved for backward compat; behavior shifted from
 * gradient text to italic editorial accent.
 */
const GradientHeading: React.FC<GradientHeadingProps> = ({
  level = 2,
  size = 'lg',
  tone = 'default',
  accent,
  accentPlacement = 'inline',
  accentUnderline = false,
  className = '',
  children,
  ...rest
}) => {
  const Tag = (`h${level}`) as React.ElementType
  const accentEl = accent ? (
    <span className={`relative inline-block text-editorial-italic ${accentToneMap[tone]}`}>
      {accent}
      {accentUnderline && (
        <span className="absolute -bottom-1 left-0 right-0 h-2 pointer-events-none" aria-hidden="true">
          <HandUnderline color={tone === 'inverted' ? '#E68A5C' : '#C04E1A'} />
        </span>
      )}
    </span>
  ) : null

  return (
    <Tag
      className={`font-display font-semibold tracking-tight ${sizeMap[size]} ${toneMap[tone]} ${className}`}
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
