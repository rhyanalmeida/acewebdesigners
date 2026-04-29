import React from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  strength?: number
  className?: string
}

/**
 * Wraps children in a motion span that gently pulls toward the cursor.
 * Pointer-fine + non-reduced-motion only. Touch devices get the children unwrapped.
 */
export default function Magnetic({ children, strength = 8, className = '' }: Props) {
  const reduced = useReducedMotion()
  const ref = React.useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 20, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 200, damping: 20, mass: 0.4 })

  const enabled = !reduced && typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches

  React.useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      x.set(dx * strength)
      y.set(dy * strength)
    }
    const onLeave = () => {
      x.set(0)
      y.set(0)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled, strength, x, y])

  if (!enabled) {
    return <span className={className}>{children}</span>
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ x: springX, y: springY, display: 'inline-block', willChange: 'transform' }}
    >
      {children}
    </motion.span>
  )
}
