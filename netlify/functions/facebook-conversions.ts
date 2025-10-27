import { Handler } from '@netlify/functions';
import crypto from 'crypto';

// Facebook Conversions API configuration
const FACEBOOK_PIXEL_ID = '1703925480259996';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';
const FB_API_VERSION = 'v21.0';

/**
 * Hash email for privacy (SHA-256) - REQUIRED by Facebook
 */
function hashEmail(email: string): string {
  // Normalize email: lowercase and trim whitespace
  const normalized = email.toLowerCase().trim();
  
  // Hash using SHA-256
  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
}

/**
 * Hash phone number for privacy (SHA-256) - REQUIRED by Facebook
 */
function hashPhone(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Hash using SHA-256
  return crypto
    .createHash('sha256')
    .update(digitsOnly)
    .digest('hex');
}

/**
 * Send CompleteRegistration event to Facebook Conversions API
 */
async function sendCompleteRegistrationEvent(eventData: {
  email?: string;
  phone?: string;
  eventName: string;
  eventTime: number;
  actionSource: string;
  eventSourceUrl?: string;
  clientUserAgent?: string;
  clientIpAddress?: string;
}) {
  const userData: any = {};

  // Add user data if provided (Facebook REQUIRES hashing)
  if (eventData.email) {
    userData.em = [hashEmail(eventData.email)];
  }
  if (eventData.phone) {
    userData.ph = [hashPhone(eventData.phone)];
  }

  // REQUIRED for website events: client_user_agent
  if (eventData.clientUserAgent) {
    userData.client_user_agent = eventData.clientUserAgent;
  }

  // REQUIRED for website events: client_ip_address  
  if (eventData.clientIpAddress) {
    userData.client_ip_address = eventData.clientIpAddress;
  }

  const payload = {
    data: [
      {
        event_name: eventData.eventName,
        event_time: eventData.eventTime,
        action_source: eventData.actionSource,
        event_source_url: eventData.eventSourceUrl || 'https://acewebdesigners.com',
        user_data: userData,
        custom_data: {
          content_name: 'Calendly Booking',
          content_category: 'Website Consultation',
          currency: 'USD',
          value: 0
        }
      }
    ],
    access_token: FACEBOOK_ACCESS_TOKEN
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/${FACEBOOK_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    
    return {
      success: response.ok,
      data,
      message: response.ok 
        ? 'Event sent successfully to Facebook Conversions API' 
        : 'Failed to send event to Facebook'
    };
  } catch (error) {
    console.error('Error sending to Facebook Conversions API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!body.eventName || !body.actionSource) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: eventName, actionSource' }),
      };
    }

    // Extract client information from headers (REQUIRED for Facebook Conversions API)
    const clientIpAddress = event.headers['x-forwarded-for']?.split(',')[0] 
      || event.headers['x-nf-client-connection-ip'] 
      || event.clientContext?.ip 
      || '0.0.0.0';
    
    const clientUserAgent = event.headers['user-agent'] || '';

    // Send event to Facebook Conversions API
    const result = await sendCompleteRegistrationEvent({
      email: body.email,
      phone: body.phone,
      eventName: body.eventName,
      eventTime: body.eventTime || Math.floor(Date.now() / 1000),
      actionSource: body.actionSource || 'website',
      eventSourceUrl: body.eventSourceUrl || event.headers.referer || event.headers.referrer,
      clientUserAgent: clientUserAgent,
      clientIpAddress: clientIpAddress
    });

    if (result.success) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: result.message,
          data: result.data
        }),
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: result.error || 'Failed to send event'
        }),
      };
    }
  } catch (error) {
    console.error('Error in facebook-conversions handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

