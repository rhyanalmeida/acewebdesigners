import React from 'react'
import { motion, useInView, useReducedMotion, animate } from 'framer-motion'
import { editorialEase } from '../../lib/motion'

interface StatBlockProps {
  value: string
  label: string
  sub?: string
  tone?: 'default' | 'inverted'
  align?: 'left' | 'center'
  className?: string
}

/** Match a leading number (with optional decimal) so we can count it up. */
function parseLeadingNumber(value: string): { num: number; prefix: string; suffix: string } | null {
  const m = value.match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/)
  if (!m) return null
  const [, prefix, numStr, suffix] = m
  const num = parseFloat(numStr)
  if (Number.isNaN(num)) return null
  return { num, prefix, suffix }
}

const AnimatedValue: React.FC<{ value: string; reduced: boolean }> = ({ value, reduced }) => {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const parsed = React.useMemo(() => parseLeadingNumber(value), [value])
  const [display, setDisplay] = React.useState<string>(parsed && !reduced ? `${parsed.prefix}0${parsed.suffix}` : value)

  React.useEffect(() => {
    if (reduced || !parsed || !inView) return
    const isInt = Number.isInteger(parsed.num)
    const controls = animate(0, parsed.num, {
      duration: 1.2,
      ease: editorialEase as unknown as number[],
      onUpdate: (v) => {
        const formatted = isInt ? Math.round(v).toString() : v.toFixed(1)
        setDisplay(`${parsed.prefix}${formatted}${parsed.suffix}`)
      },
    })
    return () => controls.stop()
  }, [parsed, inView, reduced])

  if (parsed && !reduced) {
    return <span ref={ref}>{display}</span>
  }

  if (reduced || !value) {
    return <span ref={ref}>{value}</span>
  }

  // Non-numeric: per-character fade-in stagger.
  return (
    <span ref={ref} aria-label={value}>
      <span className="sr-only-keep">{value}</span>
      <span aria-hidden="true">
        {Array.from(value).map((ch, i) => (
          <motion.span
            key={i}
            style={{ display: 'inline-block', willChange: 'transform, opacity' }}
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : undefined}
            transition={{
              duration: 0.42,
              delay: i * 0.05,
              ease: editorialEase as unknown as number[],
            }}
          >
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        ))}
      </span>
    </span>
  )
}

const StatBlock: React.FC<StatBlockProps> = ({
  value,
  label,
  sub,
  tone = 'default',
  align = 'left',
  className = '',
}) => {
  const reduced = useReducedMotion() ?? false
  return (
    <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : ''} ${className}`}>
      <span
        className={`font-display font-bold tracking-tight text-4xl sm:text-5xl ${
          tone === 'inverted' ? 'text-white' : 'text-ink-900'
        }`}
      >
        <AnimatedValue value={value} reduced={reduced} />
      </span>
      <span className={`mt-2 text-sm font-semibold uppercase tracking-[0.15em] ${tone === 'inverted' ? 'text-white/70' : 'text-ink-700/70'}`}>
        {label}
      </span>
      {sub && (
        <span className={`mt-1 text-sm ${tone === 'inverted' ? 'text-white/60' : 'text-ink-700/60'}`}>{sub}</span>
      )}
    </div>
  )
}

export default StatBlock
