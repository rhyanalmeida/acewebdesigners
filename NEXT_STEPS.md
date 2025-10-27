# Next Steps to Complete Facebook Conversions API Setup

## Immediate Actions Required:

### 1. Add Facebook Access Token to Netlify
1. Login to [Netlify](https://app.netlify.com)
2. Go to your site → **Site settings** → **Environment variables**
3. Add: `FACEBOOK_ACCESS_TOKEN` = `EAAIIvHD8ehIBPZBceEzqxpi27ZA7PDEzYB5IM4g5LKiZBPIt8TpmihZBqPPzxGZCKuw8eqvegg8SVzDbuC3PGLGRMFLGZCkhQMT0lnwaBaE4Sfso3MN86hT8PZCk3H2M8ImZAEN0wZCsq4ZCQ3XrZBmwmi9jWmCwimFQCuwVAv7x0GbKFwEjZC64bDBfhZC2EZAl0EuinWOAZDZD`
4. Save and **Redeploy**

### 2. Complete Contact.tsx Update
The Contact page still needs the server-side tracking code added. See Landing.tsx lines 76-102 for reference.

### 3. Install Dependencies
Run: `npm install` to install the new `@netlify/functions` package

### 4. Push Changes
```bash
git add .
git commit -m "Add Facebook Conversions API server-side tracking"
git push origin master
```

### 5. Test After Deploy
1. Open site in incognito
2. Open DevTools Console
3. Complete a test booking
4. Look for: "✅ Server-side CompleteRegistration sent"

---

**See FACEBOOK_CONVERSIONS_API_SETUP.md for complete documentation.**

