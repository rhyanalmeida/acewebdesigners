import React from 'react'

/**
 * `down` | `left` | `right` | `scale` were removed 2026-07-20. They had zero call
 * sites and existed only as options, while every real usage was `up` or
 * `stagger`. Narrowing the union means a future call to a deleted variant is a
 * type error instead of an element that silently never becomes visible.
 */
type RevealVariant = 'up' | 'fade' | 'stagger'

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: RevealVariant
  delay?: number
  as?: keyof JSX.IntrinsicElements
}

/**
 * Declarative scroll-reveal wrapper. Pairs with the IntersectionObserver
 * in `useScrollReveal` (extended from the existing observer in App.tsx).
 * Initial hidden state and transition come from CSS in src/index.css
 * via the [data-reveal] selector.
 *
 * For staggered children: use variant="stagger" and tag children with
 * the `data-reveal-stagger-child` attribute.
 */
const Reveal: React.FC<RevealProps> = ({
  variant = 'up',
  delay = 0,
  as: Tag = 'div',
  className = '',
  style,
  children,
  ...rest
}) => {
  const Component = Tag as React.ElementType
  return (
    <Component
      data-reveal={variant}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  )
}

export default Reveal
