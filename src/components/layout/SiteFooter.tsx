import React from 'react'
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react'
import Container from '../ui/Container'
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
          <span className="flex items-baseline text-cream-50">
            <span className="font-display text-3xl font-semibold tracking-tight">Ace</span>
            <span className="ml-2 label-mono text-cream-100/60">Web Designers</span>
          </span>
          <p className="mt-6 max-w-md text-base text-cream-100/70 leading-relaxed">
            Beautiful websites, built for small business. Based in Leominster, MA — serving owners
            <span className="text-editorial-italic text-rust-300"> nationwide</span>.
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white px-6 py-3 text-sm font-semibold shadow-glow-rust magnetic-btn ring-focus-rust transition-colors duration-300"
          >
            Get a free design
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="md:col-span-3">
          <h3 className="label-mono text-cream-100/55">Company</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              { label: 'Home', page: 'home' },
              { label: 'About Us', page: 'about' },
              { label: 'Services', page: 'services' },
              { label: 'Our Work', page: 'work' },
              { label: 'Refer & Earn', page: 'refer' },
            ].map(l => (
              <li key={l.page}>
                <button
                  onClick={() => onNavigate(l.page)}
                  className="text-cream-100/75 hover:text-cream-50 transition-colors ring-focus-rust rounded font-display"
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
                href="mailto:support@acewebdesigners.com"
                className="inline-flex items-center gap-2 text-cream-100/75 hover:text-cream-50 transition-colors ring-focus-rust rounded"
              >
                <Mail className="h-4 w-4 text-rust-300" aria-hidden />
                support@acewebdesigners.com
              </a>
            </li>
            <li>
              <a
                href="tel:+17744467375"
                className="inline-flex items-center gap-2 text-cream-100/75 hover:text-cream-50 transition-colors ring-focus-rust rounded"
              >
                <Phone className="h-4 w-4 text-rust-300" aria-hidden />
                (774) 446-7375
              </a>
            </li>
            <li className="inline-flex items-center gap-2 text-cream-100/75">
              <MapPin className="h-4 w-4 text-rust-300" aria-hidden />
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
              className="text-cream-100/60 hover:text-cream-50 transition-colors ring-focus-rust rounded"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate('termsofservice')}
              className="text-cream-100/60 hover:text-cream-50 transition-colors ring-focus-rust rounded"
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
