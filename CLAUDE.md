# CLAUDE.md — acewebdesigners

React + Vite + TypeScript marketing site (Tailwind, Framer Motion, react-helmet-async), frontend on
**Netlify**. Backend is **Supabase** (Postgres + Edge Functions, Deno). Runs **Facebook/Instagram ads
only** — no Google Ads, no GA4.

We **own the whole funnel**: our own booking scheduler, our own lead database, our own server-side
**Meta Conversions API**. GHL is kept ONLY as the **messaging/comms engine** — we mirror every funnel
stage into GHL (v2 API): upsert an enriched contact + a per-stage tag
(`funnel-lead`/`funnel-booked`/`funnel-showed`/`funnel-noshow`/`funnel-purchased`) + a real GHL
appointment on booking, so comms workflows (confirmations, reminders, nurture, onboarding) are built
**in the GHL UI** and triggered by those tags + native Appointment-Created. All GHL ties live in one
module (`_shared/ghl.ts`) so they can be cut later.

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
| Redeploy frontend (no git) | `npm run build && npx netlify deploy --prod --dir=dist --site=4ea5b9c0-5a70-406f-a928-7f009290f519` |

> First-time Supabase: `npx supabase link --project-ref dwsmrruzufqpopdzlszw` (needs `SUPABASE_ACCESS_TOKEN`).
> Netlify deploy token = `NETLIFY_AUTH_TOKEN` from `supabase/.env` (`export` it first).

## Engineering standards

DRY / single source of truth · YAGNI · SRP (browser pixel = audiences + deduped Lead, Supabase =
conversions + data, components = UI) · KISS. Pixel/dataset IDs live ONLY in `src/config/pixels.ts` and
Edge secrets — never re-literal them in components. **No secrets in client code** (only the
`VITE_SUPABASE_*` anon values, safe because RLS protects every table). Keep this file lean — update it
after meaningful changes, but record CURRENT state, not a changelog.

---

# Architecture

```
React (Netlify)
  scheduler UI (src/components/scheduler): gate form → Lead, then calendar → Schedule
  + browser pixel (PageView/ViewContent + Lead/Schedule w/ shared event_id)
        │  VITE_SUPABASE_URL / ANON_KEY
        ▼
Supabase Edge Functions (supabase/functions, Deno)
  slots          open slots = availability − booked − Google busy (30-min slots; 4h min notice, 7-day window)
  lead           gate-form step: upsert contact (durable attribution) → CAPI Lead
  book           validate slot → upsert contact → insert appointment → CAPI Schedule → GCal event → GHL relay → fire generate-site
  result         admin: No-Show / Showed / Purchase → CAPI CompleteRegistration / Purchase; No-Show also tags funnel-noshow in GHL
  admin-data     admin: dashboard payload (health + stats + lists)
  capi           guarded manual/test CAPI endpoint (verification) + admin retry of failed events
  generate-site  3-stage Opus 4.8 chain → builds+deploys a preview website (see Current state)
  generate-copy  restaurant wizard AI copy (claude-haiku-4-5)
  create-subscription / create-checkout / stripe-webhook   Stripe → Purchase CAPI
  ghl-webhook    logs GHL messaging sends (visibility)
  _shared/*      meta.ts (CAPI engine), contacts.ts, attribution.ts, availability.ts, google.ts,
                 ghl.ts (ghlSyncStage/createGhlAppointment/pushLegacyBooking), netlify.ts,
                 designSystems.ts, identity.ts, adminAuth.ts
        ▼
Supabase Postgres: contacts · appointments · availability · capi_events (dedup/audit) · ghl_messages · design_systems
        ▼ external sinks
Meta CAPI · Google Calendar · Stripe · GHL (messaging only) · Netlify (preview sites) · Anthropic API
```

**Funnel + dedup model:** four events, each at its logical moment:
`Lead` (gate form) → `Schedule` (slot booked) → `CompleteRegistration` (Showed) → `Purchase` (closed).
The two website events are dual-fired and deduped by a shared `event_id`: browser `trackLead` + `lead`
fn share one id; browser `trackSchedule` + `book` share one id. Post-meeting events reuse the lead's
stored attribution with ids derived from the appointment — `cr_<appt>` (CompleteRegistration),
`purchase_<appt>` (Purchase) — so the result form and Stripe webhook can't double-count.

**Attribution durability:** the `contacts` row is the durable record — fbc/fbp/fbclid AND
client_ip/client_user_agent/landing_url/utm (jsonb). `utm` captures the Ads Manager URL template
(`utm_source/medium/campaign/content` + `campaign_id/adset_id/ad_id`). First-touch params persist to
`sessionStorage` (`getAttribution`) so SPA nav can't drop them. `lead`/`book` write it (shared
`contacts.ts` + `attribution.ts`); every downstream event replays it. Match *quality* comes from
user_data (email/phone/fbc/fbp/ip/ua); ad ids are attribution context in custom_data.

**Test mode:** `test: true` flags the appointment + its `capi_events` `is_test`, routes every
downstream event (Lead AND later CR/Purchase/Stripe) to Meta **Test Events**, skips GCal + GHL +
generate-site, and is excluded from all `/admin` stats (badged `TEST`). `META_TEST_EVENT_CODE` is read
**only** by explicit test paths — `meta.ts` never falls back to it for live events (a prior footgun).

**`action_source` split** (`_shared/meta.ts` `defaultActionSource`): `Lead` + `Schedule` → `'website'`
(happen on the site, dedupe with the pixel, render in Test Events). `CompleteRegistration` + `Purchase`
→ `'system_generated'` (offline — on a call / in the CRM). Offline events ARE received/attributed via
matched PII but **do NOT appear in the Test Events channel UI** — verify in Events Manager → live
Activity, or in `/admin`. Don't flip them to `'website'`; the offline classification is intentional.

**Admin dashboard:** `/admin` (lazy route in `App.tsx`). Supabase **email+password** login
(`signInWithPassword`) + magic-link fallback; email must be in `ADMIN_EMAILS`. Five tabs — **Overview**
(whole-business KPIs + setup warnings + integration health), **Website** (booking funnel, appointments
with a **Result** action: Showed / No-Show / Purchase + upfront/recurring $ + plan; Website column for
the preview site), **Social Media** (paid FB/IG funnel + per-campaign), **Customer Overview** (segment
picker: Leads/Showed/No-shows/Purchased), **Conversion Log** (Meta server-event cards + CAPI log). The
Result modal confirms per-event Meta acceptance and has a **Test** checkbox (dry-run on a live booking)
and a **Discard test data** button (deletes all `is_test` appts + capi rows; `admin-data`
`{action:'discardTests'}` / `node scripts/funnel-admin.mjs discard-tests`). CAPI log shows
`✓ Meta got it` / `⚠ unconfirmed`, errors, test badges, and a **Retry** (re-fires failed/pending from
stored attribution: `capi` fn `{retryEventId}`, admin JWT). Stats exclude `is_test`.

---

# Current state

## Booking funnel (contractor + main) — LIVE
- **Window:** 4h min notice, **7-day** max advance; 30-min slots. Defaults in
  `_shared/availability.ts` (`leadMinutes 240`, `maxAdvanceMinutes 10080`); both `slots` (display) and
  `book` (validation) call `computeOpenSlots` with no override, so they move together.
- **Availability hours** (`availability` DB rows, both calendars): weekdays **7am–8pm** (420–1200),
  **Saturday 8am–12pm** (weekday 6), tz America/New_York. Google freeBusy trims real conflicts live, so
  the rows are the outer envelope. Edit rows directly (Management API SQL) — no deploy needed.
- **Gate form** (`Scheduler.tsx`, both funnels): asks only **first/last name + email + phone** → fires
  `Lead`. **Business name + type are collected at the confirm sub-step** (after a time is picked) → sent
  to `book`, which stamps `contacts.business_name/_type` before triggering generate-site. `lead`/`book`
  treat business fields as optional, so the preview-site chain stays intact. (Slimmed 2026-07-17 — the
  old 6-field gate converted at 0.2%; the contractor ad's problem was 100% post-click, delivery is fine.)
- **Conversion optimizations (2026-07-17, research-backed — see evidence notes in git history):**
  form-first order is deliberate (Chili Piper + Meta native lead-ads both converged on it — do NOT
  switch to calendar-first); phone field has inline justification microcopy (Baymard: unexplained
  phone fields drive abandonment + fake numbers); CTAs use low-commitment availability phrasing
  ("See available times"); calendar default-selects the earliest open day + Today/Tomorrow badge
  (lead-time is the top no-show predictor); confirm + done screens name the concrete stake ("we're
  building your free homepage preview for this call"). Landing CTA scrolls to the FORM
  (`landing-contractors-form-container`), not the section heading; BookingSection renders the widget
  above the what-to-expect copy. **Ad set stays optimized on Lead** (owner decision — never switch to
  Schedule/ViewContent).
- **Attribution persistence:** `getAttribution()` stores first-touch fbclid/fbc/utm in session+local
  storage (7-day TTL, key `awd_attribution`); `LandingContractors` calls it on mount so ad params are
  captured before any navigation loses them (3 of the first 5 leads had arrived without fbc).
  CSP `connect-src` allows `https://*.a.run.app https://*.on.aws` (Meta pixel telemetry relays —
  blocked before, 12 console errors/load).

## Preview-site generation (`generate-site`) — LIVE
- Every real booking: `book` fire-and-forgets `generate-site` → **3-stage Opus 4.8 API chain** (stage 1
  styles.css+main.js ~12k tokens → stage 2 index+services ~13k → stage 3 about+contact ~10k), each stage
  self-invokes the next in a fresh isolate → deploy via `_shared/netlify.ts` (file-digest API →
  `preview-<slug>-<hex>.netlify.app`, `ssl_url` → `appointments.preview_url`; `site_status`
  queued/generating/deployed/failed). /admin **Retry** re-runs it. Test bookings skip (force-able);
  no-ops without secrets — booking never blocked. **Why staged:** Edge isolates die ~400s wall clock;
  keep `max_tokens` ≥30% above expected file size (a too-low cap truncated a file once). No-Show KEEPS
  the site (owner's call). Cost ≈ $0.60–1.10/site.
- Auth: internal trigger uses `x-internal-key` = `SUPABASE_SERVICE_ROLE_KEY` (book compares the env var
  against itself). External callers must use an **admin JWT** (mint like `funnel-admin.mjs`) — the
  Management-API service_role key does NOT equal the runtime-injected one, so `x-internal-key` from
  outside 401s. Deployed `--no-verify-jwt`.
- **Design systems (art direction):** 18 directions (palette + Google fonts + layout + motion + photo
  treatment; 3 universal: nocturne-luxe, editorial-serif, clean-corporate-trust). **Source of truth =
  the `design_systems` Postgres table** (migration `0007`; edit/add rows via SQL, next build picks them
  up, no deploy). `DEFAULT_DESIGN_SYSTEMS` in `_shared/designSystems.ts` is the SEED **and** runtime
  FALLBACK if the DB read is empty/fails. Selection is **deterministic + trade-aware**
  (`selectDesignSystem(systems, appt.id, business_type)` — trade shortlist + 3 universal, hashed by
  appt id) so /admin Retry resolves the SAME style; the resolved object is threaded to stages 2-3.
  Manual override: POST `{style:'<id>'}`. Chosen style logged per build.
- Photo library: 24 verified Unsplash ids only (hallucinated ids 404). Scroll-reveal: full-page
  screenshots show blank sections (opacity-0 until IntersectionObserver fires) — real visitors see it.
- `generate-copy`: optional "Write my copy with AI" in the restaurant wizard, `claude-haiku-4-5`,
  max_tokens 400, 5 uses/session client cap; no-ops 503 without `ANTHROPIC_API_KEY`.

## Restaurant self-serve funnel — BUILT, DEPLOY PENDING
A third, fully isolated ad funnel (own pixel + dataset + tags + page) — nothing crosses into
contractor/main. Self-serve wizard with live preview → monthly Stripe **subscription** (no booking).
`/buildyoursite` (`BuildYourSite.tsx` + `components/builder/RestaurantWizard.tsx`; `config/restaurantPlans.ts`).
- Pixel/dataset: **"Restaurant Builder CAPI" `1575254990791923`** (`RESTAURANT_PIXEL` in `pixels.ts`,
  `META_DATASET_ID_RESTAURANT` set). `index.html` loads only that pixel on `/buildyoursite`.
- Funnel: wizard gate → deduped `Lead` (`calendar:'restaurant'`) → plan pick → `create-subscription`
  (`STRIPE_PRICE_{STARTER,PRO,PREMIUM}`) → `stripe-webhook` fires `Purchase` (dedup `purchase_sub_<subId>`).
- GHL: same account, isolated by tag set via `ghlSyncStage({funnel:'restaurant'})` → `restaurant-*`
  tags. Two workflows live ("Restaurant — New Lead", "Restaurant — Purchased (Onboarding)").
- **To go live:** (1) create 3 recurring Stripe Prices → `STRIPE_PRICE_*`; (2) confirm `META_CAPI_TOKEN`
  can write dataset `1575254990791923`; (3) `supabase secrets set` + `functions deploy lead
  create-subscription stripe-webhook`; (4) redeploy Netlify; (5) publish the FB campaign draft
  ("Restaurant Builder — Leads", $10/day, currently In draft — swap real creative first).
- Safety: `datasetId()` no longer falls back to the contractor pixel for main/restaurant — a missing
  dataset id fails loudly instead of polluting the contractor dataset.

## Verification tooling & DB access
- `scripts/funnel-verify.mjs` (calls slots/lead/book with the anon key + capi retry-dedup check),
  `scripts/funnel-admin.mjs` (mints a short-lived admin session → `result`). `meta-ads-status.mjs`
  looks up campaign/adset/ad by ID and reports url_tags.
- **DB reads/writes: use the Management API SQL endpoint** with `SUPABASE_ACCESS_TOKEN` —
  `POST https://api.supabase.com/v1/projects/dwsmrruzufqpopdzlszw/database/query`. The **Supabase MCP
  points at the wrong project** — don't use it for this DB.
- `main`-site CAPI has never worked (token only writes the contractor dataset) — known, low priority;
  only contractor is ad-driven.

---

# Meta — pixels & campaign (✅ verified)

Ad account `act_553999801104558`, business "Ace Web Designers" (biz `1231765388396950`). Source of
truth: `src/config/pixels.ts`. (There's a stray portfolio `1257978982125338` with unrelated pixels —
stay in the Ace Web Designers portfolio.)

| Pixel / dataset | Role |
|---|---|
| `4230021860577001` (Contractors Nationwide) | **CONTRACTOR dataset** — `/contractorlanding` + its CAPI |
| `1703925480259996` (Ace Web Designers Landing) | **MAIN pixel** — everywhere except `/contractorlanding` |
| `1575254990791923` (Restaurant Builder CAPI) | **RESTAURANT dataset** — `/buildyoursite` (pending launch) |
| `1548487516424971` | **DEAD** — do not use (caused the old 0-leads bug) |

- Campaign **"Free Website Offer For Contractors (6/1/26)"** id `120241554190170259` — **ACTIVE**.
- Ad set `120242709687340259` — `OFFSITE_CONVERSIONS`/`LEAD`, `promoted_object.pixel_id =
  4230021860577001` ✅, $20/day, **ACTIVE**. **Fully broad targeting** (US + `advantage_audience:1`,
  no custom detailed targeting — let Advantage+ decide). **Conversion event stays Lead — owner
  decision (2026-07-17); do not switch to Schedule or ViewContent.**
- Ad **"funny hook"** id `120242709687350259` — 2 videos (flexible media auto-picks), all Advantage+
  creative enhancements on, UTM url_tags published. All other campaigns/ad sets stay PAUSED.
- Destination `https://acewebdesigners.com/contractorlanding?source=landing-contractors` (+ UTM template
  appended at click). `_shared/attribution.ts` `withDefaultAdIds` stamps known campaign/adset/ad ids on
  `source=landing-contractors` URLs lacking utm (real params win when present).
- The old "spend / 0 leads" bug was the ad set optimizing a pixel the page never fired. Keep the ad set
  bound to the pixel the page fires.
- `META_ADS_TOKEN` (`.env.local`) is **READ-ONLY** — can't create/update ads/creatives/pixels; do that
  via Ads Manager UI (Playwright). Account past-due was cleared 2026-07-06.

---

# Environment / secrets

- **Client (`.env.local` dev, Netlify build env):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  (set in BOTH — a bundle built without them ships "Supabase is not configured"). Also `META_ADS_TOKEN`
  (read-only), `META_AD_ACCOUNT_ID`.
- **Supabase Edge secrets** (`supabase/.env` → `supabase secrets set`; template `supabase/.env.example`):
  `META_CAPI_TOKEN`, `META_DATASET_ID` (=4230021860577001), `META_DATASET_ID_MAIN`,
  `META_DATASET_ID_RESTAURANT`, `META_TEST_EVENT_CODE` (while verifying), `CAPI_INTERNAL_SECRET`,
  `GHL_API_TOKEN` (PIT) / `GHL_LOCATION_ID` / `GHL_CALENDAR_ID` / `GHL_ASSIGNED_USER_ID` /
  `GHL_CUSTOM_FIELD_IDS` (JSON id map) / `GHL_INBOUND_WEBHOOK_URL` + `GHL_LEGACY_WEBHOOK`,
  `GOOGLE_SERVICE_ACCOUNT_B64` / `GOOGLE_CALENDAR_ID_CONTRACTOR` / `_MAIN`, `STRIPE_SECRET_KEY` /
  `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*`, `GHL_WEBHOOK_SECRET`, `ADMIN_EMAILS`,
  `NETLIFY_AUTH_TOKEN`, `ANTHROPIC_API_KEY`.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` are auto-injected — don't set.
- Everything degrades gracefully: Google/GHL/Stripe/Netlify/Anthropic each **no-op when unset**.
- ⚠️ **Setting Edge secrets restarts ALL function isolates and kills in-flight generate-site builds** —
  never set secrets or redeploy generate-site mid-build.
- **Credential locations** (never ask the owner — find them): `SUPABASE_ACCESS_TOKEN` = Windows user
  env var (CLI + Management API). `ANTHROPIC_API_KEY` = platform.claude.com org "Ace Web Designers's
  Individual Org" (Google login hello@) — org needs credits. `NETLIFY_AUTH_TOKEN` = CLI token of
  **rhyanalmeida31@gmail.com** (the real Netlify account; the hello@ account is empty, PATs revoked).
  Google SA key JSON at `~/.secrets/ace-booking-calendar-*.json`. Main site Netlify id
  `4ea5b9c0-5a70-406f-a928-7f009290f519` (also git-linked to github.com/rhyanalmeida/acewebdesigners).

## GHL — messaging only, driven by our funnel
Every stage mirrors into GHL via v2 API (`_shared/ghl.ts` `ghlSyncStage`, skipped for `test`): upsert
contact with the same enriched attribution we send Meta (into custom fields by id from
`GHL_CUSTOM_FIELD_IDS`) + a stage **tag** — `funnel-lead` → `funnel-booked` → `funnel-showed` /
`funnel-noshow` / `funnel-purchased`. `book` also calls `createGhlAppointment` on `GHL_CALENDAR_ID`
(`MseWjwAf3rDlJRoj1p75`, contractor) → drives native Appointment-Created + reminders.
- Same email = **one** contact (upsert dedupes). Tags are **added** via `POST /contacts/{id}/tags`
  (accumulates), NOT the upsert `tags` field (which replaces). A closed deal carries all stage tags.
- **You build workflows in the GHL UI** (API can't create them; the PIT also lacks `workflows.readonly`
  — use Playwright UI for anything workflow-related). **Remove any CAPI action from GHL workflows** —
  CAPI is ours; leaving GHL's double-fires. Keep workflow **re-entry OFF** (both `stripe-webhook` and
  `result` add `funnel-purchased`; CAPI dedupes via `purchase_<appt>`).
- **Gotcha:** in the workflow builder, the Publish toggle is a *pending* change — click **Save** after
  toggling/editing or it silently reverts to draft.
- **Live workflows:** A "Appointment — Confirmation & Reminders" (Appointment-Created on the contractor
  calendar; confirmation immediate, 1h nudge, 24h reminder that skips for sub-24h bookings — copy uses
  consequence framing + preview-site tease, rewritten 2026-07-17 per RCT evidence), B "Nurture — New
  Lead" (`funnel-lead`, goal `funnel-booked`→END; 3 touches: 15min SMS → day-2 email → day-4 SMS →
  day-6 final SMS), C "Post-Meeting — Showed Follow-up" (`funnel-showed`), D "Onboarding — Purchased"
  (`funnel-purchased`), "No-Show — Rebook Follow-up" (`funnel-noshow` tag → immediate missed-you SMS →
  wait 2d → rebook SMS; tag set by `result` fn on No-Show), and "Internal — New Booking Alerts (Staff)"
  (staff SMS/email). The old "contractor appointment workflow" (had GHL-side CAPI, double-fired) stays
  **disabled** — do not re-enable. The calendar's native "Appointment booked" notification has
  **Contact** unchecked (Workflow A owns lead comms; staff alerts kept).
- **Verified 2026-07-17:** Workflow A delivers end-to-end (SMS "Delivered" in execution logs for both
  July no-shows) — the 0% show rate was genuine cold-lead behavior, not a comms failure.
- Confirmations show the Google Meet link via `{{appointment.meeting_location}}` (GHL auto-generates
  it; `book`'s GCal event adds none). Meet host = **hello@acewebdesigners.com** (GHL Linked calendar).
  GHL UI login = hello@ (same for the LeadConnector app).
- **Legacy relay:** `pushLegacyBooking` → `GHL_INBOUND_WEBHOOK_URL` fires while `GHL_LEGACY_WEBHOOK !==
  'false'`. No `GHL_INBOUND_WEBHOOK_URL` is set, so it's already a no-op; set `GHL_LEGACY_WEBHOOK=false`
  + redeploy `book` to formalize.

## Google Calendar — ✅ configured + verified
Service account `booking-calendar@ace-booking-calendar.iam.gserviceaccount.com` (GCP project
`ace-booking-calendar`), `GOOGLE_SERVICE_ACCOUNT_B64` = base64 of the key JSON. Both calendar ids =
`hello@acewebdesigners.com` (primary), shared with the SA at "Make changes to events". `slots` reads
freeBusy live (no cache); `book` creates the event. Key JSON at `~/.secrets/ace-booking-calendar-*.json`
(not in repo). (Re-doing gotchas: the org enforces `iam.disableServiceAccountKeyCreation` — override per
project after granting hello@ Org Policy Admin; Workspace external Calendar sharing must allow "change".)

---

# Verification (do in order)

1. **Deploy:** `supabase link`, `db push`, set secrets, `functions deploy` (all). Set `VITE_SUPABASE_*`
   in Netlify + redeploy.
2. **CAPI test event (proof step):** POST `/functions/v1/capi` with `x-capi-secret` + a `testEventCode`
   → hashed server `Lead` in Events Manager → dataset `4230021860577001` → Test Events, fbc/fbp non-blank.
3. **End-to-end booking:** load `/contractorlanding?fbclid=test123`, book → (a) browser+server `Lead`
   share one `event_id`, (b) `contacts`+`appointments` rows, (c) GCal event, (d) GHL confirmation fires.
4. **Result form:** /admin → Showed → `CompleteRegistration`; Purchase + upfront/recurring → `Purchase`.
   These are `system_generated` (offline) — verify in Events Manager → live Activity / the CAPI log,
   NOT Test Events.
5. **Regression:** `npm run build`, `npm run lint`, `npm run test`.

# Troubleshooting

| Symptom | First check |
|---|---|
| No server Lead in Test Events | `META_CAPI_TOKEN` set + bound to `4230021860577001`? `capi` returns ok? |
| Booking fails / "unavailable" | `VITE_SUPABASE_*` set? `slots`/`book` deployed? `availability` rows exist + in window? |
| Calendar looks empty | check window (4h min / 7-day) + `availability` hours vs. now; Google freeBusy may be blocking |
| Low match quality / `fbp` blank | form sending fbc/fbp (same-origin cookies)? see `getAttribution` |
| Preview site stuck building | /admin Retry (mints admin JWT); check `ANTHROPIC_API_KEY` credits + `site_status` |
| GHL messages not firing | workflow Appointment-Created trigger on `GHL_CALENDAR_ID`? `book` created the GHL appt? Save-after-Publish? |
| Can't load `/admin` | signed in with an `ADMIN_EMAILS` address? functions deployed with `verify_jwt`? |
| Marketing-API / ads scripts erroring | `META_ADS_TOKEN` expired or read-only — regenerate / use Ads Manager UI |
