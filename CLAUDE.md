# CLAUDE.md — acewebdesigners

React + Vite + TypeScript marketing site (Tailwind, Framer Motion, react-helmet-async),
frontend on **Netlify**. Backend is **Supabase** (Postgres + Edge Functions). Runs
**Facebook/Instagram ads only** — no Google Ads, no GA4.

We **own the whole funnel now**: our own booking scheduler, our own lead database, and our own
server-side **Meta Conversions API**. The only thing still in GoHighLevel (GHL) is the
**messaging workflow** (confirmation email + appointment-relative reminders + internal notify),
triggered by our `book` function via the GHL API and isolated behind one module so it can be cut
later. (Historically GHL owned booking + CRM + CAPI; that has been replaced.)

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Build (typecheck + vite) | `npm run build` |
| Lint (zero-warnings) | `npm run lint` |
| Unit tests | `npm run test` |
| Deploy an Edge Function | `npx supabase functions deploy <name>` |
| Push DB migrations | `npx supabase db push` |
| Set Edge secrets | `npx supabase secrets set --env-file supabase/.env` |
| Meta campaign status | `npm run meta-ads:status` |

> First-time Supabase: `npx supabase link --project-ref dwsmrruzufqpopdzlszw` (needs
> `SUPABASE_ACCESS_TOKEN`).

## Engineering standards

DRY / single source of truth · YAGNI · SRP (browser pixel = audiences + deduped Lead, Supabase =
conversions + data, components = UI) · KISS. Pixel/dataset IDs live ONLY in `src/config/pixels.ts`
and Edge secrets — never re-literal them in components. **No secrets in client code** (only the
`VITE_SUPABASE_*` anon values, which are safe — RLS protects every table).

---

# Architecture

```
React (Netlify)
  scheduler UI (src/components/scheduler) + browser pixel (PageView/ViewContent + Lead w/ event_id)
        │  VITE_SUPABASE_URL / ANON_KEY
        ▼
Supabase Edge Functions (supabase/functions, Deno)
  slots          open slots = availability − booked − Google busy
  book           validate → upsert contact → insert appointment → CAPI Lead → GCal event → GHL relay
  result         admin: No-Show / Showed / Purchase → CAPI CompleteRegistration / Purchase
  admin-data     admin: dashboard payload (health + stats + lists)
  capi           guarded manual/test CAPI endpoint (verification)
  create-checkout / stripe-webhook   Stripe deposit → Purchase CAPI
  ghl-webhook    logs GHL messaging sends (visibility)
  _shared/*      meta.ts (CAPI engine), google.ts, ghl.ts, availability.ts, identity.ts, adminAuth.ts
        ▼
Supabase Postgres: contacts · appointments · availability · capi_events (dedup/audit) · ghl_messages
        ▼ external sinks
Meta CAPI · Google Calendar · Stripe · GHL (messaging only)
```

**Dedup model:** the browser fires `Lead` with an `event_id` (`trackLead`), and `book` fires the
**same `event_id`** server-side → Meta dedupes. Post-meeting events reuse the lead's stored
attribution: `cr_<appt>` (CompleteRegistration) and `purchase_<appt>` (Purchase) are derived from
the appointment id, so the result form and Stripe webhook can't double-count.

**`action_source` split** (`_shared/meta.ts`, `defaultActionSource`): `Lead` →
`'website'` (it happens on the booking submit, so it dedupes with the browser pixel and renders in
Test Events). `CompleteRegistration` (Showed) and `Purchase` (closed) → `'system_generated'` —
they happen **offline** (on a call / in the CRM). Offline events are still received and attributed
to ads via matched PII (email/phone/fbc), but they **do NOT appear in the Test Events channel UI** —
verify them in Events Manager → live Activity, or in `/admin`. Don't "fix" their absence from Test
Events by flipping them to `'website'`; the offline classification is intentional.

**Admin dashboard:** `/admin` (lazy route in `App.tsx`). Supabase **email + password** login
(`signInWithPassword`), with a magic-link fallback ("Email me a sign-in link instead"); the email
must be in `ADMIN_EMAILS`. Three tabs: **Overview** (whole-business KPIs + setup warnings +
integration health), **Website** (booking funnel + every appointment with a **Result** action —
Showed / No-Show / Purchase with upfront + recurring $ + plan — + CAPI log), and **Social Media**
(paid FB/IG-attributed funnel + per-campaign breakdown). Stats cover leads/upcoming/showed/
purchased/MRR and CAPI sent/error; recent CAPI + GHL-message logs are shown. A "book test mode" is
available for end-to-end checks.

## Status

**Deployed + verified live (2026-06-09).** All Edge functions respond; `slots` returns real
availability; booking + offline CAPI work end-to-end — real `Lead`, `CompleteRegistration`, and
`Purchase` rows show `sent` in `capi_events` (Meta returned `events_received: 1`). Re-prove offline
acceptance anytime: `npm run capi:prove-offline` (direct to Meta) or `npm run capi:verify-offline`
(through the deployed `capi` endpoint). builds/lints/tests green.

---

# Meta — pixels & campaign (✅ verified facts)

Ad account `act_553999801104558`, business "Ace Web Designers". Source of truth: `src/config/pixels.ts`.

| Pixel / dataset | Role |
|---|---|
| `4230021860577001` (Contractors Nationwide) | **CONTRACTOR dataset** — `/contractorlanding` + its CAPI |
| `1703925480259996` (Ace Web Designers Landing) | **MAIN pixel** — everywhere except `/contractorlanding` |
| `1548487516424971` | **DEAD** — do not use (caused the old 0-leads bug) |

- Campaign `Contractor Lead Gen — Free Website Offer` — id `120241554190170259`.
- Ad set (current) `120242709687340259` — `OFFSITE_CONVERSIONS` / `LEAD`,
  `promoted_object.pixel_id = 4230021860577001` ✅. Keep PAUSED until a real Lead is verified.
- Ad destination: `https://acewebdesigners.com/contractorlanding?source=landing-contractors`.
- The "spend / 0 leads" bug was the ad set optimizing a pixel the page never fired. Current ad set
  is bound to the pixel the page fires — keep it that way.

---

# Environment / secrets

- **Client (`.env.local` dev, Netlify build env):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Supabase Edge secrets** (`supabase/.env` → `supabase secrets set`; template in
  `supabase/.env.example`): `META_CAPI_TOKEN`, `META_DATASET_ID` (=4230021860577001),
  `META_DATASET_ID_MAIN`, `META_TEST_EVENT_CODE` (while verifying), `CAPI_INTERNAL_SECRET`,
  `GHL_API_TOKEN` / `GHL_LOCATION_ID` / `GHL_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_B64` /
  `GOOGLE_CALENDAR_ID_CONTRACTOR` / `_MAIN`, `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`,
  `GHL_WEBHOOK_SECRET`, `ADMIN_EMAILS`.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` are auto-injected — don't set.
- Everything degrades gracefully: Google/GHL/Stripe each **no-op when unset**, so you can ship
  booking + CAPI first and add the rest incrementally.

## GHL: keep only messaging
The `book` function creates a contact + appointment in GHL (calendar `GHL_CALENDAR_ID`) to fire the
existing **Appointment Created** workflow (confirmation + reminders + internal notify). **Remove the
CAPI action from that GHL workflow** — CAPI is ours; leaving GHL's would double-fire. Optionally add
a GHL "Webhook" action → `/functions/v1/ghl-webhook` (with `GHL_WEBHOOK_SECRET`) so message sends
show up in the dashboard.

## Google Calendar
Service account (`GOOGLE_SERVICE_ACCOUNT_B64` = base64 of the JSON key). Share the business calendar
with the service-account email, "Make changes to events". `slots` queries freeBusy live (no cache);
`book` creates the event.

---

# Verification (do in order; don't unpause spend until step 2 passes)

1. **Deploy:** `supabase link`, `supabase db push`, set secrets, `supabase functions deploy` (all).
   Set `VITE_SUPABASE_*` in Netlify and redeploy the site.
2. **CAPI test event:** POST `/functions/v1/capi` with `x-capi-secret` + a `testEventCode` →
   a hashed server `Lead` appears in Events Manager → dataset `4230021860577001` → Test Events,
   `fbc`/`fbp` non-blank. **This is the proof step.**
3. **End-to-end booking:** load `/contractorlanding?fbclid=test123`, book a slot →
   (a) browser + server `Lead` share one `event_id` and Meta dedupes, (b) rows in
   `contacts`+`appointments`, (c) Google Calendar event created, (d) GHL confirmation fires (and
   shows in `/admin` if the GHL webhook is wired).
4. **Result form:** in `/admin` (Website tab), mark the appointment **Showed** →
   `CompleteRegistration`; then **Purchase** with upfront + recurring → `Purchase` (value = upfront,
   recurring/LTV in custom_data). These are `system_generated` (offline) so they **won't show in
   Test Events** — confirm them in Events Manager → live Activity and in the `/admin` CAPI log.
5. **Stripe (optional):** run a test Checkout → `stripe-webhook` → `Purchase` (deduped).
6. **Regression:** `npm run build`, `npm run lint`, `npm run test`; no `leadconnectorhq` in the
   client except the isolated GHL relay/messaging references.

# Troubleshooting

| Symptom | First check |
|---|---|
| No server Lead in Test Events | `META_CAPI_TOKEN` set + bound to `4230021860577001`? `capi` returns ok? |
| Booking fails / "unavailable" | `VITE_SUPABASE_*` set? `slots`/`book` deployed? `availability` rows exist? |
| Low match quality / `fbp` blank | form sending fbc/fbp (same-origin cookies) + city/state/zip? see `getAttribution` |
| Browser double-counting Lead | server + browser must share `event_id` (they do via `trackLead` + `book`) |
| Purchase/Showed not matching | reuses stored attribution on the appointment (`identity.ts`) — was the lead booked through our form? |
| GHL messages not firing | GHL workflow Appointment-Created trigger on `GHL_CALENDAR_ID`? `book` created the GHL appt? |
| Can't load `/admin` | signed in with an `ADMIN_EMAILS` address? functions deployed with `verify_jwt`? |
| Marketing-API scripts erroring | `META_ADS_TOKEN` expired — regenerate |
