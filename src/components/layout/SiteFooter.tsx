import React from 'react'
import { MousePointer2, Mail, Phone, MapPin, ArrowRight } from 'lucide-react'
import Container from '../ui/Container'
import { NavigateFn } from './SiteHeader'

interface SiteFooterProps {
  onNavigate: NavigateFn
}

const SiteFooter: React.FC<SiteFooterProps> = ({ onNavigate }) => (
  <footer className="relative bg-surface-950 text-surface-50" role="contentinfo">
    <div className="absolute inset-x-0 top-0 h-px divider-fade opacity-30" aria-hidden />
    <Container size="lg">
      <div className="grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <span className="inline-flex flex-col items-start text-white">
            <span className="flex items-center">
              <span className="text-2xl font-bold tracking-tight font-display">ACE</span>
              <MousePointer2 className="w-5 h-5 ml-0.5 -mt-[2px]" aria-hidden />
            </span>
            <span className="text-sm font-medium text-white/70 -mt-1">Web Designers</span>
          </span>
          <p className="mt-6 max-w-md text-sm text-white/70 leading-relaxed">
            Based in Leominster, MA, serving small businesses nationwide. Professional web design and
            development services helping small business owners across America build their online presence.
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-gradient text-white px-6 py-3 text-sm font-semibold shadow-glow-brand magnetic-btn ring-focus-brand"
          >
            Get a free design
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="md:col-span-3">
          <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/60">Company</h3>
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
                  className="text-white/70 hover:text-white transition-colors ring-focus-brand rounded"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/60">Contact</h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a
                href="mailto:support@acewebdesigners.com"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors ring-focus-brand rounded"
              >
                <Mail className="h-4 w-4" aria-hidden />
                support@acewebdesigners.com
              </a>
            </li>
            <li>
              <a
                href="tel:+17744467375"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors ring-focus-brand rounded"
              >
                <Phone className="h-4 w-4" aria-hidden />
                (774) 446-7375
              </a>
            </li>
            <li className="inline-flex items-center gap-2 text-white/70">
              <MapPin className="h-4 w-4" aria-hidden />
              Leominster, MA — Serving Nationwide
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Ace Web Designers. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-5 text-sm">
            <button
              onClick={() => onNavigate('privacy')}
              className="text-white/60 hover:text-white transition-colors ring-focus-brand rounded"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate('termsofservice')}
              className="text-white/60 hover:text-white transition-colors ring-focus-brand rounded"
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
