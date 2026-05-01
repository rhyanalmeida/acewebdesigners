import React from 'react'
import { ArrowRight } from 'lucide-react'

interface StickyConversionBarProps {
  label: string
  onClick: () => void
  showAfterScroll?: number
  className?: string
}

/**
 * Mobile-first bottom-anchored CTA. Appears after scrolling past `showAfterScroll`
 * pixels (default 600). Honors safe-area-inset-bottom on iOS.
 *
 * The smooth-scroll behavior + mobile/desktop offset is the responsibility of
 * the parent (we just call onClick). This preserves the existing behavior in
 * LandingContractors.tsx where 16px mobile / 96px desktop offsets are applied.
 */
const StickyConversionBar: React.FC<StickyConversionBarProps> = ({
  label,
  onClick,
  showAfterScroll = 600,
  className = '',
}) => {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfterScroll)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [showAfterScroll])

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3
        bg-cream-50/80 backdrop-blur-md border-t border-ink-900/10
        transition-[transform,opacity,box-shadow] duration-500 ease-premium
        ${visible ? 'translate-y-0 opacity-100 shadow-lift' : 'translate-y-full opacity-0 pointer-events-none'}
        ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 active:scale-[0.98] text-white font-semibold py-4 px-6 shadow-glow-rust magnetic-btn ring-focus-rust transition-all duration-300 ease-premium"
      >
        {label}
        <ArrowRight className="h-5 w-5 icon-nudge" aria-hidden />
      </button>
    </div>
  )
}

export default StickyConversionBar
