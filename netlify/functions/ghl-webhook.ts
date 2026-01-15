import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

// Facebook Conversions API Configuration
const FB_ACCESS_TOKEN = 'EAAIIvHD8ehIBQeSvkpUh4iKNIjKYcWT66q5ZBnRGNMTdsg6xLnF7ZCBCroMujfYzyrudg5IZAtEaEMho6bNUbiDZCt0eoO5dFbpBCmZARb74hmI9lo0xpgrbSKdRITl1JGaZBGJ8NVRMbwx1X0aZC8TJWTIoTkWSZAaSS7JgGrkrDKn7FzlkPoJ8iu59s0iSwqwBnAZDZD'
const CONTRACTOR_PIXEL_ID = '4230021860577001'
const MAIN_PIXEL_ID = '1703925480259996'

// Webhook security (optional but recommended)
const WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET || 'your-secret-key-here'

interface GHLWebhookPayload {
  type?: string
  contact?: {
    id?: string
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    name?: string
  }
  appointment?: {
    id?: string
    calendarId?: string
    title?: string
    startTime?: string
    status?: string
  }
  locationId?: string
  [key: string]: any
}

/**
 * Send conversion event to Facebook Conversions API
 */
async function sendFacebookConversion(
  pixelId: string,
  eventName: string,
  userData: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    clientIpAddress?: string
    clientUserAgent?: string
  },
  customData?: Record<string, any>
): Promise<any> {
  try {
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events`

    // Hash email and phone for privacy (Facebook requirement)
    const hashedEmail = userData.email ? await hashSHA256(userData.email.toLowerCase().trim()) : undefined
    const hashedPhone = userData.phone ? await hashSHA256(userData.phone.replace(/[^0-9]/g, '')) : undefined

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: 'https://acewebdesigners.com',
          user_data: {
            em: hashedEmail,
            ph: hashedPhone,
            fn: userData.firstName ? await hashSHA256(userData.firstName.toLowerCase().trim()) : undefined,
            ln: userData.lastName ? await hashSHA256(userData.lastName.toLowerCase().trim()) : undefined,
            client_ip_address: userData.clientIpAddress,
            client_user_agent: userData.clientUserAgent,
          },
          custom_data: customData || {},
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

    const result = await response.json()

    if (!response.ok) {
      console.error('Facebook Conversions API error:', result)
      return { success: false, error: result }
    }

    console.log('✅ Facebook conversion sent successfully:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error sending Facebook conversion:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Hash string with SHA-256 (required by Facebook for PII)
 */
async function hashSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * Determine which pixel to use based on appointment/calendar info
 */
function determinePixelId(payload: GHLWebhookPayload): string {
  // You can customize this logic based on your GHL setup
  // For example, different calendars for different landing pages
  
  const calendarId = payload.appointment?.calendarId || ''
  const locationId = payload.locationId || ''
  
  // Example: If you have specific calendar IDs for contractor vs main landing
  // if (calendarId === 'YOUR_CONTRACTOR_CALENDAR_ID') {
  //   return CONTRACTOR_PIXEL_ID
  // }
  
  // Default to contractor pixel (you can change this logic)
  // You might want to add a custom field in GHL to specify which pixel to use
  return CONTRACTOR_PIXEL_ID
}

/**
 * Main webhook handler
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('🔔 GHL Webhook received')

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    // Parse webhook payload
    const payload: GHLWebhookPayload = JSON.parse(event.body || '{}')
    
    console.log('📦 Webhook payload:', JSON.stringify(payload, null, 2))

    // Validate webhook (optional security check)
    const webhookSecret = event.headers['x-webhook-secret'] || event.headers['authorization']
    if (webhookSecret && webhookSecret !== WEBHOOK_SECRET && webhookSecret !== `Bearer ${WEBHOOK_SECRET}`) {
      console.error('❌ Invalid webhook secret')
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      }
    }

    // Check if this is an appointment booking event
    const isAppointmentEvent = 
      payload.type === 'AppointmentCreate' ||
      payload.type === 'appointment.created' ||
      payload.type === 'CalendarAppointmentBooked' ||
      payload.appointment?.status === 'confirmed' ||
      (payload.type && payload.type.toLowerCase().includes('appointment'))

    if (!isAppointmentEvent) {
      console.log('ℹ️ Not an appointment event, skipping')
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Event received but not an appointment' }),
      }
    }

    // Extract contact information
    const contact = payload.contact || {}
    const appointment = payload.appointment || {}
    
    const email = contact.email || ''
    const phone = contact.phone || ''
    const firstName = contact.firstName || contact.name?.split(' ')[0] || ''
    const lastName = contact.lastName || contact.name?.split(' ').slice(1).join(' ') || ''

    // Get client IP and user agent from webhook headers
    const clientIpAddress = event.headers['x-forwarded-for']?.split(',')[0] || event.headers['client-ip']
    const clientUserAgent = event.headers['user-agent']

    // Determine which pixel to use
    const pixelId = determinePixelId(payload)
    const isContractor = pixelId === CONTRACTOR_PIXEL_ID

    console.log(`📊 Sending to ${isContractor ? 'Contractor' : 'Main'} Pixel: ${pixelId}`)

    // Prepare custom data
    const customData = {
      content_name: isContractor ? 'Contractor Booking via GHL' : 'Main Landing Booking via GHL',
      content_category: isContractor ? 'Contractor Consultation' : 'Website Consultation',
      appointment_id: appointment.id,
      calendar_id: appointment.calendarId,
      appointment_title: appointment.title,
      currency: 'USD',
      value: 0,
    }

    // Send CompleteRegistration event
    const registrationResult = await sendFacebookConversion(
      pixelId,
      'CompleteRegistration',
      {
        email,
        phone,
        firstName,
        lastName,
        clientIpAddress,
        clientUserAgent,
      },
      customData
    )

    // Send Lead event
    const leadResult = await sendFacebookConversion(
      pixelId,
      'Lead',
      {
        email,
        phone,
        firstName,
        lastName,
        clientIpAddress,
        clientUserAgent,
      },
      {
        ...customData,
        content_name: isContractor ? 'Contractor Consultation Booking' : 'Website Consultation Booking',
      }
    )

    console.log('✅ Webhook processed successfully')

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Webhook processed successfully',
        pixelId,
        events: {
          registration: registrationResult,
          lead: leadResult,
        },
      }),
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: String(error),
      }),
    }
  }
}
