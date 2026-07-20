import React from 'react'

type IconTileTone = 'brand' | 'accent' | 'neutral' | 'inverted' | 'forest'
type IconTileSize = 'sm' | 'md' | 'lg'

interface IconTileProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: IconTileTone
  size?: IconTileSize
}

// Square tiles with a real border. The `accent` glow and the soft inset rings
// are gone, as is the hover `scale-110 -rotate-3` — a tilting, growing icon is
// decorative motion of exactly the kind being removed.
const toneMap: Record<IconTileTone, string> = {
  brand:    'bg-transparent text-signal-500 border border-signal-500/40',
  accent:   'bg-signal-500 text-white border border-signal-500',
  neutral:  'bg-transparent text-ink-700 border border-ink-900/25',
  inverted: 'bg-transparent text-cream-50 border border-cream-50/25',
  forest:   'bg-transparent text-forest-700 border border-forest-500/40',
}

const sizeMap: Record<IconTileSize, string> = {
  sm: 'h-9 w-9 [&>svg]:h-4 [&>svg]:w-4',
  md: 'h-11 w-11 [&>svg]:h-5 [&>svg]:w-5',
  lg: 'h-14 w-14 [&>svg]:h-6 [&>svg]:w-6',
}

const IconTile: React.FC<IconTileProps> = ({
  tone = 'brand',
  size = 'md',
  className = '',
  children,
  ...rest
}) => (
  <div
    className={`inline-flex items-center justify-center shrink-0 ${toneMap[tone]} ${sizeMap[size]} ${className}`}
    {...rest}
  >
    {children}
  </div>
)

export default IconTile
