import React from 'react'
import Container from './Container'

type SectionTone = 'default' | 'muted' | 'inverted' | 'gradient' | 'mesh' | 'panel'
type SectionPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'
type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: SectionTone
  padding?: SectionPadding
  containerSize?: ContainerSize
  bare?: boolean
  as?: 'section' | 'header' | 'footer' | 'div' | 'article'
}

// Editorial cream palette — old tone names remapped so existing pages
// inherit the new look without per-page changes.
const toneMap: Record<SectionTone, string> = {
  default:  'bg-cream-50 text-ink-900',
  muted:    'bg-cream-100 text-ink-900',
  panel:    'bg-cream-200 text-ink-900',
  inverted: 'bg-ink-900 text-cream-50',
  gradient: 'bg-ink-900 text-cream-50',
  mesh:     'bg-cream-100 text-ink-900 bg-paper-noise',
}

const paddingMap: Record<SectionPadding, string> = {
  none: '',
  sm:   'py-10 sm:py-14',
  md:   'py-16 sm:py-20',
  lg:   'py-20 sm:py-28',
  xl:   'py-24 sm:py-32 lg:py-40',
}

// forwardRef so callers (BookingSection's scrollToBooking flow on the landing
// pages) can attach a ref to the underlying DOM element. Without forwardRef
// the ref prop is silently dropped by React and the scroll-to-booking CTA
// silently no-ops.
const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      tone = 'default',
      padding = 'lg',
      containerSize = 'lg',
      bare = false,
      as: Tag = 'section',
      className = '',
      children,
      ...rest
    },
    ref,
  ) => {
    const Component = Tag as React.ElementType
    return (
      <Component
        ref={ref}
        className={`relative ${toneMap[tone]} ${paddingMap[padding]} ${className}`}
        {...rest}
      >
        {bare ? children : <Container size={containerSize}>{children}</Container>}
      </Component>
    )
  },
)

Section.displayName = 'Section'

export default Section
