/**
 * Facebook Pixel Tracking Utility
 *
 * Type-safe, centralized helpers for the BROWSER pixel: audience signals
 * (PageView / ViewContent / PhoneClick) plus the booking `Lead`.
 *
 * `Lead` is dual-fired for best match + redundancy: the browser fires it with an
 * `event_id` (see trackLead) and our `book` Edge Function fires the SAME
 * `event_id` to the Conversions API server-side — Meta dedupes the pair. The
 * server is the source of truth (hashed PII, fbc/fbp); the browser event just
 * speeds up matching. CompleteRegistration / Purchase are server-only.
 */

import { CONTRACTOR_PIXEL } from '../config/pixels'

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
 * Track a custom Facebook event.
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
 * Track the booking `Lead` on the browser pixel with a shared `event_id`.
 *
 * The same `event_id` is sent server-side by the `book` Edge Function's CAPI
 * call, so Meta dedupes the browser + server Lead into one conversion. Pass a
 * stable id (e.g. crypto.randomUUID()) and use the identical value in the
 * `book` request body.
 */
export function trackLead(eventId: string, options?: TrackEventOptions): void {
  if (!isPixelLoaded()) {
    console.warn('⚠️ Facebook Pixel not loaded. Cannot track Lead.')
    return
  }
  try {
    window.fbq('track', 'Lead', options ?? {}, { eventID: eventId })
    console.log(`✅ Facebook Pixel: Lead tracked (event_id=${eventId})`)
  } catch (error) {
    console.error('❌ Error tracking Lead:', error)
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
 * Track a phone-call click as a client-side audience signal only.
 *
 * Architecture note: Meta `Lead` and all conversions flow exclusively through
 * GoHighLevel's native Facebook Conversions API workflow action (booking form →
 * GHL contact → workflow → Meta CAPI; GHL hashes the PII). Phone clicks happen
 * outside GHL, so we intentionally do NOT fire `Lead` here — that would
 * double-count when the caller also books. We fire only a custom `PhoneClick`
 * event so Meta can use it for retargeting / lookalike audiences.
 *
 * If a call turns into a real lead, the operator adds the contact in GHL and the
 * workflow fires the proper CAPI Lead event.
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
