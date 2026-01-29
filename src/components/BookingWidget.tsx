/**
 * BookingWidget Component
 * 
 * A reusable, properly configured LeadConnector booking widget.
 * This component handles:
 * - Proper iframe configuration for mobile and desktop
 * - Loading states
 * - Error handling
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
    console.log(`✅ LeadConnector iframe loaded: ${calendarConfig.name}`)
  }, [calendarConfig.name])

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setHasError(true)
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
  }, [calendarConfig])

  return (
    <div
      id={containerId}
      className={`booking-widget-container ${className}`}
      style={{ position: 'relative' }}
    >
      {/* Loading state */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl"
          style={{ minHeight: calendarConfig.minHeight }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading booking calendar...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div
          className="flex items-center justify-center bg-red-50 rounded-2xl border-2 border-red-200"
          style={{ minHeight: calendarConfig.minHeight }}
        >
          <div className="text-center p-8">
            <p className="text-red-600 font-semibold mb-2">Failed to load booking calendar</p>
            <p className="text-gray-600 mb-4">Please try refreshing the page or contact us directly.</p>
            <a
              href="tel:+17744467375"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
            >
              Call (774) 446-7375
            </a>
          </div>
        </div>
      )}

      {/* LeadConnector booking widget iframe */}
      <iframe
        ref={iframeRef}
        src={calendarConfig.url}
        id={calendarConfig.iframeId}
        title={`Book ${calendarConfig.name}`}
        style={{
          width: '100%',
          border: 'none',
          overflow: 'hidden',
          minHeight: `${calendarConfig.minHeight}px`,
          height: '100%',
          display: isLoaded && !hasError ? 'block' : 'none',
        }}
        scrolling="no"
        allow="payment"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  )
}

export default BookingWidget
