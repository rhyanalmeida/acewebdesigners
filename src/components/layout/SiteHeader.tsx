import React from 'react'
import { Menu, X, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Container from '../ui/Container'
import { editorialEase } from '../../lib/motion'

export type NavigateFn = (page: string, scrollTo?: string) => void

interface SiteHeaderProps {
  onNavigate: NavigateFn
  currentPage?: string
}

const NAV_LINKS: Array<{ label: string; page: string }> = [
  { label: 'Home', page: 'home' },
  { label: 'About Us', page: 'about' },
  { label: 'Services', page: 'services' },
  { label: 'Social Media', page: 'socialmedia' },
  { label: 'Our Work', page: 'work' },
  { label: 'Contact', page: 'contact' },
  { label: 'Refer & Earn', page: 'refer' },
]

const Logo: React.FC<{ tone?: 'default' | 'inverted' }> = ({ tone = 'default' }) => (
  <span className={`flex items-baseline ${tone === 'inverted' ? 'text-cream-50' : 'text-ink-900'}`}>
    <span className="font-display text-2xl font-semibold tracking-tight">Ace</span>
    <span className={`ml-1.5 label-mono ${tone === 'inverted' ? 'text-cream-100/60' : 'text-ink-700/70'}`}>
      Web Designers
    </span>
  </span>
)

const SiteHeader: React.FC<SiteHeaderProps> = ({ onNavigate, currentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const drawerRef = React.useRef<HTMLDivElement>(null)

  const reduced = useReducedMotion()

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll + focus trap on mobile drawer
  React.useEffect(() => {
    if (!isMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', handler)
    drawerRef.current?.querySelector<HTMLElement>('[data-drawer-close]')?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handler)
    }
  }, [isMenuOpen])

  const go = (page: string) => {
    setIsMenuOpen(false)
    onNavigate(page)
  }

  return (
    <header>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-ink-900 focus:text-cream-50 focus:px-4 focus:py-2 focus:rounded-full focus:shadow-lift"
      >
        Skip to content
      </a>
      <nav
        aria-label="Main navigation"
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-premium ${
          isScrolled
            ? 'bg-cream-50/85 backdrop-blur-xl shadow-soft border-b border-ink-900/10'
            : 'bg-cream-50/70 backdrop-blur-md border-b border-transparent'
        }`}
      >
        <Container size="lg">
          <div
            className={`flex items-center justify-between transition-[height] duration-500 ease-premium ${
              isScrolled ? 'h-14' : 'h-16'
            }`}
          >
            <button
              onClick={() => go('home')}
              className="ring-focus-rust rounded-lg"
              aria-label="Go to homepage"
            >
              <Logo />
            </button>

            <div className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map(link => {
                const active = currentPage === link.page
                return (
                  <button
                    key={link.page}
                    onClick={() => go(link.page)}
                    className={`relative text-sm font-medium ring-focus-rust rounded transition-colors duration-300 ease-premium ${
                      active ? 'text-ink-900' : 'text-ink-700 hover:text-ink-900'
                    }`}
                  >
                    {link.label}
                    <span
                      aria-hidden
                      className={`absolute -bottom-1 left-0 h-[2px] rounded-full bg-rust-500 transition-all duration-500 ease-premium ${
                        active ? 'w-full' : 'w-0'
                      }`}
                    />
                  </button>
                )
              })}
              <button
                onClick={() => go('contact')}
                className="group ml-2 inline-flex items-center gap-1.5 rounded-full bg-rust-500 hover:bg-rust-600 text-white px-5 py-2 text-sm font-semibold shadow-glow-rust magnetic-btn ring-focus-rust transition-colors duration-300 ease-premium"
              >
                Free Design
                <ArrowRight className="h-4 w-4 icon-nudge" aria-hidden />
              </button>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-ink-800 hover:text-ink-900 ring-focus-rust"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-drawer"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
            </button>
          </div>
        </Container>
      </nav>

      {/* Mobile drawer */}
      <div
        id="mobile-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMenuOpen}
        className={`md:hidden fixed inset-0 z-[100] bg-cream-50 transition-transform duration-500 ease-premium ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        style={{ height: '100dvh' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-ink-900/10">
            <button onClick={() => go('home')} className="ring-focus-rust rounded-lg" aria-label="Go to homepage">
              <Logo />
            </button>
            <button
              data-drawer-close
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-md text-ink-800 hover:text-ink-900 ring-focus-rust"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
            <AnimatePresence>
              {isMenuOpen &&
                NAV_LINKS.map((link, i) => (
                  <motion.button
                    key={link.page}
                    onClick={() => go(link.page)}
                    className="text-left font-display text-2xl py-3 px-3 rounded-lg text-ink-800 hover:bg-cream-100 hover:text-ink-900 transition-colors ring-focus-rust"
                    initial={reduced ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{
                      duration: 0.32,
                      delay: reduced ? 0 : 0.05 + i * 0.05,
                      ease: editorialEase as unknown as number[],
                    }}
                  >
                    {link.label}
                  </motion.button>
                ))}
            </AnimatePresence>
            <button
              onClick={() => go('contact')}
              className="group mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white px-8 py-4 font-semibold shadow-glow-rust magnetic-btn ring-focus-rust transition-colors duration-300"
            >
              GET MY FREE DESIGN NOW!
              <ArrowRight className="h-5 w-5 icon-nudge" aria-hidden />
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
