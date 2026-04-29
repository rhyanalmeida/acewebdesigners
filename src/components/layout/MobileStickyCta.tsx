import React from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { editorialEase } from '../../lib/motion'
import { NavigateFn } from './SiteHeader'

interface MobileStickyCtaProps {
  onNavigate: NavigateFn
  label?: string
  page?: string
}

/**
 * Mobile-only sticky CTA bar. Slides up after the user scrolls past the hero.
 */
const MobileStickyCta: React.FC<MobileStickyCtaProps> = ({
  onNavigate,
  label = 'GET MY FREE DESIGN NOW!',
  page = 'contact',
}) => {
  const reduced = useReducedMotion()
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.div
        className="md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0"
        role="region"
        aria-label="Mobile call to action"
        initial={false}
        animate={
          reduced
            ? { y: 0, opacity: 1 }
            : visible
              ? { y: 0, opacity: 1, pointerEvents: 'auto' }
              : { y: 96, opacity: 0, pointerEvents: 'none' }
        }
        transition={{ duration: 0.42, ease: editorialEase as unknown as number[] }}
      >
        <button
          onClick={() => onNavigate(page)}
          className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white py-4 px-6 font-bold shadow-glow-rust magnetic-btn ring-focus-rust"
        >
          {label}
          <ArrowRight className="h-5 w-5 icon-nudge" aria-hidden />
        </button>
      </motion.div>
      <div className="md:hidden h-24" aria-hidden />
    </>
  )
}

export default MobileStickyCta
