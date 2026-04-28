import React from 'react'
import { Star, Shield, Sparkles, Clock } from 'lucide-react'

export interface TrustStackItem {
  label: string
  sub?: string
  icon?: 'star' | 'shield' | 'sparkles' | 'clock'
}

export interface TrustStackProps {
  items?: TrustStackItem[]
  tone?: 'default' | 'inverted'
  align?: 'left' | 'center'
  className?: string
}

const DEFAULT_ITEMS: TrustStackItem[] = [
  { icon: 'star',     label: '5.0 on Google',         sub: '100+ reviews' },
  { icon: 'sparkles', label: '100+ websites launched' },
  { icon: 'shield',   label: 'No payment until you love it' },
  { icon: 'clock',    label: 'Same-day launch available' },
]

const ICON_MAP = {
  star: Star,
  shield: Shield,
  sparkles: Sparkles,
  clock: Clock,
}

const TrustStack: React.FC<TrustStackProps> = ({
  items = DEFAULT_ITEMS,
  tone = 'default',
  align = 'center',
  className = '',
}) => {
  const isDark = tone === 'inverted'
  return (
    <ul
      className={`flex flex-wrap gap-x-6 gap-y-3 ${align === 'center' ? 'justify-center' : 'justify-start'} ${className}`}
      aria-label="Trust signals"
    >
      {items.map((item, i) => {
        const Icon = item.icon ? ICON_MAP[item.icon] : Star
        const filled = item.icon === 'star'
        return (
          <li
            key={i}
            className={`flex items-center gap-2 ${isDark ? 'text-cream-100/85' : 'text-ink-800'}`}
          >
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
            <span className="text-sm font-medium">
              {item.label}
              {item.sub && (
                <span className={`ml-1.5 ${isDark ? 'text-cream-100/55' : 'text-ink-700/70'}`}>
                  · {item.sub}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default TrustStack
