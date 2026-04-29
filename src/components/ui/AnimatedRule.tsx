import React from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { editorialEase } from '../../lib/motion'

type Props = {
  className?: string
  origin?: 'left' | 'center' | 'right'
  strong?: boolean
  delay?: number
}

/**
 * Hairline divider that draws (scaleX 0→1) on scroll-into-view. Use in place
 * of decorative <hr>. Reduced-motion: renders a static rule.
 */
export default function AnimatedRule({
  className = '',
  origin = 'left',
  strong = false,
  delay = 0,
}: Props) {
  const reduced = useReducedMotion()
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })

  const baseClass = strong ? 'rule-hairline-strong' : 'rule-hairline'

  if (reduced) {
    return <div ref={ref} role="presentation" aria-hidden="true" className={`${baseClass} ${className}`} />
  }

  return (
    <div ref={ref} role="presentation" aria-hidden="true" className={className}>
      <motion.div
        className={baseClass}
        style={{ transformOrigin: origin, willChange: 'transform' }}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.7, delay, ease: editorialEase as unknown as number[] }}
      />
    </div>
  )
}
