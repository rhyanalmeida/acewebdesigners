/**
 * Facebook Conversions API (Offline Conversions) utility
 * 
 * SECURITY WARNING: 
 * - The Conversions API should ideally be called from a BACKEND SERVER, not client-side
 * - Access tokens should NEVER be exposed in client-side code
 * - For production, set up a Netlify Function or backend endpoint to handle these calls
 * 
 * This file now uses import.meta.env for the access token which should be set as:
 * - VITE_FB_ACCESS_TOKEN in your .env file (for local development)
 * - Set in Netlify/hosting environment variables (for production)
 * 
 * NOTE: Client-side Conversions API calls may not work due to CORS.
 * The browser-based pixel tracking (fbq) is the primary tracking method.
 * This is a fallback for server-side tracking which should be set up separately.
 */

import { CONTRACTOR_PIXEL, MAIN_PIXEL } from '../config/pixels'

// Access token should be set via environment variable for security
// In production, this should be called from a backend function
const FB_ACCESS_TOKEN = import.meta.env.VITE_FB_ACCESS_TOKEN || ''

// Use centralized pixel configuration
const CONTRACTOR_PIXEL_ID = CONTRACTOR_PIXEL.pixelId
const MAIN_PIXEL_ID = MAIN_PIXEL.pixelId

interface ConversionEventData {
  eventName: string
  eventTime: number
  eventSourceUrl: string
  actionSource: string
  userData?: {
    client_ip_address?: string
    client_user_agent?: string
    fbp?: string
    fbc?: string
  }
  customData?: {
    content_name?: string
    content_category?: string
    currency?: string
    value?: number
  }
}

/**
 * Send conversion event to Facebook Conversions API
 * @param pixelId - Facebook Pixel ID
 * @param eventData - Event data to send
 */
export async function sendOfflineConversion(
  pixelId: string,
  eventData: ConversionEventData
): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events`

    // Get Facebook browser cookies if available
    const fbp = getCookie('_fbp')
    const fbc = getCookie('_fbc')

    // Prepare event data
    const payload = {
      data: [
        {
          event_name: eventData.eventName,
          event_time: eventData.eventTime,
          event_source_url: eventData.eventSourceUrl,
          action_source: eventData.actionSource,
          user_data: {
            client_ip_address: eventData.userData?.client_ip_address,
            client_user_agent: eventData.userData?.client_user_agent || navigator.userAgent,
            fbp: fbp || eventData.userData?.fbp,
            fbc: fbc || eventData.userData?.fbc,
          },
          custom_data: eventData.customData || {},
        },
      ],
      access_token: FB_ACCESS_TOKEN,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Facebook Conversions API error:', errorData)
      return false
    }

    const result = await response.json()
    console.log('✅ Offline conversion sent successfully:', result)
    return true
  } catch (error) {
    console.error('❌ Error sending offline conversion:', error)
    return false
  }
}

/**
 * Track contractor landing page booking via Conversions API
 */
export async function trackContractorBooking(customData?: {
  content_name?: string
  content_category?: string
}): Promise<void> {
  const eventData: ConversionEventData = {
    eventName: 'CompleteRegistration',
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: window.location.href,
    actionSource: 'website',
    customData: {
      content_name: customData?.content_name || 'Contractor Booking',
      content_category: customData?.content_category || 'Contractor Consultation',
      currency: 'USD',
      value: 0,
    },
  }

  await sendOfflineConversion(CONTRACTOR_PIXEL_ID, eventData)

  // Also send Lead event
  const leadEventData: ConversionEventData = {
    eventName: 'Lead',
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: window.location.href,
    actionSource: 'website',
    customData: {
      content_name: customData?.content_name || 'Contractor Consultation Booking',
      content_category: customData?.content_category || 'Free Contractor Consultation',
    },
  }

  await sendOfflineConversion(CONTRACTOR_PIXEL_ID, leadEventData)
}

/**
 * Track main landing page booking via Conversions API
 */
export async function trackMainLandingBooking(customData?: {
  content_name?: string
  content_category?: string
}): Promise<void> {
  const eventData: ConversionEventData = {
    eventName: 'CompleteRegistration',
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: window.location.href,
    actionSource: 'website',
    customData: {
      content_name: customData?.content_name || 'Main Landing Booking',
      content_category: customData?.content_category || 'Website Consultation',
      currency: 'USD',
      value: 0,
    },
  }

  await sendOfflineConversion(MAIN_PIXEL_ID, eventData)

  // Also send Lead event
  const leadEventData: ConversionEventData = {
    eventName: 'Lead',
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: window.location.href,
    actionSource: 'website',
    customData: {
      content_name: customData?.content_name || 'Website Consultation Booking',
      content_category: customData?.content_category || 'Free Design Consultation',
    },
  }

  await sendOfflineConversion(MAIN_PIXEL_ID, leadEventData)
}

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

/**
 * Test offline conversion - for debugging
 */
export async function testOfflineConversion(pixelId: string): Promise<void> {
  console.log('🧪 Testing offline conversion...')
  
  const testEventData: ConversionEventData = {
    eventName: 'CompleteRegistration',
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: window.location.href,
    actionSource: 'website',
    customData: {
      content_name: 'TEST Offline Conversion',
      content_category: 'Test',
      currency: 'USD',
      value: 0,
    },
  }

  const success = await sendOfflineConversion(pixelId, testEventData)
  
  if (success) {
    alert('✅ Test offline conversion sent! Check Facebook Events Manager.')
  } else {
    alert('❌ Failed to send test conversion. Check console for errors.')
  }
}
