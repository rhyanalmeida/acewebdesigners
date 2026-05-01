import React, { useEffect, useCallback } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { HelmetProvider } from 'react-helmet-async'
import { editorialEase } from './lib/motion'

import Contact from './Contact'
import AboutUs from './AboutUs'
import Work from './Work'
import Services from './Services'
import Landing from './Landing'
import LandingContractors from './LandingContractors'
import Refer from './Refer'
import SocialMedia from './SocialMedia'
import PrivacyPolicy from './PrivacyPolicy'
import TermsOfService from './TermsOfService'
import Home from './pages/Home'

import { PageShell } from './components/layout'
import { CookieNotice } from './components/ui'
import { useScrollReveal } from './hooks/useScrollReveal'
import { trackEvent, trackViewContent } from './utils/pixelTracking'

type PageKey =
  | 'home'
  | 'about'
  | 'services'
  | 'work'
  | 'contact'
  | 'refer'
  | 'socialmedia'
  | 'landing'
  | 'contractorlanding'
  | 'privacy'
  | 'termsofservice'

/** Pages that should render without the standard header/footer/sticky CTA chrome. */
const BARE_PAGES: PageKey[] = ['landing', 'contractorlanding', 'refer', 'termsofservice']

function App() {
  const [currentPage, setCurrentPage] = React.useState<PageKey>('home')
  const [pendingScroll, setPendingScroll] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<{ budget?: string; message?: string }>({})

  // URL → page key on initial mount + back/forward
  useEffect(() => {
    const detectFromPath = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '')
      // Order matters: longer / more specific paths first so "/contractorlanding"
      // doesn't get caught by "/landing", and "/socialmedia" doesn't get caught
      // by "/services". Default falls through to 'home'.
      if (path.includes('/contractorlanding')) setCurrentPage('contractorlanding')
      else if (path.includes('/landing')) setCurrentPage('landing')
      else if (path.includes('/socialmedia')) setCurrentPage('socialmedia')
      else if (path.includes('/services')) setCurrentPage('services')
      else if (path.includes('/about')) setCurrentPage('about')
      else if (path.includes('/work')) setCurrentPage('work')
      else if (path.includes('/reviews')) setCurrentPage('reviews')
      else if (path.includes('/contact')) setCurrentPage('contact')
      else if (path.includes('/refer')) setCurrentPage('refer')
      else if (path.includes('/termsofservice')) setCurrentPage('termsofservice')
      else if (path.includes('/privacy')) setCurrentPage('privacy')
    }
    detectFromPath()

    // Cross-component navigation via custom event (preserved from previous behavior).
    // Used by Services.tsx ("showFreeDesignForm") and similar flows.
    const handleCustomNavigate = (event: Event) => {
      const detail = (event as CustomEvent).detail as { page?: PageKey; data?: typeof formData }
      if (detail?.page) setCurrentPage(detail.page)
      if (detail?.data) setFormData(detail.data)
      window.scrollTo(0, 0)
    }
    window.addEventListener('navigate', handleCustomNavigate as EventListener)
    return () => window.removeEventListener('navigate', handleCustomNavigate as EventListener)
  }, [])

  const handleNavigate = useCallback(
    (page: string, scrollTo?: string) => {
      const target = page as PageKey
      if (target === 'home' && scrollTo) {
        if (currentPage === 'home') {
          document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' })
        } else {
          setPendingScroll(scrollTo)
          setCurrentPage('home')
        }
        return
      }
      setCurrentPage(target)
      if (target !== 'contact') setFormData({})
      window.scrollTo(0, 0)
    },
    [currentPage]
  )

  // Single shared scroll-reveal observer; re-runs when page changes so newly mounted DOM is observed.
  useScrollReveal(currentPage)

  // SPA route → Meta Pixel PageView + ViewContent. The initial PageView fires
  // from index.html on first paint; this keeps Meta in sync with subsequent
  // client-side route changes. Landing/contractorlanding fire their own
  // ViewContent (with attribution) in their mount effects, so skip those here.
  useEffect(() => {
    if (currentPage === 'landing' || currentPage === 'contractorlanding') return
    trackEvent('PageView')
    const viewContentMap: Partial<Record<PageKey, [string, string, string]>> = {
      home: ['Home', 'Home', 'general'],
      about: ['About', 'About', 'general'],
      services: ['Services', 'Services', 'general'],
      work: ['Our Work', 'Portfolio', 'general'],
      reviews: ['Reviews', 'Reviews', 'general'],
      contact: ['Contact', 'Contact', 'general'],
      socialmedia: ['Social Media', 'Social Media Services', 'social_media'],
      refer: ['Refer & Earn', 'Referral', 'general'],
    }
    const args = viewContentMap[currentPage]
    if (args) trackViewContent(args[0], args[1], args[2])
  }, [currentPage])

  const renderPage = () => {
    switch (currentPage) {
      case 'contact':
        return <Contact initialData={formData} />
      case 'about':
        return <AboutUs />
      case 'work':
        return <Work />
      case 'services':
        return <Services />
      case 'landing':
        return <Landing />
      case 'contractorlanding':
        return <LandingContractors />
      case 'refer':
        return <Refer />
      case 'socialmedia':
        return <SocialMedia />
      case 'privacy':
        return <PrivacyPolicy />
      case 'termsofservice':
        return <TermsOfService />
      case 'home':
      default:
        return (
          <Home
            onNavigate={handleNavigate}
            pendingScroll={pendingScroll}
            onPendingScrollHandled={() => setPendingScroll(null)}
          />
        )
    }
  }

  const isBare = BARE_PAGES.includes(currentPage)
  const reduced = useReducedMotion()
  const firstRenderRef = React.useRef(true)
  React.useEffect(() => {
    firstRenderRef.current = false
  }, [])

  const PageWrapper = ({ children }: { children: React.ReactNode }) => {
    if (reduced) return <>{children}</>
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentPage}
          initial={firstRenderRef.current ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: editorialEase as unknown as number[] }}
          style={{ willChange: 'transform, opacity' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    )
  }

  // Landing/refer/legal pages render their own chrome — return them raw.
  if (isBare) {
    return (
      <HelmetProvider>
        <PageWrapper>{renderPage()}</PageWrapper>
        <CookieNotice />
      </HelmetProvider>
    )
  }

  return (
    <HelmetProvider>
      <PageShell onNavigate={handleNavigate} currentPage={currentPage}>
        <PageWrapper>{renderPage()}</PageWrapper>
      </PageShell>
      <CookieNotice />
    </HelmetProvider>
  )
}

export default App
