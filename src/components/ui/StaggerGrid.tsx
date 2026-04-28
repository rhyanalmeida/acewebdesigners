import React from 'react'
import Reveal from './Reveal'

interface StaggerGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  childClassName?: string
  delayMs?: number
  variant?: 'stagger' | 'up' | 'fade'
  keyFn?: (item: T, index: number) => string | number
}

function StaggerGrid<T>({
  items,
  renderItem,
  className = '',
  childClassName = '',
  delayMs = 70,
  variant = 'stagger',
  keyFn,
}: StaggerGridProps<T>) {
  return (
    <Reveal variant={variant} className={className}>
      {items.map((item, i) => (
        <div
          key={keyFn ? keyFn(item, i) : i}
          data-reveal-stagger-child
          style={{ transitionDelay: `${i * delayMs}ms` }}
          className={childClassName}
        >
          {renderItem(item, i)}
        </div>
      ))}
    </Reveal>
  )
}

export default StaggerGrid
