/**
 * BookingWidget Component
 * 
 * A reusable, properly configured LeadConnector booking widget.
 * This component handles:
 * - Proper iframe configuration for mobile and desktop
 * - Mobile-responsive height using mobileMinHeight config
 * - Loading states with timeout fallback
 * - Error handling with retry functionality
 * - Booking event detection
 * 
 * Usage:
 * ```tsx
 * <BookingWidget 
 *   calendarConfig={MAIN_CALENDAR}
 *   onBookingComplete={() => console.log('Booking completed!')}
 * />
 * ```
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { CalendarConfig } from '../config/calendars'
import { appendAttributionToUrl, stashAttribution } from '../utils/attribution'

interface BookingWidgetProps {
  /** Calendar configuration from config/calendars.ts */
  calendarConfig: CalendarConfig
  /** Optional callback when a booking is completed */
  onBookingComplete?: () => void
  /** Optional additional className for the container */
  className?: string
  /** Optional container ID for CSS targeting */
  containerId?: string
}

// Loading timeout in milliseconds (10 seconds)
const LOADING_TIMEOUT_MS = 10000

/**
 * BookingWidget - A properly configured LeadConnector booking iframe
 */
export const BookingWidget: React.FC<BookingWidgetProps> = ({
  calendarConfig,
  onBookingComplete,
  className = '',
  containerId,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Inject attribution (event_id, fbc, fbp, fbclid) into the GHL iframe URL so
  // GHL captures them as custom fields on the contact. These flow through to
  // the server-side Meta CAPI call, enabling dedup with the client-side Pixel.
  const iframeSrc = useMemo(
    () => appendAttributionToUrl(calendarConfig.url),
    [calendarConfig.url],
  )

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on mount
    checkMobile()
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate effective min height based on device
  const effectiveMinHeight = isMobile 
    ? calendarConfig.mobileMinHeight 
    : calendarConfig.minHeight

  // Loading timeout - show fallback if widget takes too long
  useEffect(() => {
    if (isLoaded || hasError) return

    const timeoutId = setTimeout(() => {
      if (!isLoaded && !hasError) {
        console.warn(`⚠️ BookingWidget loading timeout after ${LOADING_TIMEOUT_MS}ms`)
        setLoadingTimedOut(true)
      }
    }, LOADING_TIMEOUT_MS)

    return () => clearTimeout(timeoutId)
  }, [isLoaded, hasError, retryCount])

  // Retry loading the widget
  const handleRetry = useCallback(() => {
    setIsLoaded(false)
    setHasError(false)
    setLoadingTimedOut(false)
    setRetryCount(prev => prev + 1)
    
    // Force iframe reload by updating src
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src
      iframeRef.current.src = ''
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc
        }
      }, 100)
    }
  }, [])

  // Handle booking completion detection via postMessage
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Diagnostic: log EVERY postMessage so we can capture the actual shapes
      // GHL sends, including ones rejected by the origin filter. The earlier
      // detection logic only logged AFTER the origin check passed, which made
      // it impossible to tell whether a missing detection was an origin issue
      // or a payload-shape issue. Toggle off later when stable.
      const fromGhl =
        event.origin.includes('leadconnectorhq.com') ||
        event.origin.includes('msgsndr.com')
      console.log(
        `🔬 postMessage origin=${event.origin} fromGhl=${fromGhl}`,
        event.data,
      )

      // Stash to a window-global ring buffer so we can dump after a booking
      // attempt: `JSON.stringify(window.__bookingWidgetMessages, null, 2)`.
      try {
        const w = window as unknown as { __bookingWidgetMessages?: unknown[] }
        if (!w.__bookingWidgetMessages) w.__bookingWidgetMessages = []
        w.__bookingWidgetMessages.push({
          ts: Date.now(),
          origin: event.origin,
          data: event.data,
        })
        if (w.__bookingWidgetMessages.length > 200) w.__bookingWidgetMessages.shift()
      } catch {
        /* ignore */
      }

      // Only process messages from LeadConnector/GoHighLevel
      if (!fromGhl) return

      let isBooking = false
      let matchedPattern = ''

      if (event.data && typeof event.data === 'object') {
        // Check multiple possible event patterns. Tag which one matched so we
        // can see in the console log what triggered the booking flow (or didn't).
        const d = event.data as Record<string, unknown> & {
          message?: { type?: string }
        }
        if (d.type === 'booking_completed') { isBooking = true; matchedPattern = 'type=booking_completed' }
        else if (d.type === 'appointment_scheduled') { isBooking = true; matchedPattern = 'type=appointment_scheduled' }
        else if (d.event === 'booking_completed') { isBooking = true; matchedPattern = 'event=booking_completed' }
        else if (d.event === 'appointment_scheduled') { isBooking = true; matchedPattern = 'event=appointment_scheduled' }
        else if (d.type === 'form_submitted') { isBooking = true; matchedPattern = 'type=form_submitted' }
        else if (d.type === 'calendar_booking') { isBooking = true; matchedPattern = 'type=calendar_booking' }
        else if (d.event === 'form_submitted') { isBooking = true; matchedPattern = 'event=form_submitted' }
        else if (d.event === 'calendar_booking') { isBooking = true; matchedPattern = 'event=calendar_booking' }
        else if (d.message?.type === 'booking_completed') { isBooking = true; matchedPattern = 'message.type=booking_completed' }
        else if (typeof d.action === 'string' && d.action.includes('book')) { isBooking = true; matchedPattern = `action~book (${d.action})` }
      }

      // Also check string messages
      if (typeof event.data === 'string') {
        const lowerData = event.data.toLowerCase()
        if (
          lowerData.includes('booking') ||
          lowerData.includes('appointment') ||
          lowerData.includes('scheduled') ||
          lowerData.includes('confirmed')
        ) {
          console.log('🔍 Possible booking message (string):', event.data)
          isBooking = true
          matchedPattern = `string-includes (${event.data.slice(0, 80)})`
        }
      }

      if (isBooking) {
        console.log(`✅ Booking detected via pattern: ${matchedPattern}`)
        // Push attribution to server-side stash so the CAPI function can merge
        // fbc/fbp/event_id when the GHL webhook fires shortly after. Email and
        // contact_id are best-effort — postMessage shape varies by GHL widget
        // version; the server falls back to ip+ua correlation if missing.
        const data = (event.data || {}) as Record<string, unknown>
        const contact = (data.contact || (data.message as Record<string, unknown> | undefined)?.contact || {}) as Record<string, unknown>
        const email =
          (typeof contact.email === 'string' ? contact.email : '') ||
          (typeof data.email === 'string' ? data.email : '')
        const contact_id =
          (typeof contact.id === 'string' ? contact.id : '') ||
          (typeof data.contactId === 'string' ? data.contactId : '')
        stashAttribution({ email, contact_id })

        if (onBookingComplete) {
          console.log('✅ Booking detected! Calling onBookingComplete callback.')
          onBookingComplete()
        }
      }
    },
    [onBookingComplete]
  )

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoaded(true)
    setHasError(false)
    setLoadingTimedOut(false)
    console.log(`✅ LeadConnector iframe loaded: ${calendarConfig.name}`)
  }, [calendarConfig.name])

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setHasError(true)
    setLoadingTimedOut(false)
    console.error(`❌ LeadConnector iframe failed to load: ${calendarConfig.name}`)
  }, [calendarConfig.name])

  // Set up message listener
  useEffect(() => {
    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [handleMessage])

  // Debug log on mount
  useEffect(() => {
    console.log(`📅 BookingWidget mounted: ${calendarConfig.name}`)
    console.log(`   URL: ${calendarConfig.url}`)
    console.log(`   Iframe ID: ${calendarConfig.iframeId}`)
    console.log(`   Mobile: ${isMobile}, Height: ${effectiveMinHeight}px`)
  }, [calendarConfig, isMobile, effectiveMinHeight])

  return (
    <div
      id={containerId}
      className={`booking-widget-container ${className}`}
      style={{ position: 'relative', minHeight: `${effectiveMinHeight}px` }}
    >
      {/* Loading state */}
      {!isLoaded && !hasError && !loadingTimedOut && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl"
          style={{ minHeight: effectiveMinHeight }}
        >
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading booking calendar...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Loading timeout state - widget is taking too long */}
      {!isLoaded && !hasError && loadingTimedOut && (
        <div
          className="flex items-center justify-center bg-yellow-50 rounded-2xl border-2 border-yellow-200"
          style={{ minHeight: effectiveMinHeight }}
        >
          <div className="text-center p-8">
            <p className="text-yellow-700 font-semibold mb-2">Taking longer than expected...</p>
            <p className="text-gray-600 mb-4">The booking calendar is still loading. You can wait or try reloading.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
              >
                Tap to Reload
              </button>
              <a
                href="tel:+17744467375"
                className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors"
              >
                Call (774) 446-7375
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div
          className="flex items-center justify-center bg-red-50 rounded-2xl border-2 border-red-200"
          style={{ minHeight: effectiveMinHeight }}
        >
          <div className="text-center p-8">
            <p className="text-red-600 font-semibold mb-2">Failed to load booking calendar</p>
            <p className="text-gray-600 mb-4">Please try again or contact us directly.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <a
                href="tel:+17744467375"
                className="inline-block bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors"
              >
                Call (774) 446-7375
              </a>
            </div>
          </div>
        </div>
      )}

      {/* LeadConnector booking widget iframe */}
      <iframe
        key={retryCount} // Force re-render on retry
        ref={iframeRef}
        src={iframeSrc}
        id={calendarConfig.iframeId}
        title={`Book ${calendarConfig.name}`}
        style={{
          width: '100%',
          border: 'none',
          minHeight: `${effectiveMinHeight}px`,
          height: 'auto',
          display: isLoaded && !hasError ? 'block' : 'none',
        }}
        scrolling="yes"
        allow="payment"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  )
}

export default BookingWidget
