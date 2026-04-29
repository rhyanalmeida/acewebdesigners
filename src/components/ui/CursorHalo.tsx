import React from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

type Props = {
  /** Selector for the parent the halo should hover over. Falls back to its parent element. */
  className?: string
  size?: number
  color?: string
  opacity?: number
}

/**
 * Soft radial-gradient blob that follows the cursor inside its parent only.
 * Renders nothing on touch devices or with prefers-reduced-motion.
 */
export default function CursorHalo({
  className = '',
  size = 280,
  color = 'rgba(192, 78, 26, 0.22)',
  opacity = 0.65,
}: Props) {
  const reduced = useReducedMotion()
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const x = useMotionValue(-9999)
  const y = useMotionValue(-9999)
  const springX = useSpring(x, { stiffness: 140, damping: 22, mass: 0.6 })
  const springY = useSpring(y, { stiffness: 140, damping: 22, mass: 0.6 })
  const [active, setActive] = React.useState(false)

  const enabled =
    !reduced && typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches

  React.useEffect(() => {
    if (!enabled) return
    const wrap = wrapRef.current
    const parent = wrap?.parentElement
    if (!parent) return

    const onMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect()
      x.set(e.clientX - rect.left - size / 2)
      y.set(e.clientY - rect.top - size / 2)
      setActive(true)
    }
    const onLeave = () => setActive(false)
    parent.addEventListener('pointermove', onMove)
    parent.addEventListener('pointerleave', onLeave)
    return () => {
      parent.removeEventListener('pointermove', onMove)
      parent.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled, size, x, y])

  if (!enabled) return null

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    >
      <motion.div
        style={{
          position: 'absolute',
          width: size,
          height: size,
          x: springX,
          y: springY,
          background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
          opacity: active ? opacity : 0,
          transition: 'opacity 240ms ease',
          mixBlendMode: 'multiply',
          willChange: 'transform, opacity',
        }}
      />
    </div>
  )
}
