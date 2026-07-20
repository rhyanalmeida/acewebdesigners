import React from 'react'
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import Container from '../ui/Container'
import Logo from '../ui/Logo'
import { NavigateFn } from './SiteHeader'

interface SiteFooterProps {
  onNavigate: NavigateFn
}

const SiteFooter: React.FC<SiteFooterProps> = ({ onNavigate }) => (
  <footer className="relative bg-ink-900 text-cream-50" role="contentinfo">
    <hr className="border-cream-50/10" />
    <Container size="lg">
      <div className="grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo tone="inverted" size="lg" />
          <p className="mt-6 max-w-md text-base text-cream-100/70 leading-relaxed">
            Rhyan and Valerie. We build websites for contractors and the people who do the
            work themselves, anywhere in the United States.
          </p>
          <Button
            variant="primary"
            size="sm"
            tone="inverted"
            className="mt-8"
            onClick={() => onNavigate('contact')}
          >
            See available times
            <ArrowRight className="h-4 w-4 icon-nudge" aria-hidden />
          </Button>
        </div>

        <div className="md:col-span-3">
          <h3 className="label-mono text-cream-100/55">Company</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { label: 'Home', page: 'home' },
              { label: 'About Us', page: 'about' },
              { label: 'Services', page: 'services' },
              { label: 'Social Media', page: 'socialmedia' },
              { label: 'Our Work', page: 'work' },
              { label: 'Refer', page: 'refer' },
            ].map(l => (
              <li key={l.page}>
                <button
                  onClick={() => onNavigate(l.page)}
                  className="nav-underline text-cream-100/75 hover:text-cream-50 transition-colors ring-focus-signal"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <h3 className="label-mono text-cream-100/55">Contact</h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a
                href="mailto:hello@acewebdesigners.com"
                className="inline-flex items-center gap-2 text-cream-100/75 hover:text-cream-50 transition-colors ring-focus-signal"
              >
                <Mail className="h-4 w-4 text-signal-300" aria-hidden />
                hello@acewebdesigners.com
              </a>
            </li>
            <li>
              <a
                href="tel:+17744467375"
                className="inline-flex items-center gap-2 text-cream-100/75 hover:text-cream-50 transition-colors ring-focus-signal"
              >
                <Phone className="h-4 w-4 text-signal-300" aria-hidden />
                (774) 446-7375
              </a>
            </li>
            <li className="inline-flex items-center gap-2 text-cream-100/75">
              <MapPin className="h-4 w-4 text-signal-300" aria-hidden />
              Leominster, MA — Serving Nationwide
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream-50/10 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-cream-100/50">
            © {new Date().getFullYear()} Ace Web Designers. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-5 text-sm">
            <button
              onClick={() => onNavigate('privacy')}
              className="text-cream-100/60 hover:text-cream-50 transition-colors ring-focus-signal"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate('termsofservice')}
              className="text-cream-100/60 hover:text-cream-50 transition-colors ring-focus-signal"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </Container>
  </footer>
)

export default SiteFooter
