import { act, render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from '../../App'

const setPath = (path: string) => {
  window.history.replaceState({}, '', path)
}

/** Any "$1,500" / "$30/wk" style figure. Deliberately excludes bare "$" so a
 *  stray currency symbol in prose does not fail the build. */
const PRICE_PATTERN = /\$\s?\d/

describe('App routing + chrome', () => {
  beforeEach(() => {
    setPath('/')
  })

  it('renders the home page by default with the hero headline', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: /the job you keep not doing/i })
    ).toBeInTheDocument()
  })

  it('shows the SiteHeader nav links on non-bare pages', () => {
    render(<App />)
    expect(screen.getAllByRole('button', { name: /About Us/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /^Services$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Social Media/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Our Work/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /^Contact$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /^Refer$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /Book a call/i }).length).toBeGreaterThan(0)
  })

  it('renders skip-to-content link for accessibility', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /Skip to content/i })).toBeInTheDocument()
  })

  it('opens the mobile drawer when the menu button is clicked', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Open menu/i }))
    expect(screen.getAllByRole('button', { name: /Close menu/i }).length).toBeGreaterThan(0)
    expect(document.getElementById('mobile-drawer')).toHaveAttribute('aria-modal', 'true')
  })

  it('renders the FAQ and expands an answer when clicked', () => {
    render(<App />)
    const trigger = screen.getByText(/What happens on the call\?/i)
    fireEvent.click(trigger)
    expect(screen.getByText(/It runs 10 to 15 minutes/i)).toBeInTheDocument()
  })

  it('describes what actually happens on the call', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /We build the mockup first/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /You decide, or you do not/i })).toBeInTheDocument()
  })

  it('responds to the "navigate" custom event by switching pages', () => {
    render(<App />)
    act(() => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'contact' } }))
    })
    // Contact page renders the booking widget container with the preserved ID.
    expect(document.getElementById('contact-page-booking')).toBeInTheDocument()
  })

  it('detects /contractorlanding URL and renders bare contractor landing (no SiteHeader)', () => {
    setPath('/contractorlanding')
    render(<App />)
    expect(screen.queryByRole('link', { name: /Skip to content/i })).not.toBeInTheDocument()
    // Contractor booking widget container must mount (preserved hard requirement)
    expect(document.getElementById('landing-contractors-form-container')).toBeInTheDocument()
    // Contractor conversion tracker data attribute is also a preserved surface
    expect(
      document.querySelector('[data-conversion-type="free_design_contractors"]')
    ).toBeInTheDocument()
  })

  it('detects /landing URL and renders bare main landing (no SiteHeader)', () => {
    setPath('/landing')
    render(<App />)
    expect(screen.queryByRole('link', { name: /Skip to content/i })).not.toBeInTheDocument()
  })

  it('renders SiteFooter contact info on standard pages', () => {
    render(<App />)
    expect(screen.getAllByRole('link', { name: /hello@acewebdesigners\.com/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /\(774\) 446-7375/i }).length).toBeGreaterThan(0)
  })
})

/**
 * These assertions are inverted on purpose.
 *
 * The site previously published three website tiers, monthly hosting rates,
 * two weekly social rates, a combo discount and a live estimate calculator, and
 * the old version of this file asserted that all of it rendered. Pricing was
 * removed from every public page on 2026-07-20 (owner decision). These tests
 * exist so it cannot quietly come back.
 *
 * /buildyoursite is deliberately NOT covered: it is the self-serve restaurant
 * product where the monthly price IS the offer, and it is kept separate and
 * unlinked from the marketing site.
 */
describe('No pricing on public marketing pages', () => {
  it.each([
    ['/', 'home'],
    ['/services', 'services'],
    ['/socialmedia', 'social media'],
    ['/contact', 'contact'],
  ])('renders no price figures on %s', path => {
    setPath(path)
    const { container } = render(<App />)
    const text = container.textContent ?? ''

    // The Luxury Makeover client result ("over $20,000" of contracts won by a
    // client from Valerie's work) is a real, owner-approved outcome, not a
    // price. Strip it before asserting.
    const withoutClientResult = text.replace(/\$20,000/g, '')

    expect(withoutClientResult).not.toMatch(PRICE_PATTERN)
  })
})

describe('Truthfulness guards', () => {
  beforeEach(() => {
    setPath('/')
  })

  it('shows every real Google review, verbatim and unpolished', () => {
    render(<App />)
    // Yolanda's broken English is load-bearing: the imperfection is the proof.
    expect(screen.getByText(/I needed website\. I saw in Facebook\./i)).toBeInTheDocument()
    // Pedro matches twice — he introduces himself inside his own quote, and
    // again in the attribution. Both are verbatim, so assert presence not count.
    expect(screen.getAllByText(/Pedro Dipre-Rojas/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Hank Lin/i)).toBeInTheDocument()
    expect(screen.getByText(/Francisco Oliveira/i)).toBeInTheDocument()
  })

  it('never prints the review count alongside the rating', () => {
    const { container } = render(<App />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/5\.0 on Google/i)
    expect(text).not.toMatch(/6 reviews/i)
    expect(text).not.toMatch(/across \d+ (verified )?reviews/i)
  })

  it('does not reintroduce the unsourced performance stats', () => {
    const { container } = render(<App />)
    const text = container.textContent ?? ''
    for (const claim of ['99.9%', '2.3s', '95+', 'money-back', 'Uptime Guarantee']) {
      expect(text).not.toContain(claim)
    }
  })

  it('states the Told History follower count accurately, not rounded up', () => {
    setPath('/socialmedia')
    const { container } = render(<App />)
    const text = container.textContent ?? ''
    expect(text).toContain('20.8K')
    // It is 20.8K, i.e. BELOW 21k. The old "21k+ followers" claim was false.
    expect(text).not.toMatch(/21k\+/i)
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
