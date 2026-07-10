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

import { CONTRACTOR_PIXEL, RESTAURANT_PIXEL } from '../config/pixels'

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
 * Track a standard event on the browser pixel with a shared `event_id`.
 *
 * The same `event_id` is sent server-side by our Edge Functions' CAPI call, so
 * Meta dedupes the browser + server event into one conversion. Pass a stable id
 * (e.g. crypto.randomUUID()) and use the identical value in the matching request
 * body (`lead` for Lead, `book` for Schedule).
 */
export function trackDedupedEvent(name: string, eventId: string, options?: TrackEventOptions): void {
  if (!isPixelLoaded()) {
    console.warn(`⚠️ Facebook Pixel not loaded. Cannot track ${name}.`)
    return
  }
  try {
    window.fbq('track', name, options ?? {}, { eventID: eventId })
    console.log(`✅ Facebook Pixel: ${name} tracked (event_id=${eventId})`)
  } catch (error) {
    console.error(`❌ Error tracking ${name}:`, error)
  }
}

/** Lead — fired at the gate-form step; deduped with the `lead` function's CAPI Lead. */
export function trackLead(eventId: string, options?: TrackEventOptions): void {
  trackDedupedEvent('Lead', eventId, options)
}

/** Schedule — fired when a slot is booked; deduped with the `book` function's CAPI Schedule. */
export function trackSchedule(eventId: string, options?: TrackEventOptions): void {
  trackDedupedEvent('Schedule', eventId, options)
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
 * Conversions (Lead/Schedule/CompleteRegistration/Purchase) flow through our own
 * server-side Conversions API. Phone clicks aren't a booking, so we intentionally
 * do NOT fire a conversion here — that would double-count when the caller also
 * books. We fire only a custom `PhoneClick` event for retargeting / lookalikes.
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
 * Ensure the Meta Pixel SDK (fbevents.js) is present. index.html loads it on
 * every page, but isolated-funnel pages call this defensively before init'ing
 * their own pixel in case they're hit before the global snippet runs.
 */
function ensureFbqSdk(): void {
  if (typeof window === 'undefined' || window.fbq) return

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

/**
 * Initialize the contractor-specific pixel (its own isolated funnel).
 * index.html skips the main pixel on /contractorlanding so only this one fires.
 */
export function initializeContractorPixel(): void {
  ensureFbqSdk()
  initializePixel(CONTRACTOR_PIXEL.pixelId)
}

/**
 * Initialize the restaurant-specific pixel (its own isolated funnel).
 * index.html skips the main pixel on /buildyoursite so only this one fires.
 */
export function initializeRestaurantPixel(): void {
  ensureFbqSdk()
  initializePixel(RESTAURANT_PIXEL.pixelId)
}
