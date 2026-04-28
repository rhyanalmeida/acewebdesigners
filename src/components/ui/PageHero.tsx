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
  className = '',
  children,
}) => (
  <Section tone="mesh" padding="lg" className={className}>
    <div className="text-center max-w-3xl mx-auto" data-reveal="up">
      <Eyebrow tone="inverted">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
        {eyebrow}
      </Eyebrow>
      <GradientHeading level={1} size={size} tone="inverted" className="mt-5" accent={accent}>
        {headline}
      </GradientHeading>
      {sub && (
        <p className="mt-6 text-lg sm:text-xl text-white/80 leading-relaxed">{sub}</p>
      )}
      {children}
    </div>
  </Section>
)

export default PageHero
