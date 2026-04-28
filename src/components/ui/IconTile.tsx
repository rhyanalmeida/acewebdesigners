import React from 'react'

type IconTileTone = 'brand' | 'accent' | 'neutral' | 'inverted'
type IconTileSize = 'sm' | 'md' | 'lg'

interface IconTileProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: IconTileTone
  size?: IconTileSize
}

const toneMap: Record<IconTileTone, string> = {
  brand:    'bg-brand-gradient text-white shadow-glow-brand',
  accent:   'bg-accent-500 text-white',
  neutral:  'bg-surface-100 text-surface-700 ring-1 ring-surface-200',
  inverted: 'bg-white/10 text-white ring-1 ring-white/15',
}

const sizeMap: Record<IconTileSize, string> = {
  sm: 'h-9 w-9 rounded-lg [&>svg]:h-4 [&>svg]:w-4',
  md: 'h-12 w-12 rounded-xl [&>svg]:h-6 [&>svg]:w-6',
  lg: 'h-14 w-14 rounded-xl2 [&>svg]:h-7 [&>svg]:w-7',
}

const IconTile: React.FC<IconTileProps> = ({
  tone = 'brand',
  size = 'md',
  className = '',
  children,
  ...rest
}) => (
  <div
    className={`inline-flex items-center justify-center ${toneMap[tone]} ${sizeMap[size]} ${className}`}
    {...rest}
  >
    {children}
  </div>
)

export default IconTile
