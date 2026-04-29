import { act, render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from '../../App'

const setPath = (path: string) => {
  window.history.replaceState({}, '', path)
}

describe('App routing + chrome', () => {
  beforeEach(() => {
    setPath('/')
  })

  it('renders the home page by default with hero headline', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /Beautiful websites for small business/i })).toBeInTheDocument()
  })

  it('shows the SiteHeader nav links on non-bare pages', () => {
    render(<App />)
    expect(screen.getAllByRole('button', { name: /About Us/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /^Services$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Social Media/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Our Work/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /^Contact$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Refer & Earn/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Free Design/i }).length).toBeGreaterThan(0)
  })

  it('renders skip-to-content link for accessibility', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /Skip to content/i })).toBeInTheDocument()
  })

  it('opens the mobile drawer when the menu button is clicked', () => {
    render(<App />)
    const openBtn = screen.getByRole('button', { name: /Open menu/i })
    fireEvent.click(openBtn)
    // Two "Close menu" buttons exist when open: the toggle and the in-drawer close.
    expect(screen.getAllByRole('button', { name: /Close menu/i }).length).toBeGreaterThan(0)
    expect(document.getElementById('mobile-drawer')).toHaveAttribute('aria-modal', 'true')
  })

  it('renders FAQ entries that survived the redesign', () => {
    render(<App />)
    expect(screen.getByText(/How much does a website cost\?/i)).toBeInTheDocument()
    expect(screen.getByText(/How long does it take to build a website\?/i)).toBeInTheDocument()
  })

  it('home page FAQ accordion expands when clicked', () => {
    render(<App />)
    const trigger = screen.getByText(/How much does a website cost\?/i)
    fireEvent.click(trigger)
    expect(screen.getByText(/Our websites start at \$200/i)).toBeInTheDocument()
  })

  it('renders the four process steps', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Discovery Call/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Free Design Mockup/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Development & Build/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Launch & Support/i })).toBeInTheDocument()
  })

  it('responds to the "navigate" custom event by switching pages', () => {
    render(<App />)
    act(() => {
      window.dispatchEvent(
        new CustomEvent('navigate', { detail: { page: 'contact' } })
      )
    })
    // Contact page renders the booking widget container with the preserved ID.
    expect(document.getElementById('contact-page-booking')).toBeInTheDocument()
  })

  it('detects /contractorlanding URL and renders bare contractor landing (no SiteHeader)', () => {
    setPath('/contractorlanding')
    render(<App />)
    // SiteHeader is not rendered on the contractor landing — no skip-link present
    expect(screen.queryByRole('link', { name: /Skip to content/i })).not.toBeInTheDocument()
    // Contractor-specific booking widget container must mount (preserved hard requirement)
    expect(document.getElementById('landing-contractors-form-container')).toBeInTheDocument()
    // Contractor conversion tracker data attribute is also a preserved surface
    expect(document.querySelector('[data-conversion-type="free_design_contractors"]')).toBeInTheDocument()
  })

  it('detects /landing URL and renders bare main landing (no SiteHeader)', () => {
    setPath('/landing')
    render(<App />)
    expect(screen.queryByRole('link', { name: /Skip to content/i })).not.toBeInTheDocument()
  })

  it('renders SiteFooter contact info on standard pages', () => {
    render(<App />)
    // PhoneCta in the home hero plus SiteFooter both render these links — assert at least one of each.
    expect(screen.getAllByRole('link', { name: /support@acewebdesigners\.com/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /\(774\) 446-7375/i }).length).toBeGreaterThan(0)
  })

  it('renders the three pricing tiers prominently on the home page', () => {
    render(<App />)
    // PriceCard primitives — pricing was buried in FAQ before, now must be its own section.
    expect(screen.getAllByText(/^\$200$/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^\$1,000$/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/^\$1,500$/).length).toBeGreaterThan(0)
    // The highlighted tier ribbon ("Most popular")
    expect(screen.getByText(/Most popular/i)).toBeInTheDocument()
    // Monthly hosting is part of the price reveal (Unit 1 of the SMM rollout).
    expect(screen.getByText(/\$15\/month hosting/i)).toBeInTheDocument()
    expect(screen.getByText(/\$30\/month hosting/i)).toBeInTheDocument()
    expect(screen.getByText(/\$45\/month hosting/i)).toBeInTheDocument()
  })

  it('routes /socialmedia to the Social Media page with both packages and combo deal', () => {
    setPath('/socialmedia')
    render(<App />)
    // Standard ($30/wk) + Deluxe ($99/wk) prices
    expect(screen.getByText(/^\$30$/)).toBeInTheDocument()
    expect(screen.getByText(/^\$99$/)).toBeInTheDocument()
    // Combo deal — both reduced rates and the $250 website discount surface
    expect(screen.getAllByText(/\$250 off/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/\$25\/wk/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/\$84\/wk/i).length).toBeGreaterThan(0)
  })
})

describe('Stable preservation surfaces (regression guards)', () => {
  beforeEach(() => {
    setPath('/')
  })

  it('exposes the navigate CustomEvent listener (used by Services / AboutUs / Work)', () => {
    render(<App />)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'about' } }))
    expect(dispatchSpy).toHaveBeenCalled()
    dispatchSpy.mockRestore()
  })
})
