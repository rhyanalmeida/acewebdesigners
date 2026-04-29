import React from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

type Props = {
  className?: string
  color?: string
  strokeWidth?: number
  delay?: number
}

/**
 * Decorative hand-drawn underline SVG. Self-draws via pathLength on inView.
 * aria-hidden: it never carries text content.
 */
export default function HandUnderline({
  className = '',
  color = '#C04E1A',
  strokeWidth = 3,
  delay = 0.15,
}: Props) {
  const reduced = useReducedMotion()
  const ref = React.useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 220 14"
      preserveAspectRatio="none"
      className={`pointer-events-none ${className}`}
      style={{ width: '100%', height: '0.55em', display: 'block' }}
    >
      <motion.path
        d="M2 9 C 40 4, 80 12, 120 7 S 200 4, 218 8"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
        animate={inView || reduced ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.9, delay, ease: 'easeOut' }}
      />
    </svg>
  )
}
