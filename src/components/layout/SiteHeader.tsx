import React from 'react'
import { MousePointer2, Menu, X, ArrowRight } from 'lucide-react'
import Container from '../ui/Container'

export type NavigateFn = (page: string, scrollTo?: string) => void

interface SiteHeaderProps {
  onNavigate: NavigateFn
  currentPage?: string
}

const NAV_LINKS: Array<{ label: string; page: string }> = [
  { label: 'Home', page: 'home' },
  { label: 'About Us', page: 'about' },
  { label: 'Services', page: 'services' },
  { label: 'Our Work', page: 'work' },
  { label: 'Contact', page: 'contact' },
  { label: 'Refer & Earn', page: 'refer' },
]

const Logo: React.FC<{ tone?: 'default' | 'inverted' }> = ({ tone = 'default' }) => (
  <span className={`flex flex-col items-start ${tone === 'inverted' ? 'text-white' : 'text-surface-900'}`}>
    <span className="flex items-center">
      <span className="text-2xl font-bold tracking-tight font-display">ACE</span>
      <MousePointer2 className="w-5 h-5 ml-0.5 -mt-[2px]" aria-hidden="true" />
    </span>
    <span className={`text-sm font-medium -mt-1 ${tone === 'inverted' ? 'text-white/80' : 'text-surface-700'}`}>
      Web Designers
    </span>
  </span>
)

const SiteHeader: React.FC<SiteHeaderProps> = ({ onNavigate, currentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const drawerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-surface-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-full focus:shadow-lift"
      >
        Skip to content
      </a>
      <nav
        aria-label="Main navigation"
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-premium ${
          isScrolled
            ? 'bg-white/85 backdrop-blur-xl shadow-soft border-b border-surface-200/60'
            : 'bg-white/70 backdrop-blur-md border-b border-transparent'
        }`}
      >
        <Container size="lg">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => go('home')}
              className="ring-focus-brand rounded-lg"
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
                    className={`relative text-sm font-medium ring-focus-brand rounded transition-colors duration-300 ease-premium ${
                      active ? 'text-surface-900' : 'text-surface-600 hover:text-surface-900'
                    }`}
                  >
                    {link.label}
                    <span
                      aria-hidden
                      className={`absolute -bottom-1 left-0 h-[2px] rounded-full bg-brand-gradient transition-all duration-500 ease-premium ${
                        active ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </button>
                )
              })}
              <button
                onClick={() => go('contact')}
                className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-brand-gradient text-white px-5 py-2 text-sm font-semibold shadow-glow-brand magnetic-btn ring-focus-brand"
              >
                Free Design
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-surface-700 hover:text-surface-900 ring-focus-brand"
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
        className={`md:hidden fixed inset-0 z-[100] bg-white transition-transform duration-500 ease-premium ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        style={{ height: '100dvh' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-surface-200">
            <button onClick={() => go('home')} className="ring-focus-brand rounded-lg" aria-label="Go to homepage">
              <Logo />
            </button>
            <button
              data-drawer-close
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-md text-surface-700 hover:text-surface-900 ring-focus-brand"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
            {NAV_LINKS.map(link => (
              <button
                key={link.page}
                onClick={() => go(link.page)}
                className="text-left text-xl py-3 px-3 rounded-lg text-surface-700 hover:bg-surface-50 hover:text-surface-900 transition-colors ring-focus-brand"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => go('contact')}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient text-white px-8 py-4 font-bold shadow-glow-brand magnetic-btn ring-focus-brand"
            >
              GET MY FREE DESIGN NOW!
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
