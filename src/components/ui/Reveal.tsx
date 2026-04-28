import React from 'react'

type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' | 'stagger'

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
