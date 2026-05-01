import React from 'react'
import Logo from './Logo'

interface LandingFooterProps {
  tagline?: string
  showTerms?: boolean
  extras?: React.ReactNode
}

const DEFAULT_TAGLINE =
  'Beautiful websites, built for small business. Based in Leominster, MA, serving owners nationwide.'

const LandingFooter: React.FC<LandingFooterProps> = ({
  tagline = DEFAULT_TAGLINE,
  showTerms = false,
  extras,
}) => (
  <footer className="bg-ink-900 text-cream-50" role="contentinfo">
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <Logo tone="inverted" size="md" />
          <p className="mt-4 text-sm text-cream-100/65 max-w-md leading-relaxed">{tagline}</p>
          {extras && <div className="mt-4">{extras}</div>}
        </div>
        <div>
          <h3 className="label-mono text-cream-100/55">Contact</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href="mailto:hello@acewebdesigners.com"
                className="text-cream-100/75 hover:text-cream-50 transition-colors"
              >
                hello@acewebdesigners.com
              </a>
            </li>
            <li>
              <a
                href="tel:+17744467375"
                className="text-cream-100/75 hover:text-cream-50 transition-colors"
              >
                (774) 446-7375
              </a>
            </li>
            <li className="text-cream-100/75">Leominster, MA — Serving Nationwide</li>
          </ul>
        </div>
      </div>
      {/* Slim internal-link strip so crawlers can navigate back to the main site
          without diluting the focused conversion CTA above. */}
      <nav
        className="mt-10 pt-6 border-t border-cream-50/10 flex flex-wrap gap-x-5 gap-y-2 text-xs text-cream-100/55"
        aria-label="Site navigation"
      >
        <a href="/" className="hover:text-cream-50 transition-colors">Home</a>
        <a href="/work" className="hover:text-cream-50 transition-colors">Our Work</a>
        <a href="/reviews" className="hover:text-cream-50 transition-colors">Reviews</a>
        <a href="/socialmedia" className="hover:text-cream-50 transition-colors">Social Media</a>
        <a href="/about" className="hover:text-cream-50 transition-colors">About</a>
      </nav>
      <div className="mt-6 pt-6 border-t border-cream-50/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm text-cream-100/50">
          © {new Date().getFullYear()} Ace Web Designers. All rights reserved.
        </p>
        <div className="flex gap-4 text-sm">
          <a href="/privacy" className="text-cream-100/60 hover:text-cream-50 transition-colors">
            Privacy Policy
          </a>
          {showTerms && (
            <a href="/termsofservice" className="text-cream-100/60 hover:text-cream-50 transition-colors">
              Terms of Service
            </a>
          )}
        </div>
      </div>
    </div>
  </footer>
)

export default LandingFooter
