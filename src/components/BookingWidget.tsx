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

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { CalendarConfig } from '../config/calendars'

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
      // Only process messages from LeadConnector/GoHighLevel
      if (
        !event.origin.includes('leadconnectorhq.com') &&
        !event.origin.includes('msgsndr.com')
      ) {
        return
      }

      console.log('🎯 LeadConnector message detected:', event.data)

      let isBooking = false

      if (event.data && typeof event.data === 'object') {
        // Check multiple possible event patterns
        if (
          event.data.type === 'booking_completed' ||
          event.data.type === 'appointment_scheduled' ||
          event.data.event === 'booking_completed' ||
          event.data.event === 'appointment_scheduled' ||
          event.data.type === 'form_submitted' ||
          event.data.type === 'calendar_booking' ||
          event.data.event === 'form_submitted' ||
          event.data.event === 'calendar_booking' ||
          event.data.message?.type === 'booking_completed' ||
          (event.data.action && event.data.action.includes('book'))
        ) {
          isBooking = true
        }
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
        }
      }

      if (isBooking && onBookingComplete) {
        console.log('✅ Booking detected! Calling onBookingComplete callback.')
        onBookingComplete()
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
        src={calendarConfig.url}
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
