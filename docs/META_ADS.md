# Meta Ads — Pixel + CAPI Reference

This site runs Facebook/Instagram ads only. There is no Google Ads, no GA4. Every Meta-significant
lead and offline conversion flows through GoHighLevel (GHL).

**Architecture in one line:** the browser pixel fires **audience signals only** (PageView /
ViewContent / PhoneClick); **all conversions** (Lead / CompleteRegistration / Purchase) are sent by
GHL's native **"Meta Conversion API"** workflow action, which SHA-256-hashes the PII itself. Single
source per event — no browser/server dedup, no `event_id`, no custom bridge.

---

## Pixel IDs

| Pixel | ID | Where it loads |
|---|---|---|
| Main pixel | `1703925480259996` | `index.html` (every page except `/contractorlanding`) |
| Contractor pixel | `4230021860577001` | `LandingContractors.tsx` (loaded dynamically; main pixel is suppressed on this route to avoid double-firing) |

The contractor pixel `4230021860577001` is also the **dataset** the GHL "Meta Conversion API" action
sends to. Source of truth for IDs: `src/config/pixels.ts`.

---

## Environment variables

**Netlify (runtime): none required for CAPI.** Conversions run inside GHL. The old
`META_CAPI_TOKEN` / `META_PIXEL_ID` / `GHL_WEBHOOK_SECRET` vars are unused — remove them. The
Conversions API access token lives inside GHL (attached to the Meta integration).

Local-only (`.env.local`), used by `scripts/meta-ads-*.mjs` to provision/inspect campaigns — not used
at runtime:

| Var | Purpose |
|---|---|
| `META_ADS_TOKEN` | Marketing API token. |
| `META_AD_ACCOUNT_ID` | `act_553999801104558`. |
| `META_DATASET_ID` | `4230021860577001`. |

---

## Event mapping

| User action | Browser pixel | Server conversion (GHL "Meta Conversion API") | GHL trigger |
|---|---|---|---|
| Page view | `PageView` | — | every route |
| Landing-page view | `ViewContent` | — | `/`, `/contractorlanding` |
| Booking submitted | — | **`Lead`** | "Customer Booked Appointment" (calendar = Contractors – Free Design) |
| Showed up to call | — | **`CompleteRegistration`** | "Appointment Status" = Show |
| Deal won | — | **`Purchase`** (value from opportunity) | "Opportunity Status Changed" = Won |
| Phone-call click | `PhoneClick` (custom) | — | any `PhoneCta` `tel:` click |

The browser **never** fires Lead/CompleteRegistration/Purchase — that's intentional (single source =
no double counting, no dedup machinery).

---

## Ad-click attribution handoff (cross-origin)

The GHL booking form is a cross-origin iframe (`api.leadconnectorhq.com`), so it cannot read this
page's `_fbc`/`_fbp` cookies or the `?fbclid` Facebook appends to the ad-landing URL. The parent page
must hand them over via the iframe `src`:

```
[ Landing page ]  user clicks FB ad → /contractorlanding?...&fbclid=XXXX
       │           (Meta pixel sets _fbc / _fbp cookies on acewebdesigners.com)
       ▼
[ BookingWidget mounts ]  src/utils/attribution.ts → appendAttributionToUrl()
       │   appends bare ?fbclid=…&fbc=…&fbp=…  to the GHL iframe URL
       ▼
[ GHL captures them onto the contact's attribution ]
       ▼
[ Workflow fires ]  "Meta Conversion API" action reads fbc/fbp/fbclid + hashes the
                    contact PII (email, phone, name, city/state/zip) → Meta CAPI
```

No `event_id`, no Netlify stash, no hardcoded custom-field IDs — the shim is ~25 lines and forwards
three params. That's the entire client contribution to conversions.

---

## GHL "Meta Conversion API" setup runbook

> Location: `A2zlaOOL5JLn883XGWWl`. Workflow: the contractor appointment workflow. Dataset/pixel:
> `4230021860577001`. You're **replacing** the three "Facebook Offline Conversion Webhook" custom
> webhooks (📡 icon) with native "Meta Conversion API" actions.

### 0. Prerequisite — connect Meta
GHL → **Settings → Integrations → Facebook/Meta**: connect the Business + ad account that owns dataset
`4230021860577001`. The "Meta Conversion API" action selects the pixel from this connection.

### 1. Add a "Meta Conversion API" action next to each webhook
In the workflow builder, for each of the three conversion points, click **`+` → Actions → Marketing →
Meta Conversion API**, then configure:

| Replace this webhook | New action | Event | Extra mapping |
|---|---|---|---|
| Facebook Offline Conversion Webhook **Booked** | Meta Conversion API | **Lead** | — |
| Facebook Offline Conversion Webhook **Show Up** | Meta Conversion API | **CompleteRegistration** | — |
| Facebook Offline Conversion Webhook (Purchase) | Meta Conversion API | **Purchase** | Value = `{{opportunity.monetary_value}}`, Currency = `USD` |

In each action: select the connected **Ad Account**, select **pixel `4230021860577001`**, choose the
**Event**, and (during testing) paste a **Test Event Code** from Events Manager. GHL auto-includes and
hashes the contact's email / phone / name / city / state / zip and reads fbc/fbp/fbclid from the
contact's attribution — confirm these appear in the action's customer-information section.

### 2. Capture address for match quality
The contractor booking form must collect **City / State / Postal code** (and they must land on the
contact). Email + phone alone ≈ 50% Event Match Quality; adding city/state/zip lifts it to ~80%+.

### 3. Verify each event (see Verification below) BEFORE removing the webhooks.

### 4. Cut over (minimal double-count)
For each conversion point, in one edit: **remove the Test Event Code** from the native action (so it
sends live) **and delete** the matching 📡 webhook action. Then **Save + Publish** the workflow.
While native actions still have a Test Event Code, real conversions only flow through the old
webhooks — so there's no double counting until you flip each one.

### 5. Decommission the old bridge
After all three are live on native actions: redeploy the site (the deleted `ghl-capi.ts` /
`attribution-stash.ts` leave production) and remove the unused Netlify env vars
(`META_CAPI_TOKEN`, `META_PIXEL_ID`, `GHL_WEBHOOK_SECRET`).

---

## Verification

1. **Browser fires audiences only:** `node scripts/test-booking-flow.mjs` on `/contractorlanding`.
   Expect pixel `4230021860577001` to fire `PageView` / `ViewContent` / `PhoneClick` and **NOT**
   `Lead` / `CompleteRegistration`. The dead pixel `1548487516424971` must never fire. (Cross-check
   DevTools → Network `facebook.com/tr` — no `ev=Lead`.)
2. **GHL sends hashed conversions:** Events Manager → dataset `4230021860577001` → **Test Events**;
   copy the test code into the action(s). Trigger a booking → within ~1 min a server **`Lead`**
   appears. Expand it: `em` / `ph` / `fn` / `ln` / `ct` / `st` / `zp` must show as **hashed**. Repeat
   for `CompleteRegistration` (move the opportunity to Show) and `Purchase` (mark Won).
3. **Click attribution arrives:** open `/contractorlanding?fbclid=TESTCLICK123`, book, and confirm the
   test `Lead` lists **`fbc`** (encoding the fbclid) and **`fbp`**. If they're missing, GHL didn't
   capture the bare params onto the contact — check the action's fbc/fbp mapping / contact attribution.
4. **Match quality:** GHL's hashing isn't directly inspectable, so the real proxy is **Event Match
   Quality** on the dataset — watch it over 48–72h after cutover.

---

## Cookie notice

`src/components/ui/CookieNotice.tsx` shows a small first-visit dialog. On Decline it calls
`fbq('consent', 'revoke')` and persists the choice in `localStorage["awd_cookie_consent_v1"]`. Default
for unknown / first-visit users is granted (US-default, no GDPR exposure). If EU traffic grows, flip
the default to revoked and gate the Pixel init on Accept.

---

## Files of record

- `src/config/pixels.ts` — pixel IDs.
- `src/config/calendars.ts` — GHL booking-widget URLs.
- `src/utils/pixelTracking.ts` — `fbq` wrappers; audience events only (`trackViewContent`,
  `trackPhoneClick`, pixel init). No conversion events.
- `src/utils/attribution.ts` — the ~25-line `appendAttributionToUrl()` shim (forwards fbclid/fbc/fbp
  to the cross-origin GHL iframe). No event_id, no stash, no custom-field IDs.
- `src/components/BookingWidget.tsx` — GHL iframe embed + loading/error states. No postMessage
  detection (conversions are server-side via GHL).
- `src/components/ui/CookieNotice.tsx` — consent disclosure.
- `scripts/test-booking-flow.mjs` — headed Playwright check that the browser fires audiences only.
- `scripts/audit-production.mjs` — headed Playwright production sanity audit.
