import React from 'react'
import SiteHeader, { NavigateFn } from './SiteHeader'
import SiteFooter from './SiteFooter'
import MobileStickyCta from './MobileStickyCta'

interface PageShellProps {
  onNavigate: NavigateFn
  currentPage?: string
  showHeader?: boolean
  showFooter?: boolean
  showStickyCta?: boolean
  topPadding?: boolean
  children: React.ReactNode
}

/**
 * Wraps page content with the standard site chrome.
 * Defaults match the existing App.tsx behavior — landing/refer/legal pages
 * pass `showHeader={false} showFooter={false} showStickyCta={false}` to opt
 * out the same way the current router's conditional did.
 */
const PageShell: React.FC<PageShellProps> = ({
  onNavigate,
  currentPage,
  showHeader = true,
  showFooter = true,
  showStickyCta = true,
  topPadding = true,
  children,
}) => (
  <div className="min-h-screen bg-surface-0 text-surface-900">
    {showHeader && <SiteHeader onNavigate={onNavigate} currentPage={currentPage} />}
    <main id="main" className={topPadding && showHeader ? 'pt-16' : ''}>
      {children}
    </main>
    {showFooter && <SiteFooter onNavigate={onNavigate} />}
    {showStickyCta && <MobileStickyCta onNavigate={onNavigate} />}
  </div>
)

export default PageShell
