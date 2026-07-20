import React from 'react'

type Level = 1 | 2 | 3 | 4
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'display'
type Tone = 'default' | 'inverted'

interface GradientHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: Level
  size?: Size
  tone?: Tone
  /** Emphasised phrase, rendered in the accent red. */
  accent?: React.ReactNode
  accentPlacement?: 'inline' | 'after' | 'before'
}

/**
 * Every headline on the site renders through here — 18 files. This is the one
 * place the display face is decided, which is why the typeface change is a
 * single-file edit.
 *
 * The name is now a lie twice over: there is no gradient (removed with the
 * indigo ramp) and no longer a serif. It is kept anyway — renaming costs 18
 * files of churn for zero visual gain, and a rename is what buried the last
 * palette change in noise. The name is a bad label on a good chokepoint.
 *
 * 2026-07-20: Fraunces → Archivo. A serif display face over a warm ground is
 * the documented AI-web-design signature. Weight and WIDTH now carry what the
 * serif used to — `font-variation-settings: 'wdth'` expands as the size steps
 * up, so display headlines read as signage rather than as an article.
 *
 * `accentUnderline` and its HandUnderline squiggle were deleted: no call site
 * ever passed the prop, so it was dead code reachable only through an unused
 * API. Emphasis is colour alone.
 */

const sizeMap: Record<Size, string> = {
  sm:      'text-xl sm:text-2xl',
  md:      'text-2xl sm:text-3xl',
  lg:      'text-3xl sm:text-4xl lg:text-5xl',
  xl:      'text-4xl sm:text-5xl lg:text-6xl',
  display: 'text-[2.75rem] sm:text-6xl lg:text-7xl',
}

/** Wider as it gets bigger. Small headings stay near-normal so body text next
 *  to them does not look squeezed. */
const widthMap: Record<Size, number> = {
  sm: 100,
  md: 104,
  lg: 108,
  xl: 112,
  display: 118,
}

const toneMap: Record<Tone, string> = {
  default:  'text-ink-900',
  inverted: 'text-cream-50',
}

const accentToneMap: Record<Tone, string> = {
  default: 'text-signal-500',
  // signal-300 (#E58787) on near-black reads as washed-out pink, not as the
  // brand red — it loses the accent entirely. signal-400 holds its chroma
  // against #111110 while still clearing contrast for large text.
  inverted: 'text-signal-400',
}

const GradientHeading: React.FC<GradientHeadingProps> = ({
  level = 2,
  size = 'lg',
  tone = 'default',
  accent,
  accentPlacement = 'inline',
  className = '',
  style,
  children,
  ...rest
}) => {
  const Tag = `h${level}` as React.ElementType

  const accentEl = accent ? (
    <span className={accentToneMap[tone]}>{accent}</span>
  ) : null

  return (
    <Tag
      className={`font-display font-extrabold tracking-[-0.03em] leading-[1.02] ${sizeMap[size]} ${toneMap[tone]} ${className}`}
      style={{ fontVariationSettings: `'wdth' ${widthMap[size]}`, ...style }}
      {...rest}
    >
      {accentPlacement === 'before' && accentEl ? <>{accentEl} </> : null}
      {children}
      {(accentPlacement === 'after' || accentPlacement === 'inline') && accentEl ? (
        <> {accentEl}</>
      ) : null}
    </Tag>
  )
}

export default GradientHeading
