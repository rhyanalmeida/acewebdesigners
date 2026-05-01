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
 * Track a standard Facebook event.
 * Pass eventId to dedupe with a matching server-side CAPI event.
 */
export function trackEvent(
  eventName: string,
  options?: TrackEventOptions,
  eventId?: string
): void {
  if (!isPixelLoaded()) {
    console.warn('⚠️ Facebook Pixel not loaded. Cannot track event:', eventName)
    return
  }

  try {
    if (eventId) {
      window.fbq('track', eventName, options, { eventID: eventId })
    } else {
      window.fbq('track', eventName, options)
    }
    console.log(`✅ Facebook Pixel: ${eventName} tracked`, options, eventId ? `(eventID=${eventId})` : '')
  } catch (error) {
    console.error('❌ Error tracking event:', eventName, error)
  }
}

/**
 * Track a custom Facebook event.
 * Pass eventId to dedupe with a matching server-side CAPI event.
 */
export function trackCustomEvent(
  eventName: string,
  options?: TrackEventOptions,
  eventId?: string
): void {
  if (!isPixelLoaded()) {
    console.warn('⚠️ Facebook Pixel not loaded. Cannot track custom event:', eventName)
    return
  }

  try {
    if (eventId) {
      window.fbq('trackCustom', eventName, options, { eventID: eventId })
    } else {
      window.fbq('trackCustom', eventName, options)
    }
    console.log(`✅ Facebook Pixel: Custom event ${eventName} tracked`, options, eventId ? `(eventID=${eventId})` : '')
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
 * Track Lead event (for form submissions / bookings).
 * Pass eventId for CAPI dedup.
 */
export function trackLead(
  contentName: string,
  contentCategory: string,
  eventId?: string
): void {
  trackEvent(
    'Lead',
    {
      content_name: contentName,
      content_category: contentCategory,
    },
    eventId
  )
}

/**
 * Track CompleteRegistration event (for completed bookings).
 * Pass eventId for CAPI dedup.
 */
export function trackCompleteRegistration(
  contentName: string,
  contentCategory: string,
  value: number = 0,
  eventId?: string
): void {
  trackEvent(
    'CompleteRegistration',
    {
      content_name: contentName,
      content_category: contentCategory,
      currency: 'USD',
      value,
    },
    eventId
  )
}

/**
 * Track booking completion with all relevant events.
 * Pass eventId to dedupe these client-side events with the server-side
 * Meta CAPI call that fires from the GHL webhook.
 */
export function trackBookingComplete(
  source: 'main' | 'contractor',
  additionalData?: TrackEventOptions,
  eventId?: string
): void {
  const config = source === 'contractor' ? CONTRACTOR_PIXEL : MAIN_PIXEL
  const contentName = source === 'contractor' ? 'Contractor Booking' : 'Main Landing Booking'
  const contentCategory = source === 'contractor' ? 'Contractor Consultation' : 'Website Consultation'

  console.log(`✅ ${config.name}: Booking detected!`)

  trackCompleteRegistration(contentName, contentCategory, 0, eventId)
  trackLead(contentName, contentCategory, eventId)

  const customEventName = source === 'contractor' ? 'ContractorBookingComplete' : 'MainLandingBookingComplete'
  trackCustomEvent(
    customEventName,
    {
      content_name: contentName,
      content_category: contentCategory,
      currency: 'USD',
      value: 0,
      ...additionalData,
    },
    eventId
  )

  console.log(`✅ ${config.name}: All booking events sent`)
}

/**
 * Track a phone-call click as a client-side audience signal only.
 *
 * Architecture note: Meta `Lead` and all offline conversions flow exclusively
 * through GoHighLevel (the booking form → GHL contact → workflow webhook →
 * `ghl-capi.ts` → Meta CAPI). Phone clicks happen outside GHL, so we
 * intentionally do NOT fire `Lead` here — that would double-count when the
 * caller also books, and it would create offline conversions outside the
 * canonical GHL pipeline. We fire only a custom `PhoneClick` event so Meta can
 * use it for retargeting / lookalike audiences without polluting Lead totals.
 *
 * If a call turns into a real lead, the operator adds the contact in GHL and
 * the existing workflow fires the proper CAPI Lead event from the GHL bridge.
 */
export function trackPhoneClick(
  source: 'home' | 'main_landing' | 'contractor' | 'contact' | 'about' | 'social' | 'work' | 'reviews' | 'header' | 'footer' | string,
): void {
  trackCustomEvent('PhoneClick', {
    content_name: 'Phone Call Click',
    content_category: 'Phone Signal',
    source,
  })
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
