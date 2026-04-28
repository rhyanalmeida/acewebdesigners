import React from 'react'
import Eyebrow from './Eyebrow'
import GradientHeading from './GradientHeading'

interface SectionHeadingProps {
  eyebrow?: React.ReactNode
  eyebrowTone?: 'brand' | 'muted' | 'inverted' | 'accent'
  heading: React.ReactNode
  accent?: React.ReactNode
  sub?: React.ReactNode
  level?: 1 | 2 | 3
  size?: 'md' | 'lg' | 'xl' | 'display'
  tone?: 'default' | 'inverted'
  align?: 'center' | 'left'
  maxWidth?: string
  className?: string
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  eyebrowTone = 'brand',
  heading,
  accent,
  sub,
  level = 2,
  size = 'lg',
  tone = 'default',
  align = 'center',
  maxWidth = 'max-w-2xl',
  className = '',
}) => (
  <div className={`${align === 'center' ? `text-center ${maxWidth} mx-auto` : ''} ${className}`}>
    {eyebrow && <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>}
    <GradientHeading level={level} size={size} tone={tone} className="mt-4" accent={accent}>
      {heading}
    </GradientHeading>
    {sub && (
      <p className={`mt-4 ${tone === 'inverted' ? 'text-white/80' : 'text-surface-600'}`}>{sub}</p>
    )}
  </div>
)

export default SectionHeading
