import React from 'react'
import { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import Section from './Section'
import Eyebrow from './Eyebrow'
import GradientHeading from './GradientHeading'
import CursorHalo from './CursorHalo'
import { editorialEase } from '../../lib/motion'

interface PageHeroProps {
  eyebrow: React.ReactNode
  eyebrowIcon?: LucideIcon
  headline: React.ReactNode
  accent?: React.ReactNode
  /** Hand-drawn underline beneath the accent (defaults to true when accent provided) */
  accentUnderline?: boolean
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
  accentUnderline = true,
  sub,
  size = 'display',
  showTopRule = true,
  className = '',
  children,
}) => {
  const reduced = useReducedMotion()
  const ease = editorialEase as unknown as number[]

  const item = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease },
        }

  return (
    <Section tone="mesh" padding="lg" className={`relative ${className}`}>
      <CursorHalo />
      <div className="relative z-10">
        {showTopRule && <hr className="rule-hairline mb-12 sm:mb-16" />}
        <div className="text-center max-w-3xl mx-auto">
          <motion.div {...item(0)}>
            <Eyebrow tone="brand">
              {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
              {eyebrow}
            </Eyebrow>
          </motion.div>
          <motion.div {...item(0.08)}>
            <GradientHeading
              level={1}
              size={size}
              className="mt-6"
              accent={accent}
              accentUnderline={accentUnderline && Boolean(accent)}
            >
              {headline}
            </GradientHeading>
          </motion.div>
          {sub && (
            <motion.p
              className="mt-6 text-lg sm:text-xl text-ink-800 leading-relaxed"
              {...item(0.18)}
            >
              {sub}
            </motion.p>
          )}
          {children && <motion.div {...item(0.28)}>{children}</motion.div>}
        </div>
      </div>
    </Section>
  )
}

export default PageHero
