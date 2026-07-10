# 📅 LeadConnector Calendar Widget - Testing Guide

## ✅ Pre-Deployment Checklist

### 1. Code Implementation Status
- ✅ **CSP Updated** - All LeadConnector/msgsndr domains whitelisted with wildcards
- ✅ **form_embed.js Script** - Loaded in `index.html` (line 744)
- ✅ **Iframe Implemented** - Both landing pages have the widget
- ✅ **Mobile Optimizations** - CSS rules for responsive display
- ✅ **Height Settings** - 800px desktop, 900px mobile minimum
- ✅ **Facebook Pixel** - Separate pixels for each landing page

---

## 🧪 Testing Procedure

### Step 1: Check for CSP Errors (CRITICAL)

**Desktop:**
1. Open Chrome DevTools (F12)
2. Go to **Console** tab
3. Visit: `https://acewebdesigners.netlify.app/`
4. Look for any **red errors** mentioning:
   - "Content Security Policy"
   - "Refused to load"
   - "blocked by CSP"

**Expected Result:** ✅ NO CSP errors

**If you see CSP errors:**
- Take a screenshot
- Note which domain is being blocked
- The CSP needs to be updated

---

### Step 2: Verify Calendar Widget Loads

**Main Landing Page:**
1. Visit: `https://acewebdesigners.netlify.app/`
2. Scroll down to "Book Your Free Design Mockup Call"
3. Look for the booking calendar widget

**Contractor Landing Page:**
1. Visit: `https://acewebdesigners.netlify.app/contractorlanding`
2. Scroll down to "Book Your Free Design Call"
3. Look for the booking calendar widget

**Expected Result:** 
✅ Calendar widget displays with:
- Available time slots
- Date picker
- Booking form
- No blank white space
- No "loading..." stuck forever

---

### Step 3: Test Calendar Functionality

**Desktop Test:**
1. Click on an available date
2. Select a time slot
3. Fill in your information:
   - Name
   - Email
   - Phone number
4. Click "Schedule Event" or "Book Appointment"

**Expected Result:**
✅ Booking completes successfully
✅ Confirmation message appears
✅ No errors in console

**Mobile Test (iPhone/Android):**
1. Open on mobile browser
2. Repeat the booking process
3. Check that:
   - Calendar is fully visible
   - Date picker works
   - Form fields are tappable
   - Keyboard doesn't cover inputs
   - Can scroll within the widget

**Expected Result:**
✅ Smooth mobile experience
✅ No layout issues
✅ Widget is fully functional

---

### Step 4: Verify Facebook Pixel Tracking

The browser pixel fires **audience events only** — PageView, ViewContent, PhoneClick.
Conversions (Lead / CompleteRegistration / Purchase) are sent server-side by GHL's native
Meta Conversion API action, NOT by the browser. Verify the browser side like this:

**Main Landing (Pixel `1703925480259996`) / Contractor (Pixel `4230021860577001`):**
1. Open DevTools → Console, type `window.fbq` → should show `function()`.
2. Open DevTools → Network, filter `facebook.com/tr`.
3. Reload → you should see `PageView` and `ViewContent` fire (and `PhoneClick` on a phone-link click).
4. You should NOT see `Lead` / `CompleteRegistration` from the browser — those come from GHL.

**Expected Result:**
✅ Facebook Pixel loaded
✅ PageView / ViewContent fire (audiences); no browser-side Lead
✅ No errors in console

> Verify the actual conversions in **Meta Events Manager → Test Events** — see `docs/META_ADS.md`.

---

## 🔍 Common Issues & Solutions

### Issue 1: Calendar Not Showing (Blank White Space)

**Possible Causes:**
- CSP blocking resources
- Iframe height too small
- Script not loaded

**Solutions:**
1. Check browser console for CSP errors
2. Verify `form_embed.js` script loaded (Network tab)
3. Check iframe has `min-height: 800px`

---

### Issue 2: Calendar Loads But Cuts Off

**Possible Causes:**
- Iframe height too small
- CSS overflow hidden

**Solutions:**
1. Increase iframe `minHeight` in code
2. Check CSS for `overflow: hidden` on containers
3. Verify mobile CSS rules

---

### Issue 3: Can't Click/Interact with Calendar

**Possible Causes:**
- Z-index issues
- Pointer-events disabled
- Iframe not properly loaded

**Solutions:**
1. Check CSS for `pointer-events: none`
2. Verify iframe `src` URL is correct
3. Check for overlapping elements

---

### Issue 4: Mobile Calendar Too Small

**Possible Causes:**
- Mobile CSS not applied
- Viewport meta tag missing

**Solutions:**
1. Check `src/index.css` mobile media queries
2. Verify viewport meta tag in `index.html`
3. Test on actual device (not just browser resize)

---

### Issue 5: Booking Doesn't Complete

**Possible Causes:**
- GHL calendar settings
- Form validation errors
- Network issues

**Solutions:**
1. Check GHL calendar is active
2. Verify calendar ID: `MseWjwAf3rDlJRoj1p75`
3. Check browser console for errors
4. Try different time slot

---

## 📱 Mobile Testing Checklist

### iOS (Safari)
- [ ] Calendar displays fully
- [ ] Can select date
- [ ] Can select time
- [ ] Form fields work
- [ ] Keyboard doesn't cover inputs
- [ ] Can submit booking
- [ ] Confirmation shows

### Android (Chrome)
- [ ] Calendar displays fully
- [ ] Can select date
- [ ] Can select time
- [ ] Form fields work
- [ ] Keyboard doesn't cover inputs
- [ ] Can submit booking
- [ ] Confirmation shows

### Tablet (iPad/Android)
- [ ] Calendar displays fully
- [ ] Touch interactions work
- [ ] Layout looks good
- [ ] Can complete booking

---

## 🖥️ Desktop Testing Checklist

### Chrome
- [ ] No CSP errors
- [ ] Calendar loads
- [ ] Can complete booking
- [ ] Facebook Pixel fires

### Firefox
- [ ] No CSP errors
- [ ] Calendar loads
- [ ] Can complete booking
- [ ] Facebook Pixel fires

### Safari
- [ ] No CSP errors
- [ ] Calendar loads
- [ ] Can complete booking
- [ ] Facebook Pixel fires

### Edge
- [ ] No CSP errors
- [ ] Calendar loads
- [ ] Can complete booking
- [ ] Facebook Pixel fires

---

## 🎯 Quick Visual Check

**What the calendar SHOULD look like:**
- ✅ Full calendar grid visible
- ✅ Month/Year selector at top
- ✅ Available dates highlighted
- ✅ Time slots show when date selected
- ✅ Form fields below calendar
- ✅ "Book" or "Schedule" button visible
- ✅ Professional GHL branding

**What indicates a PROBLEM:**
- ❌ Blank white space
- ❌ "Loading..." forever
- ❌ Partial calendar (cut off)
- ❌ No time slots available
- ❌ Can't click anything
- ❌ Error messages
- ❌ Console errors (red text)

---

## 🔧 Developer Tools Commands

### Check if Facebook Pixel is loaded:
```javascript
window.fbq
// Should return: function()
```

### Verify audience events fire (Network tab):
```javascript
// DevTools → Network → filter "facebook.com/tr", then reload.
// Expect ev=PageView and ev=ViewContent. There should be NO ev=Lead from the browser —
// conversions are sent server-side by GHL. (The old testFacebookDirectly() /
// testContractorPixel() console helpers were removed in the GHL-native migration.)
```

### Check if form_embed.js loaded:
```javascript
// Go to Network tab → Filter "form_embed"
// Should show: form_embed.js (Status: 200)
```

### Check iframe loaded:
```javascript
document.getElementById('contractor-booking-widget')
// Should return: <iframe> element
```

---

## 📊 Expected Console Output (No Errors)

**Good Console Output:**
```
✅ Facebook Pixel confirmed loaded
✅ LeadConnector booking widget loaded on Main Landing page
📨 Message event received: {...}
✅ LeadConnector iframe loaded successfully
```

**Bad Console Output (Needs Fixing):**
```
❌ Refused to load script 'https://link.msgsndr.com/...' because it violates CSP
❌ Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
⚠️ WARNING: Facebook Pixel not detected
```

---

## 🚀 Final Deployment Checklist

Before marking as complete:
- [ ] No CSP errors on either landing page
- [ ] Calendar widget visible on main landing
- [ ] Calendar widget visible on contractor landing
- [ ] Can complete test booking on desktop
- [ ] Can complete test booking on mobile
- [ ] Facebook Pixel tracking works
- [ ] No console errors
- [ ] Tested on at least 2 browsers
- [ ] Tested on at least 1 mobile device

---

## 📞 Support

If issues persist after following this guide:

1. **Check Netlify Deploy Logs**
   - Ensure latest code deployed
   - No build errors

2. **Verify GHL Calendar Settings**
   - Calendar ID: `MseWjwAf3rDlJRoj1p75`
   - Calendar is active
   - Time slots available

3. **Browser Cache**
   - Clear cache and hard reload (Ctrl+Shift+R)
   - Try incognito/private mode

4. **Network Issues**
   - Check internet connection
   - Try different network
   - Disable VPN if active

---

**Last Updated:** June 1, 2026  
**Calendar Widget:** LeadConnector/GoHighLevel  
**Calendar ID:** MseWjwAf3rDlJRoj1p75  
**Iframe ID:** contractor-booking-widget
