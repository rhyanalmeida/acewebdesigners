# GoHighLevel Webhook Setup Guide

This guide will help you connect your GoHighLevel (GHL) account to automatically track appointment bookings in Facebook Events Manager.

---

## 🎯 What This Does

When someone books an appointment through your GHL calendar widget, this webhook will:
1. ✅ Receive the booking data from GHL
2. ✅ Send conversion events to Facebook Conversions API
3. ✅ Track both `CompleteRegistration` and `Lead` events
4. ✅ Include customer data (email, phone, name) for better attribution

---

## 📍 Step 1: Get Your Webhook URL

After deploying this site to Netlify, your webhook URL will be:

```
https://YOUR-SITE-NAME.netlify.app/.netlify/functions/ghl-webhook
```

**Example:**
```
https://acewebdesigners.netlify.app/.netlify/functions/ghl-webhook
```

---

## 🔧 Step 2: Configure Webhook in GoHighLevel

### Option A: Using GHL Webhooks (Recommended)

1. **Log into your GHL account**

2. **Navigate to Settings → Integrations → Webhooks**
   - Or go directly to: `https://app.gohighlevel.com/location/[YOUR_LOCATION_ID]/settings/integrations/webhooks`

3. **Click "Add Webhook"**

4. **Configure the webhook:**
   - **Name:** `Facebook Conversions - Appointments`
   - **Webhook URL:** `https://YOUR-SITE-NAME.netlify.app/.netlify/functions/ghl-webhook`
   - **Method:** `POST`
   - **Events to trigger:** Select these events:
     - ✅ `Appointment Created`
     - ✅ `Appointment Confirmed` (if available)
     - ✅ `Calendar Appointment Booked`
   
5. **Add Custom Header (Optional but Recommended for Security):**
   - **Header Name:** `X-Webhook-Secret`
   - **Header Value:** `your-secret-key-here` (use a strong random string)

6. **Save the webhook**

### Option B: Using GHL Workflows (Alternative)

1. **Go to Automation → Workflows**

2. **Create a new workflow:**
   - **Trigger:** `Appointment Booked` or `Appointment Created`

3. **Add Action:** `Webhook`
   - **Webhook URL:** `https://YOUR-SITE-NAME.netlify.app/.netlify/functions/ghl-webhook`
   - **Method:** `POST`
   - **Body Type:** `JSON`
   - **Body:** Use GHL's dynamic fields to send appointment data

4. **Save and activate the workflow**

---

## 🔐 Step 3: Secure Your Webhook (Optional but Recommended)

To prevent unauthorized requests to your webhook:

1. **Generate a strong secret key** (random string, at least 32 characters)
   
2. **Add it to Netlify Environment Variables:**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add: `GHL_WEBHOOK_SECRET` = `your-secret-key-here`

3. **Add the same secret to GHL webhook headers:**
   - In GHL webhook settings, add custom header:
   - `X-Webhook-Secret: your-secret-key-here`

---

## 📊 Step 4: Configure Pixel Routing (Optional)

By default, all bookings go to the **Contractor Pixel** (`4230021860577001`).

To route different calendars to different pixels:

1. **Open:** `netlify/functions/ghl-webhook.ts`

2. **Find the `determinePixelId` function** (around line 95)

3. **Customize the logic:**

```typescript
function determinePixelId(payload: GHLWebhookPayload): string {
  const calendarId = payload.appointment?.calendarId || ''
  
  // Route based on calendar ID
  if (calendarId === 'YOUR_CONTRACTOR_CALENDAR_ID') {
    return CONTRACTOR_PIXEL_ID // 4230021860577001
  }
  
  if (calendarId === 'YOUR_MAIN_LANDING_CALENDAR_ID') {
    return MAIN_PIXEL_ID // 1703925480259996
  }
  
  // Default to contractor pixel
  return CONTRACTOR_PIXEL_ID
}
```

4. **Find your Calendar IDs in GHL:**
   - Go to Calendars → Click on a calendar → Check the URL
   - The ID is in the URL: `https://app.gohighlevel.com/location/.../calendars/[CALENDAR_ID]`

---

## 🧪 Step 5: Test Your Webhook

### Method 1: Test Booking
1. Go to your landing page
2. Book a test appointment through the GHL widget
3. Check Netlify Function Logs:
   - Netlify Dashboard → Functions → `ghl-webhook` → Logs
4. Verify events in Facebook Events Manager

### Method 2: Manual Test with Postman/cURL

```bash
curl -X POST https://YOUR-SITE-NAME.netlify.app/.netlify/functions/ghl-webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret-key-here" \
  -d '{
    "type": "AppointmentCreate",
    "contact": {
      "email": "test@example.com",
      "phone": "+17743151951",
      "firstName": "John",
      "lastName": "Doe"
    },
    "appointment": {
      "id": "test-123",
      "calendarId": "test-calendar",
      "title": "Test Consultation",
      "status": "confirmed"
    }
  }'
```

---

## 📈 Step 6: Monitor in Facebook Events Manager

1. **Go to Facebook Events Manager:**
   - https://business.facebook.com/events_manager2/list/pixel/[YOUR_PIXEL_ID]/overview

2. **Check for events:**
   - Look for `CompleteRegistration` and `Lead` events
   - They should show as "Server" source (from Conversions API)

3. **Verify event details:**
   - Click on an event to see custom data
   - Should include appointment ID, calendar ID, etc.

---

## 🔍 Troubleshooting

### Webhook not receiving data?
- ✅ Check GHL webhook is active and URL is correct
- ✅ Verify the webhook is triggered on appointment events
- ✅ Check Netlify Function Logs for errors

### Events not showing in Facebook?
- ✅ Verify Facebook Access Token is valid
- ✅ Check Pixel IDs are correct
- ✅ Look for errors in Netlify Function Logs
- ✅ Ensure Facebook Events Manager has the correct pixel selected

### Getting 401 Unauthorized?
- ✅ Check webhook secret matches in both GHL and Netlify
- ✅ Verify environment variable `GHL_WEBHOOK_SECRET` is set in Netlify

### Events showing but not attributed to ads?
- ✅ This is normal - server-side events may take 24-48 hours to fully process
- ✅ Ensure you're also running the browser pixel for better attribution
- ✅ Check that email/phone data is being sent (helps with matching)

---

## 📋 Webhook Payload Examples

### GHL Appointment Created Event

```json
{
  "type": "AppointmentCreate",
  "locationId": "abc123",
  "contact": {
    "id": "contact-123",
    "email": "customer@example.com",
    "phone": "+17743151951",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe"
  },
  "appointment": {
    "id": "appt-456",
    "calendarId": "cal-789",
    "title": "Free Consultation",
    "startTime": "2026-01-15T14:00:00Z",
    "status": "confirmed"
  }
}
```

---

## 🚀 Deployment Checklist

- [ ] Webhook function deployed to Netlify
- [ ] Webhook URL configured in GHL
- [ ] Webhook secret set in both GHL and Netlify (optional)
- [ ] Test booking completed successfully
- [ ] Events visible in Facebook Events Manager
- [ ] Pixel routing configured (if using multiple pixels)
- [ ] Monitoring set up for function logs

---

## 📞 Support

If you encounter issues:

1. **Check Netlify Function Logs** - Most issues are visible here
2. **Check GHL Webhook Logs** - GHL shows webhook delivery status
3. **Check Facebook Events Manager** - Verify events are being received

---

## 🔄 Maintenance

- **Access Token Expiration:** Facebook access tokens may expire. If events stop sending, generate a new token and update `netlify/functions/ghl-webhook.ts`
- **GHL API Changes:** If GHL changes their webhook payload format, you may need to update the function

---

**Last Updated:** January 14, 2026
