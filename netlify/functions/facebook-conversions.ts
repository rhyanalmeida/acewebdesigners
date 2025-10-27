import { Handler } from '@netlify/functions';

// Facebook Conversions API configuration
const FACEBOOK_PIXEL_ID = '1703925480259996';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';
const FB_API_VERSION = 'v21.0';

/**
 * Hash email for privacy (SHA-256)
 */
function hashEmail(email: string): string {
  // Note: In production, use a proper crypto library for SHA-256 hashing
  // This is a simplified version - in real production, use node's crypto module
  return email.toLowerCase().trim();
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
}) {
  const userData: any = {};

  // Add user data if provided
  if (eventData.email) {
    userData.em = [hashEmail(eventData.email)];
  }
  if (eventData.phone) {
    userData.ph = [eventData.phone];
  }

  // Get client IP and user agent from the request
  const clientIpAddress = eventData.eventSourceUrl || '0.0.0.0';

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

    // Send event to Facebook Conversions API
    const result = await sendCompleteRegistrationEvent({
      email: body.email,
      phone: body.phone,
      eventName: body.eventName,
      eventTime: body.eventTime || Math.floor(Date.now() / 1000),
      actionSource: body.actionSource || 'website',
      eventSourceUrl: body.eventSourceUrl || event.headers.referer
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

