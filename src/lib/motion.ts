import type { Variants, Transition } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'

export const editorialEase = [0.22, 1, 0.36, 1] as const

export const D = {
  fast: 0.18,
  base: 0.24,
  slow: 0.42,
  hero: 0.7,
} as const

const tx = (duration: number, delay = 0): Transition => ({
  duration,
  delay,
  ease: editorialEase as unknown as Transition['ease'],
})

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: tx(D.base) },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: tx(D.slow) },
}

export const fadeUpHero: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: tx(D.hero) },
}

export const staggerParent = (gap = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show:   { transition: { staggerChildren: gap, delayChildren } },
})

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: tx(D.slow) },
}

export const staggerChildSubtle: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: tx(D.base) },
}

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: tx(D.base) },
  exit:   { opacity: 0, y: -6, transition: tx(D.fast) },
}

export const heroSequence = {
  parent: staggerParent(0.08, 0.02),
  child:  fadeUp,
  childHero: fadeUpHero,
}

const NO_MOTION: Variants = {
  hidden: { opacity: 1 },
  show:   { opacity: 1, transition: { duration: 0 } },
  exit:   { opacity: 1, transition: { duration: 0 } },
}

export function useMotionVariants(variants: Variants): Variants {
  const reduced = useReducedMotion()
  return reduced ? NO_MOTION : variants
}

export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false
}
