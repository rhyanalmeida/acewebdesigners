# Facebook Conversions API Setup Guide

This guide explains how to set up and use the Facebook Conversions API for tracking Calendly booking completions.

## Overview

We're using **dual-tracking** for maximum accuracy:
1. **Client-side**: Meta Pixel (already configured)
2. **Server-side**: Facebook Conversions API (this setup)

The Conversions API sends tracking data from your server, which is more reliable and accurate than client-side tracking alone.

## Setup Instructions

### Step 1: Get Your Facebook Access Token

1. Go to [Facebook Business](https://business.facebook.com/)
2. Navigate to **Events Manager**
3. Select your Pixel ID: `1703925480259996`
4. Go to **Settings** → **Conversions API**
5. Click **Generate Access Token**
6. Copy the access token (starts with `EAAI...`)

### Step 2: Add Access Token to Netlify

1. Log in to [Netlify](https://app.netlify.com/)
2. Go to your site → **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add:
   - **Key**: `FACEBOOK_ACCESS_TOKEN`
   - **Value**: Your access token from Step 1
5. Click **Save**

### Step 3: Redeploy Your Site

After adding the environment variable, you need to redeploy:

1. Go to **Deploys** in Netlify
2. Click **Trigger deploy** → **Deploy site**

## How It Works

### When a User Books Through Calendly:

1. **Client-side pixel** fires immediately (in the browser)
   - Tracks: `CompleteRegistration` and `Lead` events
   - Pixel ID: `1703925480259996`

2. **Server-side API** also fires (more reliable)
   - Sends event to `https://graph.facebook.com/v21.0/{PIXEL_ID}/events`
   - Includes user data (email, phone if available from Calendly)
   - Helps Facebook deduplicate and improve attribution

### Benefits of Dual Tracking:

✅ **Better attribution** - Facebook knows which ads drove bookings  
✅ **Privacy-compliant** - Server-side tracking works without cookies  
✅ **More accurate** - Reduces ad blockers' impact  
✅ **Better optimization** - Facebook's algorithm gets more data  
✅ **Lower costs** - More data = better targeting = lower CPC

## Testing

### Test Your Setup:

1. Open your site in an incognito window
2. Open Developer Tools → Console
3. Complete a test Calendly booking
4. Look for these console messages:
   ```
   ✅ CompleteRegistration & Lead events sent to Facebook Pixel successfully!
   ✅ Server-side CompleteRegistration sent to Facebook Conversions API!
   ```

### Verify in Facebook Events Manager:

1. Go to **Events Manager** → **Test Events**
2. You should see both:
   - Pixel events (client-side)
   - Conversions API events (server-side)

## Troubleshooting

### Events Not Showing?

1. **Check access token**: Make sure `FACEBOOK_ACCESS_TOKEN` is set in Netlify
2. **Check function logs**: Go to Netlify → Functions → View logs
3. **Check browser console**: Look for error messages
4. **Verify Calendly data**: Check if email/phone is being passed

### Access Token Expired?

Facebook access tokens can expire. If events stop working:
1. Go to Events Manager
2. Generate a new access token
3. Update the token in Netlify environment variables
4. Redeploy your site

## Support

If you need help:
- Check Facebook's [Conversions API documentation](https://developers.facebook.com/docs/marketing-api/conversions-api)
- View function logs in Netlify
- Test events in Facebook Events Manager

---

**Note**: Never commit your access token to Git. Always store it in environment variables.

