import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../../App'

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
})

describe('App Component', () => {
  it('renders homepage by default', () => {
    render(<App />)
    
    expect(screen.getByText(/Small Business Web Design That Converts/)).toBeInTheDocument()
    expect(screen.getByText(/GET MY FREE DESIGN NOW!/)).toBeInTheDocument()
  })

  it('navigates to different pages', () => {
    render(<App />)
    
    // Navigate to services
    fireEvent.click(screen.getByText('Services'))
    // Note: Since this is a SPA with state management, we'd need to check for content changes
    
    // Navigate to about
    fireEvent.click(screen.getByText('About Us'))
    
    // Navigate to contact
    fireEvent.click(screen.getByText('Contact'))
  })

  it('displays trust signals', () => {
    render(<App />)
    
    expect(screen.getByText('100+')).toBeInTheDocument()
    expect(screen.getByText('5.0')).toBeInTheDocument()
    expect(screen.getByText('1-3')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('shows performance metrics', () => {
    render(<App />)
    
    expect(screen.getByText('2.3s')).toBeInTheDocument()
    expect(screen.getByText('Average Load Time')).toBeInTheDocument()
    expect(screen.getByText('99.9%')).toBeInTheDocument()
    expect(screen.getByText('Uptime Guarantee')).toBeInTheDocument()
  })

  it('displays industry sections', () => {
    render(<App />)
    
    expect(screen.getByText('Small Restaurants & Food Service')).toBeInTheDocument()
    expect(screen.getByText('Small Construction Companies')).toBeInTheDocument()
    expect(screen.getByText('Small Healthcare Practices')).toBeInTheDocument()
  })

  it('shows FAQ section with expandable items', () => {
    render(<App />)
    
    const faqQuestion = screen.getByText('How much does a website cost?')
    expect(faqQuestion).toBeInTheDocument()
    
    // Click to expand FAQ
    fireEvent.click(faqQuestion)
    
    expect(screen.getByText(/Our websites start at \$200/)).toBeInTheDocument()
  })

  it('displays testimonials', () => {
    render(<App />)
    
    expect(screen.getByText('Mike Chen')).toBeInTheDocument()
    expect(screen.getByText('Hot Pot One (Small Restaurant)')).toBeInTheDocument()
    expect(screen.getByText(/40% increase in online orders/)).toBeInTheDocument()
  })

  it('has mobile menu functionality', () => {
    render(<App />)
    
    // Find mobile menu button (should be hidden on desktop but present in DOM)
    const mobileMenuButton = screen.getByLabelText('Toggle menu')
    expect(mobileMenuButton).toBeInTheDocument()
    
    // Click mobile menu
    fireEvent.click(mobileMenuButton)
    
    // Menu should open (we can check for state changes or class changes)
  })

  it('renders calculator section', () => {
    render(<App />)
    
    expect(screen.getByText('Estimate Your Website Cost')).toBeInTheDocument()
    expect(screen.getByText('How many pages do you need?')).toBeInTheDocument()
  })

  it('shows process steps', () => {
    render(<App />)
    
    expect(screen.getByText('Discovery Call')).toBeInTheDocument()
    expect(screen.getByText('Free Design Mockup')).toBeInTheDocument()
    expect(screen.getByText('Development & Build')).toBeInTheDocument()
    expect(screen.getByText('Launch & Support')).toBeInTheDocument()
  })
})

