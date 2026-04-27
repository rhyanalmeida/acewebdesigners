# Meta CAPI Integration Security Audit

**Date:** 2026-04-23
**Scope:** Migration of Meta Conversions API from browser to Netlify function
**Reviewer:** Automated code review

## Summary

The migration to the server-side Netlify function (`netlify/functions/ghl-capi.ts`) is well-implemented — PII is SHA-256 hashed, `fbc`/`fbp` are correctly left unhashed, dedup uses the client-provided `event_id`, and no hardcoded `EAA...` token exists in the repository. However, **the pre-migration client-side CAPI module was never deleted** and is still imported and executed from `Landing.tsx`, which re-introduces the exact risks the migration was meant to eliminate (token exposure in the client bundle, duplicate events, bypass of the server hashing).

---

## Findings

### CRITICAL-1: Residual client-side CAPI module still wired into Landing page
- **File:** `src/utils/facebookConversions.ts` (full file)
- **Callers:** `src/Landing.tsx:3`, `src/Landing.tsx:24` (`trackMainLandingBooking`), `src/Landing.tsx:71-73` (`testOfflineConversion` attached to `window`)
- **Type decl:** `src/types/facebook.d.ts:64` (`window.testOfflineConversion`)
- **Evidence:**
  - `src/utils/facebookConversions.ts:22` — `const FB_ACCESS_TOKEN = import.meta.env.VITE_FB_ACCESS_TOKEN || ''`
  - `src/utils/facebookConversions.ts:57` — `const url = \`https://graph.facebook.com/v18.0/${pixelId}/events\``
  - `src/utils/facebookConversions.ts:80` — `access_token: FB_ACCESS_TOKEN` sent in POST body
- **Impact:** Any Netlify env var prefixed `VITE_` is inlined into the production bundle by Vite. If `VITE_FB_ACCESS_TOKEN` is ever set (the comment at `src/utils/facebookConversions.ts:10-11` instructs the user to set it), the Meta CAPI token will ship to the browser verbatim. In addition, `Landing.tsx:24` fires a CAPI event on every main-site booking with **unhashed** user data (no email/phone hashing exists in this module — `user_data` only carries fbp/fbc/UA), which violates Meta's PII requirements and duplicates the server event (the server's fallback `event_id` at `ghl-capi.ts:172` will not match because this client call does not pass one).
- **Fix:** Delete `src/utils/facebookConversions.ts`, remove the import at `src/Landing.tsx:3`, delete the `trackMainLandingBooking(...)` call at `src/Landing.tsx:24-29`, delete the `window.testOfflineConversion` wiring at `src/Landing.tsx:71-74`, and remove the type declaration at `src/types/facebook.d.ts:64`.

### HIGH-1: Function endpoint has zero authentication and no shared-secret check
- **File:** `netlify/functions/ghl-capi.ts:102-122`
- **Evidence:** Handler accepts any POST with a JSON body; no header validation, no HMAC, no IP allowlist. An attacker who discovers the URL (which is guessable — `/.netlify/functions/ghl-capi`) can submit arbitrary events, poisoning your Meta pixel metrics and optimizing ad spend against fake conversions.
- **Fix:** Add a shared-secret check at the top of the handler, e.g. `if (event.headers['x-ghl-secret'] !== process.env.GHL_WEBHOOK_SECRET) return json(401, ...)`, and configure GHL to send that header on every webhook.

### HIGH-2: No input validation on body shape, types, or sizes
- **File:** `netlify/functions/ghl-capi.ts:117-168`
- **Evidence:** `pick()` (line 65) stringifies anything, including nested objects that will become `"[object Object]"`. No length caps on email/phone/names/UA/contact_id — a malicious caller can post a 1 MB field that is then SHA-256 hashed and forwarded. No shape check on `email` (missing `@` test) or `phone` (accepts empty string after `normPhone`). `value` accepts any numeric, including negatives.
- **Fix:** After the `pick()` calls (`ghl-capi.ts:135-165`), validate: `email` matches `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`, `phone` length 7–15 digits, all strings capped at 256 chars, `value >= 0`, and `event_id` length capped at 64 chars and matches `/^[A-Za-z0-9_-]+$/`.

### MEDIUM-1: Event-ID format drift between client and server fallback
- **Client:** `src/utils/attribution.ts:88` generates `uuid()` (RFC 4122 v4, e.g. `e4d9a0…-…`).
- **Server fallback:** `netlify/functions/ghl-capi.ts:172` generates `${action}_${contactId || 'anon'}_${eventTime}` (e.g. `lead_abc123_1714...`).
- **Impact:** When the client event_id successfully flows through GHL, dedup works. When it is lost (GHL field not populated, user blocked sessionStorage), the server builds an ID that the Pixel event cannot possibly match, so Meta will count both events and skew conversion data. Not critical because the client Pixel event at `src/utils/pixelTracking.ts:62` also passes the client event_id — but the two code paths disagree on the format.
- **Fix:** Either (a) have the server fallback use `crypto.randomUUID()` and accept that unmatched cases are not deduped (honest), or (b) have the client build an ID of the same shape when it has no UUID source. Pick one format and document it in a shared comment.

### LOW-1: Dead `testOfflineConversion` test helper attached to `window`
- **File:** `src/Landing.tsx:70-74`, `src/utils/facebookConversions.ts:195-218`, `src/types/facebook.d.ts:64`
- **Evidence:** Exposes `window.testOfflineConversion(pixelId)` in production, which calls `sendOfflineConversion` directly. Same root cause as CRITICAL-1; removing that file removes this too.
- **Fix:** Covered by the CRITICAL-1 deletion.

### LOW-2: `event_id` is logged in plaintext and returned in the HTTP response
- **File:** `netlify/functions/ghl-capi.ts:244`, `ghl-capi.ts:249`
- **Evidence:** The function log and the response body include `event_id` and `contact_id`. Netlify function logs are not publicly readable, but exposing `contact_id` in the HTTP response to an unauthenticated caller gives a reflection channel.
- **Fix:** Remove `event_id` and `ghl_contact_id` from the success response body (`ghl-capi.ts:246-251`); keep them in server logs only.

---

## Passing checks

- **No `EAA...` token anywhere in `src/`, `public/`, or `index.html`.** `grep -r "EAA" src/ public/ index.html` → no matches.
- **No `.env` file is tracked by git.** Only `netlify.toml` exists in the root.
- **PII hashing is correct.** `ghl-capi.ts:183-187` SHA-256s `em`, `ph`, `fn`, `ln`, `external_id`. `ghl-capi.ts:190-195` correctly leaves `fbc`/`fbp` unhashed per Meta spec.
- **Normalization is correct.** Email lowercased/trimmed (`ghl-capi.ts:48-50`), phone stripped to digits (`ghl-capi.ts:52-55`), names lowercased (`ghl-capi.ts:137-138`).
- **Dedup prefers the client event_id.** `ghl-capi.ts:172` falls back only if empty.
- **The only `graph.facebook.com` call outside the function is the flagged `facebookConversions.ts:57`.** `ghl-capi.ts:222` is expected.
- **CSP at `index.html:74` does not include `graph.facebook.com` in `connect-src`**, so direct browser calls to `sendOfflineConversion` from `facebookConversions.ts` would currently fail with a CSP error at runtime — which has been masking CRITICAL-1 in production. This is luck, not defense; the code is still shipping and the token env var would still be inlined into the bundle at build time.
- **`fbc` construction matches between client and server.** Client at `attribution.ts:85` uses `fb.1.${Date.now()}.${fbclid}`; server at `ghl-capi.ts:193` uses `fb.1.${eventTime * 1000}.${fbclid}`. Both produce millisecond timestamps. No drift.

---

## Recommended action order

1. Delete `src/utils/facebookConversions.ts` and its three usages (CRITICAL-1, LOW-1).
2. Add `GHL_WEBHOOK_SECRET` header check to the function (HIGH-1).
3. Add body validation to the function (HIGH-2).
4. Decide on one event_id format and align client + server fallback (MEDIUM-1).
5. Trim the function's response body (LOW-2).
