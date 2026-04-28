import React from 'react'
import { MousePointer2 } from 'lucide-react'

interface LandingFooterProps {
  tagline?: string
  showTerms?: boolean
  extras?: React.ReactNode
}

const DEFAULT_TAGLINE =
  'Based in Leominster, MA, serving small businesses nationwide. Professional web design and development helping you build your online presence.'

const LandingFooter: React.FC<LandingFooterProps> = ({
  tagline = DEFAULT_TAGLINE,
  showTerms = false,
  extras,
}) => (
  <footer className="bg-surface-950 text-surface-50" role="contentinfo">
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <span className="inline-flex flex-col items-start text-white">
            <span className="flex items-center">
              <span className="text-xl font-bold tracking-tight font-display">ACE</span>
              <MousePointer2 className="w-4 h-4 ml-0.5 -mt-[2px]" aria-hidden />
            </span>
            <span className="text-sm text-white/60 -mt-1">Web Designers</span>
          </span>
          <p className="mt-4 text-sm text-white/60 max-w-md">{tagline}</p>
          {extras && <div className="mt-4">{extras}</div>}
        </div>
        <div>
          <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/60">Contact</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href="mailto:support@acewebdesigners.com"
                className="text-white/70 hover:text-white transition-colors"
              >
                support@acewebdesigners.com
              </a>
            </li>
            <li>
              <a href="tel:+17744467375" className="text-white/70 hover:text-white transition-colors">
                (774) 446-7375
              </a>
            </li>
            <li className="text-white/70">Leominster, MA — Serving Nationwide</li>
          </ul>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm text-white/50">
          © {new Date().getFullYear()} Ace Web Designers. All rights reserved.
        </p>
        <div className="flex gap-4 text-sm">
          <a href="/privacy" className="text-white/60 hover:text-white transition-colors">
            Privacy Policy
          </a>
          {showTerms && (
            <a href="/termsofservice" className="text-white/60 hover:text-white transition-colors">
              Terms of Service
            </a>
          )}
        </div>
      </div>
    </div>
  </footer>
)

export default LandingFooter
