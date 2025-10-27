# Landing Page Tracking Setup for Facebook Pixel

## Summary
Your Facebook Pixel tracking is now fully configured for the `/landing` page with conversion tracking for Calendly bookings.

## What's Been Implemented

### 1. Facebook Pixel Base Code
- **Location**: `index.html` (lines 63-83)
- **Pixel ID**: `1703925480259996`
- Loads on every page, including the landing page
- Automatically tracks `PageView` events

### 2. Landing Page Specific Tracking
- **Location**: `src/Landing.tsx`
- Fires a custom event `LandingPageView` when users visit `/landing`
- Includes:
  - `page_path: '/landing'`
  - `page_source: 'ad_click'`
  - `content_name: 'Landing Page'`

### 3. Calendly Booking Tracking
- **Location**: `index.html` (lines 85-109)
- Automatically tracks when users complete a Calendly booking
- Fires TWO events:
  - `CompleteRegistration` - Marked as conversion in Facebook Ads
  - `Lead` - Tracks qualified leads

### 4. Test Function
You can test the tracking anytime by opening the browser console and running:
```javascript
testFacebookPixel()
```

This will fire:
- PageView event
- CompleteRegistration event
- Lead event
- Custom LandingPageView event

## Events Tracked on Landing Page

| Event Name | When It Fires | Purpose |
|------------|---------------|---------|
| `PageView` | Every page load | Standard Facebook Pixel event |
| `LandingPageView` | Landing page visit | Custom event for ad landing |
| `CompleteRegistration` | Calendly booking completion | Main conversion event |
| `Lead` | Calendly booking completion | Lead tracking |

## How to Verify It's Working

### Step 1: Check Browser Console
1. Visit your live site: https://acewebdesigners.com
2. Open browser console (F12)
3. Look for these messages:
   - `📊 Landing page loaded - Facebook Pixel ID: 1703925480259996`
   - `✅ Landing page custom event tracked`
   - `🧪 Facebook Pixel loaded successfully`

### Step 2: Check Facebook Events Manager
1. Go to https://business.facebook.com/events_manager
2. Select your Pixel (ID: 1703925480259996)
3. In the "Test Events" tab, perform these actions:
   - Visit the landing page
   - Run `testFacebookPixel()` in console
   - Complete a test Calendly booking
4. You should see events appearing in real-time

### Step 3: Create Facebook Custom Conversions
1. In Events Manager, go to "Datasets" → "Custom Conversions"
2. Create a custom conversion for:
   - **Event**: `CompleteRegistration`
   - **URL**: Contains `/landing`
   - **Value**: When booking completed

## Current Deployment
- ✅ Changes committed and pushed to GitHub
- ✅ Netlify will auto-deploy from master branch
- 🔄 Wait for deployment to complete (check Netlify dashboard)

## Troubleshooting

### Pixel Not Detected
If Facebook says "A pixel wasn't detected":
1. Wait 24-48 hours after deployment (Facebook needs to crawl)
2. Try the Test Events tool in Events Manager
3. Check browser console for errors

### Events Not Firing
1. Open browser console on your site
2. Run `testFacebookPixel()` to manually fire events
3. Check if `window.fbq` exists: type `window.fbq` in console
4. Look for console errors

### Common Issues
- **Ad blocker**: Disable extensions that block tracking
- **Privacy settings**: Some browsers block third-party scripts
- **Cache**: Clear browser cache and try again

## Next Steps
1. ✅ Wait for Netlify deployment to complete
2. ✅ Test on live site with browser console open
3. ✅ Verify events in Facebook Events Manager
4. ✅ Complete a test Calendly booking to confirm conversion tracking
5. ✅ Set up Facebook Custom Conversions for your ad campaigns

## Support
If events still aren't working after 24 hours:
1. Check Netlify deployment logs
2. Verify the pixel code is in the live HTML
3. Contact Facebook support with your Pixel ID: `1703925480259996`

