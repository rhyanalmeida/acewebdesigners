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
        transition-[transform,opacity] duration-500 ease-premium
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
        ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient text-white font-semibold py-4 px-6 shadow-glow-brand magnetic-btn ring-focus-brand"
      >
        {label}
        <ArrowRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  )
}

export default StickyConversionBar
