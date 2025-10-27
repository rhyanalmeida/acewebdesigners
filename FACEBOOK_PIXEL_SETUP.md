# Facebook Pixel Setup Guide

## Current Configuration

**Pixel ID**: `670701952528812`  
**Status**: Installed and Active  
**Tracking**: All pages + Landing page + Calendly conversions

## What's Configured

### 1. Facebook Pixel Base Code
- **Location**: `index.html` (lines 383-403)
- Initializes Pixel ID 670701952528812
- Tracks PageView events on all pages
- Includes debugging logs in console

### 2. Calendly Event Tracking
- **Location**: `index.html` (lines 406-432)
- Listens for `calendly.event_scheduled` events
- Fires 3 events on booking completion:
  1. `CompleteRegistration` - Main conversion event
  2. `Lead` - Qualified lead tracking
  3. `Contact` - Contact event

### 3. Content Security Policy
- **Location**: `index.html` (line 29)
- Allows Facebook scripts:
  - `https://connect.facebook.net` (fbevents.js)
  - `https://www.facebook.com` (iwl.js and tracking pixels)

### 4. Landing Page Tracking
- **Location**: `src/Landing.tsx`
- Fires custom `LandingPageView` event on landing page visits

## How to Verify Tracking

### Step 1: Check Live Site
1. Visit https://acewebdesigners.com
2. Open browser console (F12)
3. Look for: "Facebook Pixel loaded successfully - ID: 670701952528812"
4. Check for any CSP errors (should be none)

### Step 2: Test in Facebook Events Manager
1. Go to https://business.facebook.com/events_manager
2. Select Pixel: `670701952528812`
3. Click "Test Events" tab
4. Click "Test server events"
5. Enter your website URL
6. Visit the site - events should appear in real-time

### Step 3: Test Manual Event
In browser console, run:
```javascript
fbq('track', 'Contact');
```
Check Events Manager for the Contact event appearing.

### Step 4: Test Calendly Booking
1. Go to landing page with Calendly widget
2. Complete a test booking
3. Console should show: "Calendly booking completed!"
4. Check Events Manager for 3 events:
   - CompleteRegistration
   - Lead
   - Contact

## Events Tracked

| Event Name | When Fires | Where |
|------------|-----------|-------|
| `PageView` | All page loads | index.html |
| `LandingPageView` | Landing page visit | src/Landing.tsx |
| `CompleteRegistration` | Calendly booking | index.html (listener) |
| `Lead` | Calendly booking | index.html (listener) |
| `Contact` | Calendly booking | index.html (listener) |

## Troubleshooting

### Pixel Not Detected by Facebook
1. Wait 24-48 hours for Facebook to crawl the site
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh the page (Ctrl+F5)
4. Try incognito/private window
5. Install Facebook Pixel Helper Chrome extension

### CSP Errors in Console
1. Verify deployed site has updated CSP
2. Check Netlify deployment logs
3. Ensure dist/index.html includes www.facebook.com
4. Test in different browser

### Events Not Firing
1. Check console for JavaScript errors
2. Verify `window.fbq` is defined: `console.log(window.fbq)`
3. Disable ad blockers temporarily
4. Verify Calendly widget loads properly
5. Check Events Manager Test Events tab

## Deployment

The pixel is automatically deployed via Netlify when changes are pushed to the `master` branch.

### Manual Deployment
```bash
npm run build
git add .
git commit -m "Deploy Facebook Pixel updates"
git push origin master
```

## Custom Conversions Setup

To track landing page conversions in Facebook Ads:

1. Go to Events Manager → Custom Conversions
2. Click "Create custom conversion"
3. Configure:
   - **Name**: "Landing Page Booking"
   - **Event**: `CompleteRegistration`
   - **URL**: Contains `/landing`
   - **Category**: "Lead"
4. Save and use in ad campaigns

## Support

If tracking still doesn't work after following this guide:

1. Check Netlify deployment is live
2. Verify Pixel ID in Events Manager
3. Use Facebook Pixel Helper extension
4. Test in different browser
5. Contact Facebook support with Pixel ID: 670701952528812

## Last Updated
January 2025 - Pixel ID 670701952528812

