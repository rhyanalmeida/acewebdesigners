import React from 'react'
import { ArrowRight } from 'lucide-react'
import { NavigateFn } from './SiteHeader'

interface MobileStickyCtaProps {
  onNavigate: NavigateFn
  label?: string
  page?: string
}

/**
 * Mobile-only sticky CTA bar at the bottom of the viewport.
 * Hidden on landing pages that have their own booking widgets;
 * the parent (PageShell or App) decides whether to render it.
 */
const MobileStickyCta: React.FC<MobileStickyCtaProps> = ({
  onNavigate,
  label = 'GET MY FREE DESIGN NOW!',
  page = 'contact',
}) => (
  <>
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0"
      role="region"
      aria-label="Mobile call to action"
    >
      <button
        onClick={() => onNavigate(page)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient text-white py-4 px-6 font-bold shadow-glow-brand magnetic-btn ring-focus-brand"
      >
        {label}
        <ArrowRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
    <div className="md:hidden h-24" aria-hidden />
  </>
)

export default MobileStickyCta
