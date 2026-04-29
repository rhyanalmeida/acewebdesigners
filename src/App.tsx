import React, { useEffect, useCallback } from 'react'

import Contact from './Contact'
import AboutUs from './AboutUs'
import Work from './Work'
import Services from './Services'
import Landing from './Landing'
import LandingContractors from './LandingContractors'
import Refer from './Refer'
import SocialMedia from './SocialMedia'
import PrivacyPolicy from './PrivacyPolicy'
import PrivacyPolicyPage from './PrivacyPolicyPage'
import TermsOfService from './TermsOfService'
import Home from './pages/Home'

import { PageShell } from './components/layout'
import { useScrollReveal } from './hooks/useScrollReveal'

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
  | 'privacypolicy'
  | 'termsofservice'

/** Pages that should render without the standard header/footer/sticky CTA chrome. */
const BARE_PAGES: PageKey[] = ['landing', 'contractorlanding', 'refer', 'privacypolicy', 'termsofservice']

function App() {
  const [currentPage, setCurrentPage] = React.useState<PageKey>('home')
  const [pendingScroll, setPendingScroll] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<{ budget?: string; message?: string }>({})

  // URL → page key on initial mount + back/forward
  useEffect(() => {
    const detectFromPath = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '')
      if (path.includes('/contractorlanding')) setCurrentPage('contractorlanding')
      else if (path.includes('/landing')) setCurrentPage('landing')
      else if (path.includes('/refer')) setCurrentPage('refer')
      else if (path.includes('/socialmedia')) setCurrentPage('socialmedia')
      else if (path.includes('/privacypolicy')) setCurrentPage('privacypolicy')
      else if (path.includes('/termsofservice')) setCurrentPage('termsofservice')
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
      case 'privacypolicy':
        return <PrivacyPolicyPage />
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

  // Landing/refer/legal pages render their own chrome — return them raw.
  if (isBare) {
    return <>{renderPage()}</>
  }

  return (
    <PageShell onNavigate={handleNavigate} currentPage={currentPage}>
      {renderPage()}
    </PageShell>
  )
}

export default App
