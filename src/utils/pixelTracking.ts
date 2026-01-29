/**
 * Facebook Pixel Tracking Utility
 * 
 * Provides type-safe, centralized functions for Facebook Pixel tracking.
 * This eliminates code duplication and provides consistent event tracking.
 */

import { MAIN_PIXEL, CONTRACTOR_PIXEL, type PixelConfig } from '../config/pixels'

// Import types (these are declared globally in types/facebook.d.ts)
type TrackEventOptions = {
  content_name?: string
  content_category?: string
  content_type?: string
  currency?: string
  value?: number
  [key: string]: unknown
}

/**
 * Check if Facebook Pixel is loaded and available
 */
export function isPixelLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function'
}

/**
 * Initialize a Facebook Pixel
 * @param pixelId - The pixel ID to initialize
 */
export function initializePixel(pixelId: string): void {
  if (!isPixelLoaded()) {
    console.warn('⚠️ Facebook Pixel not loaded. Cannot initialize:', pixelId)
    return
  }

  try {
    window.fbq('init', pixelId)
    window.fbq('track', 'PageView')
    console.log(`✅ Facebook Pixel (${pixelId}): Initialized and tracking`)
  } catch (error) {
    console.error('❌ Error initializing Facebook Pixel:', error)
  }
}

/**
 * Track a standard Facebook event
 */
export function trackEvent(eventName: string, options?: TrackEventOptions): void {
  if (!isPixelLoaded()) {
    console.warn('⚠️ Facebook Pixel not loaded. Cannot track event:', eventName)
    return
  }

  try {
    window.fbq('track', eventName, options)
    console.log(`✅ Facebook Pixel: ${eventName} tracked`, options)
  } catch (error) {
    console.error('❌ Error tracking event:', eventName, error)
  }
}

/**
 * Track a custom Facebook event
 */
export function trackCustomEvent(eventName: string, options?: TrackEventOptions): void {
  if (!isPixelLoaded()) {
    console.warn('⚠️ Facebook Pixel not loaded. Cannot track custom event:', eventName)
    return
  }

  try {
    window.fbq('trackCustom', eventName, options)
    console.log(`✅ Facebook Pixel: Custom event ${eventName} tracked`, options)
  } catch (error) {
    console.error('❌ Error tracking custom event:', eventName, error)
  }
}

/**
 * Track ViewContent event (for landing pages)
 */
export function trackViewContent(contentName: string, contentCategory: string, contentType: string): void {
  trackEvent('ViewContent', {
    content_name: contentName,
    content_category: contentCategory,
    content_type: contentType,
  })
}

/**
 * Track Lead event (for form submissions / bookings)
 */
export function trackLead(contentName: string, contentCategory: string): void {
  trackEvent('Lead', {
    content_name: contentName,
    content_category: contentCategory,
  })
}

/**
 * Track CompleteRegistration event (for completed bookings)
 */
export function trackCompleteRegistration(
  contentName: string,
  contentCategory: string,
  value: number = 0
): void {
  trackEvent('CompleteRegistration', {
    content_name: contentName,
    content_category: contentCategory,
    currency: 'USD',
    value,
  })
}

/**
 * Track booking completion with all relevant events
 * This is the main function to call when a booking is completed
 */
export function trackBookingComplete(
  source: 'main' | 'contractor',
  additionalData?: TrackEventOptions
): void {
  const config = source === 'contractor' ? CONTRACTOR_PIXEL : MAIN_PIXEL
  const contentName = source === 'contractor' ? 'Contractor Booking' : 'Main Landing Booking'
  const contentCategory = source === 'contractor' ? 'Contractor Consultation' : 'Website Consultation'

  console.log(`✅ ${config.name}: Booking detected!`)

  // Track CompleteRegistration (standard event for ads)
  trackCompleteRegistration(contentName, contentCategory, 0)

  // Track Lead event
  trackLead(contentName, contentCategory)

  // Track custom event specific to the source
  const customEventName = source === 'contractor' ? 'ContractorBookingComplete' : 'MainLandingBookingComplete'
  trackCustomEvent(customEventName, {
    content_name: contentName,
    content_category: contentCategory,
    currency: 'USD',
    value: 0,
    ...additionalData,
  })

  console.log(`✅ ${config.name}: All booking events sent`)
}

/**
 * Initialize contractor-specific pixel
 * This is called on the contractor landing page to load their separate pixel
 */
export function initializeContractorPixel(): void {
  if (typeof window === 'undefined') return

  // Load Facebook Pixel SDK if not already loaded
  if (!window.fbq) {
    const f = window as unknown as Record<string, unknown>
    const n = (f.fbq = function (...args: unknown[]) {
      const fbq = n as unknown as { callMethod?: (...args: unknown[]) => void; queue: unknown[] }
      if (fbq.callMethod) {
        fbq.callMethod(...args)
      } else {
        fbq.queue.push(args)
      }
    }) as unknown as typeof window.fbq

    if (!f._fbq) f._fbq = n as unknown as typeof window._fbq
    ;(n as unknown as { push: typeof Array.prototype.push }).push = (n as unknown as unknown[]).push.bind(n)
    ;(n as unknown as { loaded: boolean }).loaded = true
    ;(n as unknown as { version: string }).version = '2.0'
    ;(n as unknown as { queue: unknown[] }).queue = []

    const t = document.createElement('script')
    t.async = true
    t.src = 'https://connect.facebook.net/en_US/fbevents.js'
    const s = document.getElementsByTagName('script')[0]
    s.parentNode?.insertBefore(t, s)
  }

  // Initialize contractor pixel
  initializePixel(CONTRACTOR_PIXEL.pixelId)
}

/**
 * Create testing functions for the window object (for debugging)
 */
export function setupTestingFunctions(source: 'main' | 'contractor'): void {
  if (typeof window === 'undefined') return

  const config = source === 'contractor' ? CONTRACTOR_PIXEL : MAIN_PIXEL
  const testFnName = source === 'contractor' ? 'testContractorPixel' : 'testMainPixel'

  ;(window as unknown as Record<string, unknown>)[testFnName] = () => {
    console.log('🧪 Manual pixel test triggered')

    if (!isPixelLoaded()) {
      console.error('❌ Facebook Pixel not loaded')
      alert('Facebook Pixel not loaded!')
      return
    }

    trackCompleteRegistration(`TEST ${config.name}`, 'Test Consultation', 0)
    console.log(`✅ Test event sent to ${config.name} (${config.pixelId})`)
    alert('Test event sent! Check Meta Events Manager.')
  }

  console.log('🧪 Testing commands available:')
  console.log(`  - ${testFnName}() - Manually test Facebook Pixel (browser)`)
}
