import React from 'react'

interface LogoProps {
  tone?: 'default' | 'inverted'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-7 sm:h-8',
  md: 'h-8 sm:h-10',
  lg: 'h-10 sm:h-12',
}

const Logo: React.FC<LogoProps> = ({ tone = 'default', size = 'md', className = '' }) => (
  <img
    src="/logo.png"
    alt="Ace Web Designers"
    className={`${SIZE_CLASSES[size]} w-auto select-none ${className}`}
    style={tone === 'inverted' ? { filter: 'invert(1) hue-rotate(180deg)' } : undefined}
    draggable={false}
  />
)

export default Logo
