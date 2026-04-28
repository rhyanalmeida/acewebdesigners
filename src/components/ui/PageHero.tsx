import React from 'react'
import { LucideIcon } from 'lucide-react'
import Section from './Section'
import Eyebrow from './Eyebrow'
import GradientHeading from './GradientHeading'

interface PageHeroProps {
  eyebrow: React.ReactNode
  eyebrowIcon?: LucideIcon
  headline: React.ReactNode
  accent?: React.ReactNode
  sub?: React.ReactNode
  size?: 'md' | 'lg' | 'xl' | 'display'
  /** Optional thin top rule — adds editorial frame */
  showTopRule?: boolean
  className?: string
  children?: React.ReactNode
}

const PageHero: React.FC<PageHeroProps> = ({
  eyebrow,
  eyebrowIcon: Icon,
  headline,
  accent,
  sub,
  size = 'display',
  showTopRule = true,
  className = '',
  children,
}) => (
  <Section tone="mesh" padding="lg" className={className}>
    {showTopRule && <hr className="rule-hairline mb-12 sm:mb-16" />}
    <div className="text-center max-w-3xl mx-auto" data-reveal="up">
      <Eyebrow tone="brand">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
        {eyebrow}
      </Eyebrow>
      <GradientHeading level={1} size={size} className="mt-6" accent={accent}>
        {headline}
      </GradientHeading>
      {sub && (
        <p className="mt-6 text-lg sm:text-xl text-ink-700 leading-relaxed">{sub}</p>
      )}
      {children}
    </div>
  </Section>
)

export default PageHero
