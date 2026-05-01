import React from 'react'
import { Star, Zap, Shield, MapPin, type LucideIcon } from 'lucide-react'

export interface TrustStripItem {
  icon: 'star' | 'zap' | 'shield' | 'map'
  label: string
}

const ICON_MAP: Record<TrustStripItem['icon'], LucideIcon> = {
  star: Star,
  zap: Zap,
  shield: Shield,
  map: MapPin,
}

interface TrustStripProps {
  items?: TrustStripItem[]
  tone?: 'default' | 'inverted'
}

const DEFAULT_ITEMS: TrustStripItem[] = [
  { icon: 'star', label: '5.0 on Google' },
  { icon: 'zap', label: 'Same-day launches' },
  { icon: 'shield', label: 'Free design — pay only if you love it' },
  { icon: 'map', label: 'Built for contractors nationwide' },
]

const TrustStrip: React.FC<TrustStripProps> = ({ items = DEFAULT_ITEMS, tone = 'default' }) => {
  const isDark = tone === 'inverted'
  return (
    <div
      className={`relative ${
        isDark ? 'bg-ink-900 text-cream-50' : 'bg-cream-100 text-ink-900'
      } border-y ${isDark ? 'border-cream-50/10' : 'border-ink-900/10'}`}
      aria-label="Trust signals"
    >
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5">
        <ul
          className={`flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium`}
        >
          {items.map((item, i) => {
            const Icon = ICON_MAP[item.icon]
            const filled = item.icon === 'star'
            return (
              <li key={i} className="flex items-center gap-2">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    filled
                      ? 'text-amber-500 fill-amber-500'
                      : isDark
                      ? 'text-rust-300'
                      : 'text-rust-600'
                  }`}
                  aria-hidden
                />
                <span className={isDark ? 'text-cream-100/90' : 'text-ink-800'}>{item.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default TrustStrip
