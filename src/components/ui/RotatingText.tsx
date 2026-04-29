import React, { useEffect, useState } from 'react'

export interface RotatingTextProps {
  /** Words to cycle through. Index 0 is what screen readers hear. */
  words: string[]
  /** ms between word swaps. Defaults to 2000. */
  intervalMs?: number
  /** ms transition duration per swap. Defaults to 650. */
  durationMs?: number
  className?: string
}

/**
 * Vertically slides between words. The active word sits at
 * translateY(0) opacity 1; non-active words are clipped below at
 * translateY(60%) with opacity 0. On every interval the index
 * advances, so the active word falls + fades while the new active
 * rises + fades in.
 *
 * - Inline-grid stacks all words in the same cell, so the cell is
 *   sized by the widest word — no layout jitter as words rotate.
 * - overflow-hidden clips the partially-translated words at the
 *   cell boundary for a clean "slot machine"-style swap.
 * - Honors prefers-reduced-motion (renders the first word static).
 * - The visual rotation is aria-hidden; the first word is announced
 *   once via sr-only so the heading's accessible name stays stable.
 */
const RotatingText: React.FC<RotatingTextProps> = ({
  words,
  intervalMs = 2000,
  durationMs = 650,
  className = '',
}) => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (words.length <= 1) return
    if (typeof window === 'undefined') return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % words.length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [words, intervalMs])

  if (words.length === 0) return null

  return (
    <>
      <span className="sr-only">{words[0]}</span>
      <span
        aria-hidden="true"
        className={`inline-grid overflow-hidden align-baseline ${className}`}
      >
        {words.map((word, i) => {
          const isCurrent = i === index
          return (
            <span
              key={word}
              className="col-start-1 row-start-1 whitespace-nowrap"
              style={{
                opacity: isCurrent ? 1 : 0,
                transform: isCurrent ? 'translateY(0)' : 'translateY(60%)',
                transition: `opacity ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            >
              {word}
            </span>
          )
        })}
      </span>
    </>
  )
}

export default RotatingText
