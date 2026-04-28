import React from 'react'
import Container from './Container'

type SectionTone = 'default' | 'muted' | 'inverted' | 'gradient' | 'mesh'
type SectionPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'
type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: SectionTone
  padding?: SectionPadding
  containerSize?: ContainerSize
  bare?: boolean
  as?: 'section' | 'header' | 'footer' | 'div' | 'article'
}

const toneMap: Record<SectionTone, string> = {
  default:  'bg-surface-0 text-surface-900',
  muted:    'bg-surface-50 text-surface-900',
  inverted: 'bg-surface-950 text-surface-50',
  gradient: 'bg-brand-gradient text-white',
  mesh:     'bg-surface-950 text-surface-50 bg-mesh-2',
}

const paddingMap: Record<SectionPadding, string> = {
  none: '',
  sm:   'py-10 sm:py-14',
  md:   'py-16 sm:py-20',
  lg:   'py-20 sm:py-28',
  xl:   'py-24 sm:py-32 lg:py-40',
}

const Section: React.FC<SectionProps> = ({
  tone = 'default',
  padding = 'lg',
  containerSize = 'lg',
  bare = false,
  as: Tag = 'section',
  className = '',
  children,
  ...rest
}) => {
  const Component = Tag as React.ElementType
  return (
    <Component
      className={`relative ${toneMap[tone]} ${paddingMap[padding]} ${className}`}
      {...rest}
    >
      {bare ? children : <Container size={containerSize}>{children}</Container>}
    </Component>
  )
}

export default Section
