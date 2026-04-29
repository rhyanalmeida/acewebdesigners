import React from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { editorialEase } from '../../lib/motion'

type Props = {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'
  className?: string
  delay?: number
  stagger?: number
  splitBy?: 'word' | 'char'
  triggerOnView?: boolean
}

/**
 * Renders `text` so search engines + screen readers see the full string,
 * while sighted users see a per-word/char fade-up reveal. The visible spans
 * are aria-hidden; the canonical text lives in a sr-only sibling.
 */
export default function SplitText({
  text,
  as = 'h1',
  className = '',
  delay = 0,
  stagger = 0.06,
  splitBy = 'word',
  triggerOnView = false,
}: Props) {
  const Tag = as as React.ElementType
  const reduced = useReducedMotion()
  const ref = React.useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const shouldAnimate = triggerOnView ? inView : true

  const tokens = React.useMemo(() => {
    if (splitBy === 'char') return Array.from(text)
    return text.split(/(\s+)/)
  }, [text, splitBy])

  if (reduced) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <Tag ref={ref as React.Ref<HTMLElement>} className={className} data-motion="split">
      <span className="sr-only-keep">{text}</span>
      <span aria-hidden="true">
        {tokens.map((token, i) => {
          if (/^\s+$/.test(token)) {
            return (
              <span key={i} style={{ whiteSpace: 'pre' }}>
                {token}
              </span>
            )
          }
          return (
            <motion.span
              key={i}
              style={{ display: 'inline-block', willChange: 'transform, opacity' }}
              initial={{ opacity: 0, y: '0.4em' }}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: 0.55,
                ease: editorialEase as unknown as number[],
                delay: delay + i * stagger,
              }}
            >
              {token}
            </motion.span>
          )
        })}
      </span>
    </Tag>
  )
}
