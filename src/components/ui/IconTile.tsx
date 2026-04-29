import React from 'react'

type IconTileTone = 'brand' | 'accent' | 'neutral' | 'inverted' | 'forest'
type IconTileSize = 'sm' | 'md' | 'lg'

interface IconTileProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: IconTileTone
  size?: IconTileSize
}

const toneMap: Record<IconTileTone, string> = {
  brand:    'bg-rust-50 text-rust-600 ring-1 ring-rust-100',
  accent:   'bg-rust-500 text-white shadow-glow-rust',
  neutral:  'bg-cream-100 text-ink-700 ring-1 ring-ink-900/10',
  inverted: 'bg-cream-50/10 text-cream-50 ring-1 ring-cream-50/15',
  forest:   'bg-forest-50 text-forest-700 ring-1 ring-forest-100',
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
    className={`inline-flex items-center justify-center transition-transform duration-300 ease-premium motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 ${toneMap[tone]} ${sizeMap[size]} ${className}`}
    {...rest}
  >
    {children}
  </div>
)

export default IconTile
