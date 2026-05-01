import React from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'awd_cookie_consent_v1'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * Minimal first-visit cookie disclosure.
 *
 * Default behavior matches Meta's expected pattern for non-EU traffic:
 * the Pixel collects events from page load (no opt-in required), but the
 * user can opt out, which sends `fbq('consent', 'revoke')` for the rest of
 * their session and persists the choice.
 *
 * If/when EU traffic grows, swap the default to `revoked` and gate the
 * Pixel init on Accept.
 */
const CookieNotice: React.FC = () => {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        // First visit — show after a short delay so it doesn't compete with hero animation
        const t = window.setTimeout(() => setVisible(true), 1200)
        return () => window.clearTimeout(t)
      }
      if (stored === 'revoked') {
        window.fbq?.('consent', 'revoke')
      }
    } catch {
      /* localStorage blocked — silently accept defaults */
    }
  }, [])

  const persist = (state: 'granted' | 'revoked') => {
    try {
      localStorage.setItem(STORAGE_KEY, state)
    } catch {
      /* ignore */
    }
    if (state === 'revoked') {
      window.fbq?.('consent', 'revoke')
    } else {
      window.fbq?.('consent', 'grant')
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-4 inset-x-3 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-sm z-[200]
        rounded-xl3 bg-cream-50 ring-1 ring-ink-900/10 shadow-lift p-5
        animate-fade-in-up"
    >
      <button
        type="button"
        onClick={() => persist('granted')}
        aria-label="Dismiss cookie notice"
        className="absolute top-3 right-3 p-1 rounded-full text-ink-700 hover:text-ink-900 hover:bg-cream-100 ring-focus-rust"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <p className="font-display text-base font-semibold text-ink-900">
        Cookies for ad measurement
      </p>
      <p className="mt-2 text-sm text-ink-800 leading-relaxed">
        We use a small Meta pixel to measure how our Facebook & Instagram ads perform. No
        third-party data sale, no tracking across other sites.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => persist('granted')}
          className="flex-1 rounded-full bg-rust-500 hover:bg-rust-600 text-white text-sm font-semibold py-2.5 px-4 shadow-glow-rust ring-focus-rust transition-colors"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => persist('revoked')}
          className="flex-1 rounded-full bg-cream-100 hover:bg-cream-200 text-ink-900 text-sm font-semibold py-2.5 px-4 ring-1 ring-ink-900/15 ring-focus-rust transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  )
}

export default CookieNotice
