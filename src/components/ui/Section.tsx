import React from 'react'
import Container from './Container'

type SectionTone =
  | 'default'
  | 'muted'
  | 'inverted'
  | 'gradient'
  | 'mesh'
  | 'panel'
  | 'blueprint'
type SectionPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'
type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: SectionTone
  padding?: SectionPadding
  containerSize?: ContainerSize
  bare?: boolean
  as?: 'section' | 'header' | 'footer' | 'div' | 'article'
}

// Tone names are historical; the values are the contract. Every page inherits
// the concrete ground from here, which is why this is the highest-leverage file
// in the library — 16 consumers.
//
// `blueprint` is the /contractorlanding skin: same system, drafting-sheet
// surface. It is a tone rather than a separate component so that page keeps
// using the identical primitives as the rest of the site.
//
// `gradient` and `mesh` are dead aliases kept only so existing call sites
// compile; both now resolve to real tones. Removing them from the union is an
// API change across the landing components, so they get cleaned up when those
// files are next touched.
const toneMap: Record<SectionTone, string> = {
  default:   'bg-cream-50 text-ink-900',
  muted:     'bg-cream-100 text-ink-900',
  panel:     'bg-cream-200 text-ink-900',
  inverted:  'bg-ink-900 text-cream-50',
  gradient:  'bg-ink-900 text-cream-50',
  mesh:      'bg-cream-100 text-ink-900',
  blueprint: 'surface-blueprint text-ink-900',
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
