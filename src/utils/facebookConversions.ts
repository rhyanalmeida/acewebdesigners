// Facebook Conversions API (Offline Conversions) utility
// Sends conversion events server-side for more reliable tracking

const FB_ACCESS_TOKEN = 'EAAIIvHD8ehIBQeSvkpUh4iKNIjKYcWT66q5ZBnRGNMTdsg6xLnF7ZCBCroMujfYzyrudg5IZAtEaEMho6bNUbiDZCt0eoO5dFbpBCmZARb74hmI9lo0xpgrbSKdRITl1JGaZBGJ8NVRMbwx1X0aZC8TJWTIoTkWSZAaSS7JgGrkrDKn7FzlkPoJ8iu59s0iSwqwBnAZDZD'
const CONTRACTOR_PIXEL_ID = '4230021860577001'
const MAIN_PIXEL_ID = '1703925480259996'

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
