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
  default:  'text-signal-600',
  inverted: 'text-signal-300',
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
  // The accent used to be italic serif in the accent colour. Italicised serif
  // emphasis on a warm ground is one of the most-cited "AI-generated" tells, so the
  // emphasis is now carried by colour alone — same hierarchy, none of the signature.
  // See docs/REDESIGN_PLAN_2026-07-20.md §0.
  const accentEl = accent ? (
    <span className={`relative inline-block ${accentToneMap[tone]}`}>
      {accent}
      {accentUnderline && (
        <span className="absolute -bottom-1 left-0 right-0 h-2 pointer-events-none" aria-hidden="true">
          <HandUnderline color={tone === 'inverted' ? '#E58787' : '#A00909'} />
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
