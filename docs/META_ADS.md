# Meta Ads — Pixel + CAPI Reference

This site runs Facebook/Instagram ads only. There is no Google Ads, no GA4. Every Meta-significant lead and offline conversion flows through GoHighLevel (GHL).

---

## Pixel IDs

| Pixel | ID | Where it loads |
|---|---|---|
| Main pixel | `1703925480259996` | `index.html` (every page except `/contractorlanding`) |
| Contractor pixel | `4230021860577001` | `LandingContractors.tsx` (loaded dynamically; main pixel is suppressed on this route to avoid double-firing) |

The contractor pixel is also the `META_PIXEL_ID` used by `ghl-capi.ts` for server-side events. If you ever switch the CAPI dataset to the main pixel, set `META_PIXEL_ID` in Netlify env.

---

## Environment variables

Set in **Netlify → Site settings → Environment variables**:

| Var | Purpose |
|---|---|
| `META_CAPI_TOKEN` | Conversions API access token. Generate in Events Manager → Settings → Conversions API → Generate access token. |
| `META_PIXEL_ID` | Defaults to the contractor pixel. Override only if you change CAPI datasets. |

Local-only (`.env.local`):

| Var | Purpose |
|---|---|
| `META_ADS_TOKEN` | Marketing API token used by `scripts/meta-ads-*.mjs` to provision/inspect campaigns. Not used at runtime. |
| `META_AD_ACCOUNT_ID` | Same — script use only. |

---

## Event mapping

All offline conversions originate from **GHL workflows**. The browser fires the matching client-side Pixel event with the **same `event_id`** the server sees, so Meta dedupes them on `event_id + pixel_id`.

| User action | Where it happens | Client Pixel events | Server CAPI event | Notes |
|---|---|---|---|---|
| Page view | Every route | `PageView` (initial in `index.html`; SPA routes fire from `App.tsx` useEffect) | — | Required for retargeting audiences. |
| Landing-page view | `/landing`, `/contractorlanding` | `ViewContent` (with attribution-aware `event_id`) | — | |
| Booking submitted (main) | Main calendar GHL widget | `Lead`, `CompleteRegistration`, `MainLandingBookingComplete` | `Lead` from GHL workflow → `ghl-capi.ts` | Dedup via `event_id` from `attribution.ts`. |
| Booking submitted (contractor) | Contractor calendar GHL widget | `Lead`, `CompleteRegistration`, `ContractorBookingComplete` | `Lead` from GHL workflow → `ghl-capi.ts` | Same dedup pattern. |
| Showed up to call | GHL workflow stage = "showed" | — | `CompleteRegistration` from GHL → `ghl-capi.ts` | Pure offline conversion. `action_source: 'system_generated'`. |
| Deal won | GHL opportunity stage = "won" | — | `Purchase` (with `value` from monetary value) → `ghl-capi.ts` | Pure offline conversion. |
| Phone-call click | Any `PhoneCta` `tel:` click | `PhoneClick` (custom event) | — | **Intentionally not a `Lead`** — leads only come through GHL. This event is for retargeting / lookalike audiences only. |

---

## Attribution flow (event_id parity)

```
[ Landing page mount ]
   └─ initAttribution() in src/utils/attribution.ts
        ├─ generates uuid → event_id
        ├─ reads ?fbclid from URL
        ├─ reads _fbc, _fbp cookies
        └─ sessionStorage["awd_attribution"]

[ User opens GHL booking widget ]
   └─ appendAttributionToUrl() in src/utils/attribution.ts
        └─ Adds customField[<id>] params for fbc / fbp / event_id / fbclid
            (IDs hardcoded to the contractor location; if regenerated, update
             GHL_CUSTOM_FIELD_IDS in attribution.ts)

[ User submits booking ]
   ├─ BookingWidget postMessage detects success
   ├─ stashAttribution({ email, contact_id }) → POST /.netlify/functions/attribution-stash
   │     └─ Stored in Netlify Blobs: 90-day TTL, keyed by event_id + email + contact_id + (ip,ua) hash
   └─ trackBookingComplete(source, undefined, event_id)
        └─ fbq('track', 'Lead', ..., { eventID: event_id })

[ GHL workflow fires, seconds to minutes later ]
   └─ POST /.netlify/functions/ghl-capi
        ├─ Reads event_id from webhook body OR looks up in stash
        ├─ Hashes PII (email, phone, name, city, state, zip, country, contact_id)
        ├─ Sends to graph.facebook.com/v21.0/<pixel_id>/events
        └─ Same event_id as the client Pixel → Meta dedupes ✓
```

### Verifying dedup is working

1. **Events Manager → Test Events** → enter the test event code from your dataset.
2. Set `?test_event_code=<code>` on the landing URL **or** include `customData.test_event_code` in the GHL webhook payload (the bridge picks both up).
3. Trigger a booking. Within a minute you should see two events with the same `event_id` and a green **Deduplicated** chip.

If they don't dedupe, the most common causes are:
- The GHL custom-field IDs in `attribution.ts` rotated (re-pull from `GET https://backend.leadconnectorhq.com/locations/<loc>/customFields/search?documentType=field&model=contact`).
- The webhook body uses a path the bridge doesn't `pick(...)` — add the path or have GHL set `customData.event_id` / `customData.fbc` etc. as fixed mappings.

---

## CAPI userData fields sent

`ghl-capi.ts:userData` builds Meta `user_data` with these (all PII SHA-256 hashed):

- `em` — email
- `ph` — phone (digits only)
- `fn` / `ln` — first/last name
- `ct` — city (lowercase, no spaces)
- `st` — state (lowercase, no spaces)
- `zp` — zip / postal (alphanumeric only, lowercase)
- `country` — ISO-3166 alpha-2 (`us`, …)
- `external_id` — GHL contact id
- `fbc` / `fbp` — raw, NOT hashed (per Meta spec)
- `client_user_agent`, `client_ip_address` — raw

City/state/zip lift match quality from ~50% (email+phone alone) to ~80%+. Make sure your GHL booking form actually captures the address — empty fields are simply omitted from the payload.

---

## Cookie notice

`src/components/ui/CookieNotice.tsx` shows a small first-visit dialog. On Decline it calls `fbq('consent', 'revoke')` and persists the choice in `localStorage["awd_cookie_consent_v1"]`. Default for unknown / first-visit users is granted (US-default, no GDPR exposure). If EU traffic grows, flip the default to revoked and gate the Pixel init on Accept.

---

## Files of record

- `src/config/pixels.ts` — pixel IDs.
- `src/utils/pixelTracking.ts` — `fbq` wrappers + `trackBookingComplete`, `trackViewContent`, `trackPhoneClick`.
- `src/utils/attribution.ts` — `event_id` lifecycle, fbc/fbp/fbclid capture, GHL custom-field stamping, server-side stash.
- `src/components/BookingWidget.tsx` — GHL iframe + postMessage detection that triggers booking complete.
- `netlify/functions/ghl-capi.ts` — server-side CAPI bridge for all offline conversions.
- `netlify/functions/attribution-stash.ts` — 90-day attribution lookup table (Netlify Blobs).
- `index.html` — main pixel init + Calendly fallback listener (legacy).
- `src/components/ui/CookieNotice.tsx` — consent disclosure.
