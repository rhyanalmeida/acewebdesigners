# CLAUDE.md — acewebdesigners

React + Vite + TypeScript marketing site (Tailwind, Framer Motion, react-helmet-async),
frontend on **Netlify**. Backend is **Supabase** (Postgres + Edge Functions). Runs
**Facebook/Instagram ads only** — no Google Ads, no GA4.

We **own the whole funnel now**: our own booking scheduler, our own lead database, and our own
server-side **Meta Conversions API**. GHL is kept only as the **messaging/comms engine**: we mirror
every funnel stage into GHL (v2 API) — upserting an enriched contact + a per-stage tag
(`funnel-lead`/`funnel-booked`/`funnel-showed`/`funnel-purchased`) and creating a real GHL
appointment on booking — so marketing/comms workflows (confirmations, reminders, nurture, onboarding)
can be built **in the GHL UI** and triggered by those tags + native Appointment-Created. All GHL ties
are isolated in one module (`_shared/ghl.ts`) so they can be cut later. (Historically GHL owned
booking + CRM + CAPI; that has been replaced.)

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
  scheduler UI (src/components/scheduler): gate form → Lead, then calendar → Schedule
  + browser pixel (PageView/ViewContent + Lead/Schedule w/ shared event_id)
        │  VITE_SUPABASE_URL / ANON_KEY
        ▼
Supabase Edge Functions (supabase/functions, Deno)
  slots          open slots = availability − booked − Google busy (30-min slots, 24h min notice)
  lead           gate-form step: upsert contact (durable attribution) → CAPI Lead
  book           validate → upsert contact → insert appointment → CAPI Schedule → GCal event → GHL relay
  result         admin: No-Show / Showed / Purchase → CAPI CompleteRegistration / Purchase
  admin-data     admin: dashboard payload (health + stats + lists)
  capi           guarded manual/test CAPI endpoint (verification) + admin retry of failed events
  create-checkout / stripe-webhook   Stripe deposit → Purchase CAPI
  ghl-webhook    logs GHL messaging sends (visibility)
  _shared/*      meta.ts (CAPI engine), contacts.ts (upsert), attribution.ts (utm/ad-id parse),
                 google.ts, ghl.ts (v2 API: ghlSyncStage = upsert+tag+custom fields,
                 createGhlAppointment, pushLegacyBooking), availability.ts, identity.ts, adminAuth.ts
        ▼
Supabase Postgres: contacts · appointments · availability · capi_events (dedup/audit) · ghl_messages
        ▼ external sinks
Meta CAPI · Google Calendar · Stripe · GHL (messaging only)
```

**Funnel + dedup model:** four events, each at its logical moment:
`Lead` (gate form) → `Schedule` (slot booked) → `CompleteRegistration` (Showed) → `Purchase` (closed).
The two website events are dual-fired and deduped by a shared `event_id`: the browser fires `Lead`
(`trackLead`) and the `lead` fn fires the same id; the browser fires `Schedule` (`trackSchedule`)
and `book` fires the same id. Post-meeting events reuse the lead's stored attribution: `cr_<appt>`
(CompleteRegistration) and `purchase_<appt>` (Purchase) derive from the appointment id, so the
result form and Stripe webhook can't double-count.

**Attribution durability:** the `contacts` row is the durable attribution record — it holds
fbc/fbp/fbclid AND client_ip/client_user_agent/landing_url/utm (jsonb). The `utm` jsonb captures the
Ads Manager URL template (`utm_source/medium/campaign/content` + `campaign_id/adset_id/ad_id`).
First-touch params are persisted client-side to `sessionStorage` (`getAttribution`) so SPA nav can't
drop them. `lead`/`book` write it (shared `contacts.ts` + `attribution.ts`); every downstream event
replays it. Match *quality* comes from user_data (email/phone/fbc/fbp/ip/ua); the ad ids are
attribution context, sent in custom_data.

**Test mode:** booking with `test: true` flags the appointment + its `capi_events` rows `is_test`,
routes every downstream event (Lead AND later CR/Purchase/Stripe) to Meta **Test Events**, skips
GCal + GHL, and is excluded from all `/admin` stats (badged `TEST` in lists). `META_TEST_EVENT_CODE`
is read **only** by explicit test paths — `meta.ts` never falls back to it for live events (a prior
footgun: keeping the secret set would have test-routed all production conversions).

**`action_source` split** (`_shared/meta.ts`, `defaultActionSource`): `Lead` (gate form) and
`Schedule` (slot booked) → `'website'` (they happen on the site, dedupe with the browser pixel, and
render in Test Events). `CompleteRegistration` (Showed) and `Purchase` (closed) → `'system_generated'` —
they happen **offline** (on a call / in the CRM). Offline events are still received and attributed
to ads via matched PII (email/phone/fbc), but they **do NOT appear in the Test Events channel UI** —
verify them in Events Manager → live Activity, or in `/admin`. Don't "fix" their absence from Test
Events by flipping them to `'website'`; the offline classification is intentional.

**Admin dashboard:** `/admin` (lazy route in `App.tsx`). Supabase **email + password** login
(`signInWithPassword`), with a magic-link fallback ("Email me a sign-in link instead"); the email
must be in `ADMIN_EMAILS`. Three tabs: **Overview** (whole-business KPIs + setup warnings +
integration health), **Website** (booking funnel, appointments with a **Result** action —
Showed / No-Show / Purchase with upfront + recurring $ + plan — a **Meta server events** panel
(Lead / Booked / Showed / Purchase cards: sent · failed · pending · last event), the CAPI log, and
recent GHL messages), and **Social Media** (paid FB/IG-attributed funnel + per-campaign breakdown).
The Result modal confirms per-event Meta acceptance after saving; the CAPI log shows
`✓ Meta got it` (events_received=1) / `⚠ unconfirmed`, error messages, `test` badges, and a
**Retry** button that re-fires failed/pending events from stored attribution (`capi` fn,
`{ retryEventId }`, admin JWT). Stats exclude `is_test` rows. The Result modal has a **"Test"
checkbox** (2026-07-06): `result` fn `test:true` flags the appointment + its capi_events `is_test`,
routes that result's Meta events to Test Events, and skips GHL — for dry-runs on a live booking.
A **"Discard test data"** button (appears when test appointments exist) permanently deletes all
`is_test` appointments + capi rows (contacts kept): `admin-data` POST `{action:'discardTests'}`;
CLI: `node scripts/funnel-admin.mjs discard-tests`.

## Status

**Preview websites build via the LOCAL HOURLY CLAUDE CODE BUILDER (2026-07-13, owner's choice —
subscription usage instead of API tokens; VERIFIED end-to-end same day).** `book` marks every real
booking `site_status='queued'`; Windows Task Scheduler task **`AcePreviewSiteBuilder`** (hourly at
:23 local, first run 2026-07-13 12:23 EDT) runs `scripts/run-preview-builder.ps1` → headless
`claude -p` (model sonnet) with `scripts/preview-site-builder-prompt.md` — the prompt is **piped
via stdin** (passing it as an argument truncates it at the first embedded double-quote; that bug
made the 12:23 scheduled run do nothing — fixed same day). Logs:
`%LOCALAPPDATA%\ace-preview-builder\builder.log`. The builder polls the **`site-queue`** Edge fn
(deployed `--no-verify-jwt`, auth `x-queue-secret` = `SITE_QUEUE_SECRET` — a narrow secret that can
ONLY list queued jobs + claim/complete/fail the site fields; in `supabase/.env` + Edge secrets),
builds the multi-page site, zip-deploys to Netlify, and stamps `preview_url`/`deployed`. Netlify
token is read live from `%APPDATA%\netlify\Config\config.json` (the CLI rotates it) with fallback
to + self-heal of `NETLIFY_AUTH_TOKEN` in `supabase/.env`. Jobs: queued rows + `generating` stalled
>2h; max 2 per run. Verified live 2026-07-13: forced test booking "Granite State Roofing" →
https://preview-granite-state-roofing-a50774.netlify.app (deployed, DB stamped, HTTP 200).
The earlier claude.ai **cloud routine** `trig_01GpLg6F7V7hJAeHzdnTbyGX` is **DISABLED**
(its embedded Netlify token rotated → 401; left enabled it would claim queued jobs at :07 UTC and
mark them `failed` before the local builder ran — failed rows are never re-listed). Re-enable only
with a stable Netlify PAT embedded. The `generate-site` fn below stays deployed but DORMANT (503
without `ANTHROPIC_API_KEY`; setting that secret makes `book` also trigger it immediately for
instant builds — the builder then finds nothing queued).
NOTE: the /admin Retry button calls `generate-site` (503 while dormant) — to retry a failed
build, set the row's `site_status='queued'` via SQL and let the hourly builder take it.

**Business name/type on booking + auto-generated preview websites 2026-07-13.** The gate form (both funnels, shared `Scheduler.tsx`) now REQUIRES
**Business name** + **Type of business** (datalist of ~15 trades, free text allowed) → stored on
`contacts.business_name/_type` (migration `0006`), synced to GHL as native `companyName`, shown in
/admin tables. Every real booking auto-builds a **multi-page preview website** (Home / Services /
About / Contact + shared `styles.css` micro-animations + `main.js`): `book` fire-and-forgets the new
**`generate-site`** Edge fn (auth `x-internal-key` = service-role, or admin JWT for /admin Retry;
deployed `--no-verify-jwt`), which runs **Claude Opus 4.8** in **3 chained self-invocations** (each
isolate gets its own ~400s budget: ① styles+js+home ② services+about ③ contact→deploy) and deploys
via `_shared/netlify.ts` (file-digest API, new site `preview-<slug>-<hex>.netlify.app`, `ssl_url` →
`appointments.preview_url`; status queued/generating/deployed/failed/deleted in `site_status`).
/admin appointment rows have a **Website** column (Preview open/Copy · Building spinner · Failed/
Stalled>10min + Retry · removed) + Netlify health chip; **No-Show deletes the Netlify site**
(`result` fn). Test bookings skip generation (force-able); no-ops without secrets — booking never
blocked. Cost ≈ $1-1.50/booking (~35-55k output tokens). `NETLIFY_AUTH_TOKEN` = the **Netlify CLI
token of rhyanalmeida31@gmail.com** (the real Netlify account; from `%APPDATA%/netlify/Config/
config.json`) — set as Edge secret + saved in `supabase/.env`; the hello@ Netlify account is empty,
its PATs were revoked. `ANTHROPIC_API_KEY` is deliberately NOT set (owner chose subscription
routine over API billing) — generate-site + the restaurant `generate-copy` 503 until it is.
Gotcha: the Management-API service_role key does NOT match the runtime-injected
`SUPABASE_SERVICE_ROLE_KEY`, so external `x-internal-key` calls to generate-site 401 — use an
admin JWT (mint like `funnel-admin.mjs`); book's internal trigger compares the same env var
against itself and is unaffected.

**Customer Overview + Conversion Log tabs 2026-07-10.** `/admin` gained a **Customer Overview** tab
(segment picker: Leads / Showed / No-shows / Purchased — leads table with journey-stage badge +
paid-social source, appointment segments reuse the Result/Pay-link table) and a **Conversion Log**
tab (Meta server-event cards + the CAPI log, moved out of Website). Appointment rows now show a
**Contractor / Main site** badge (`calendar` column) alongside Paid social/Direct — funnel isolation
itself was verified sound: only `/contractorlanding` books `calendar:'contractor'`; main Landing +
Contact book `'main'`, and `withDefaultAdIds` only stamps `source=landing-contractors` URLs.
`admin-data` now returns `contactsList` (300 most recent contacts) — **deployed**; frontend changes
need a Netlify redeploy. Result-modal button now reads "Save (no Meta event)" when No-show is selected (behavior
was always correct — `result` fn sends nothing to Meta for no-shows; only Showed→CR and
Purchase→Purchase fire). Purged the 3 pre-launch test appointments + their capi rows via SQL
(contacts kept); DB now holds only real bookings.

**Contractor ad UTM enrichment LIVE 2026-07-06.** The "funny hook" ad's URL-parameters template
(`utm_source=Facebook&…&ad_id={{ad.id}}`) is **published** in Ads Manager (new creative
`28673219328945083` on ad `120242709687350259` — verified via Graph API `url_tags`). Campaign was
renamed **"Free Website Offer For Contractors (6/1/26)"** (same id `120241554190170259`; the old
name breaks `meta-ads-status.mjs`'s exact-name match). Also added a **server-side fallback**
(`_shared/attribution.ts` `withDefaultAdIds`, wired into `lead`+`book`, deployed): a landing URL
with `source=landing-contractors` and no utm/ids gets stamped with the known campaign/adset/ad ids
of the one running ad — real UTM params win when present. Verified with a `test:true` lead
(contact utm fully stamped, CAPI `events_received=1`). The account's past-due balance was paid
2026-07-06 (a "Payment error" had been blocking all Ads Manager publishes with error #1487194).
NOTE: `META_ADS_TOKEN` can READ everything but cannot create/update ads or creatives — publish via
Ads Manager UI (Playwright). Cleanup same day: `meta-ads-status.mjs` now looks up campaign/adset/ad
by ID (name-matching broke on rename) and reports whether url_tags are set; removed the dead legacy
GHL `form_embed.js` from `index.html` (was CSP-blocked anyway); `VITE_SUPABASE_URL`/`_ANON_KEY` are
now set in BOTH Netlify env and `.env.local` (a deploy briefly shipped a bundle built without them —
"Supabase is not configured"; always build with these present). Remaining console CSP errors on the
live site are Meta pixel *telemetry* (`mpc2-*.run.app`) — harmless, pixel events still deliver. Two real Leads on 06-23 failed CAPI with "dataset 1703925480259996
does not exist / no permission" — the CAPI token only writes to the contractor dataset; main-site
leads' CAPI has never worked (known, low priority — only contractor is ad-driven).

**Restaurant self-serve funnel 2026-06-29 — code complete, deploy pending.** A THIRD, FULLY
ISOLATED ad funnel (own pixel + own dataset + own GHL sub-account + own ad set + own page) —
nothing crosses into contractor/main. Self-serve: a guided wizard with live preview → monthly
Stripe **subscription** (no booking, no appointment). `/buildyoursite` page (`BuildYourSite.tsx` +
`components/builder/RestaurantWizard.tsx`, bare page in `App.tsx`; config in
`config/restaurantPlans.ts`: 3 plans starter/pro/premium + cuisines/sections/themes).
- **Pixel:** new `RESTAURANT_PIXEL` in `config/pixels.ts` (⚠️ id is a placeholder — paste the real
  Events-Manager pixel id). `index.html` skips the main pixel on `/buildyoursite` (like
  `/contractorlanding`); `initializeRestaurantPixel()` loads ONLY that pixel; `<noscript>` uses it.
- **Dataset:** `meta.ts` `Dataset` += `'restaurant'` → `META_DATASET_ID_RESTAURANT`.
- **Funnel:** wizard gate fires deduped `Lead` (browser `trackLead` + `lead` fn with
  `calendar:'restaurant'`, shared event_id, restaurant dataset) → plan pick calls new
  `create-subscription` Edge fn (`mode:'subscription'`, plan KEY → `STRIPE_PRICE_{STARTER,PRO,
  PREMIUM}` secret, ties to the **contact**) → `stripe-webhook` subscription branch fires `Purchase`
  (system_generated, `dataset:'restaurant'`) via `loadContactIdentity` + GHL `funnel-purchased`,
  dedup key `purchase_sub_<subId>`.
- **GHL:** SAME account, isolated by its own TAG SET via `ghlSyncStage({ funnel:'restaurant' })` →
  `restaurant-lead`/`-booked`/`-showed`/`-purchased` (not `funnel-*`), so restaurant leads never
  enroll in contractor workflows. No extra GHL secrets — isolation is by tag, not account.
  **Workflows BUILT + PUBLISHED 2026-06-29 (Playwright, location A2zlaOOL5JLn883XGWWl):**
  **"Restaurant — New Lead"** (trigger: Contact Tag added = `restaurant-lead` → welcome email) and
  **"Restaurant — Purchased (Onboarding)"** (trigger: Contact Tag added = `restaurant-purchased` →
  onboarding email). Both live; add SMS/nurture steps in the GHL UI as desired.
Build + lint + 14 tests green. **Restaurant pixel/dataset CREATED 2026-06-29** via Playwright in the
Ace Web Designers business (act_553999801104558): **"Restaurant Builder CAPI" = `1575254990791923`** —
wired into `pixels.ts` + `META_DATASET_ID_RESTAURANT` (**secret SET in Supabase 2026-06-29**). (Note: there are TWO business portfolios on
this FB login — "Ace Web Designers" [biz `1231765388396950`, act `553999801104558`, the production one
with the real pixels] and a stray account `1257978982125338` under "Other assets" with unrelated
"ace landing page"/"contractor"/"Claude Ad Set Up" pixels — make sure you're in the Ace Web Designers
portfolio.) **To go live:** (1) create 3 recurring Stripe Prices → `STRIPE_PRICE_*`; (2) confirm
`META_CAPI_TOKEN` can write to dataset `1575254990791923` (if it's a dataset-scoped token, generate a
CAPI token on the new dataset and use a system-user token, or add a per-dataset token) + set
`META_DATASET_ID_RESTAURANT`; (3) build the GHL workflows on the `restaurant-*` tags; (4) `supabase
secrets set` + `npx supabase functions deploy lead create-subscription stripe-webhook`; (5) redeploy
Netlify; (6) the FB campaign DRAFT below — swap creative + publish. **Safety hardening:**
`datasetId()` in `meta.ts` no longer falls back to the contractor pixel for `main`/`restaurant` — a
missing `META_DATASET_ID_RESTAURANT` now fails loudly (error row in /admin) instead of polluting the
contractor dataset. **Test mode:** `/buildyoursite?test=1` flows `test:true` through `lead` +
`create-subscription` → Meta **Test Events** + GHL skipped (Lead step is charge-free; the Purchase
step still hits real Stripe unless STRIPE keys are test-mode). **Note:** `META_ADS_TOKEN` in
`.env.local` is READ-ONLY (lacks `ads_management`) — can't create pixels/ads via Marketing API;
assets must be made via Playwright UI or with a regenerated token.

**AI copywriting (optional) added 2026-06-29 — cost-controlled.** The wizard's Style step has an
optional **"Write my copy with AI"** button that fills the live preview's tagline + description +
3 sample menu items in ONE call. New Edge fn `generate-copy` (`npm:@anthropic-ai/sdk`): model
**`claude-haiku-4-5`** (cheapest; swap MODEL→`claude-opus-4-8` for higher quality), `max_tokens:400`,
structured-JSON output, input clamping, best-effort per-IP cooldown; client caps **5 uses/session**
and only fires on explicit click. Key is server-side `ANTHROPIC_API_KEY` (no-ops 503 when unset — the
builder works without AI). Deploy: `npx supabase functions deploy generate-copy` + set the secret.
The funnel itself uses NO AI — preview is a static template; AI is a bolt-on perk.

**Restaurant ad campaign DRAFTED 2026-06-29 (Playwright, NOT published — $0 spend).** In Ads Manager
(act_553999801104558): campaign **"Restaurant Builder — Leads"** (objective Leads, Advantage+ campaign
budget **$10/day**) → ad set **"Restaurant Builder — US — Leads"** (conversion location Website,
dataset **Restaurant Builder CAPI 1575254990791923**, conversion event **Lead**, audience broad/US
default) → ad **"Restaurant Builder — Ad 1"** (Page: Ace Web Designers, draft copy + headline +
description, URL `https://acewebdesigners.com/buildyoursite?source=restaurant-ad`, CTA Sign up,
auto-attached PLACEHOLDER image). Sits as **"In draft" / "Review and publish (3)"** — do NOT publish
until: `/buildyoursite` is deployed to Netlify, the real creative image/video is swapped in, and the
restaurant pixel is confirmed firing. Started on **Leads** (new pixel has no Purchase history); switch
the ad set to Purchase once purchases accrue.

**GHL funnel-mirror pass 2026-06-22 — DEPLOYED.** Rewrote `_shared/ghl.ts` from a single booking
inbound-webhook to the GHL **v2 API** (PIT in `GHL_API_TOKEN`, integration "Funnel Sync (Supabase)",
scopes: contacts r/w, locations/customFields r/w, calendars/events r/w): `ghlSyncStage` (upsert
contact + stage tag + enriched custom fields), `createGhlAppointment` (real GHL appt on booking), and
`pushLegacyBooking` (the old webhook, now behind `GHL_LEGACY_WEBHOOK`). Wired all four stages —
`lead`→`funnel-lead`, `book`→`funnel-booked`+appt+legacy, `result`→`funnel-showed`/`funnel-purchased`,
`stripe-webhook`→`funnel-purchased`; all skip `test`. `scripts/ghl-setup-custom-fields.mjs` created
the 18 attribution custom fields; `GHL_CUSTOM_FIELD_IDS` + the GHL secrets are set; `lead book result
stripe-webhook admin-data` deployed; GHL contact upsert + tag + custom fields verified live (then the
verify contact was deleted).

**GHL workflows built + proven live 2026-06-22.** The four GHL-UI workflows are built, **published**,
and verified end-to-end: **A** "Appointment — Confirmation & Reminders" (trigger: *Customer booked
appointment*, filtered to the contractor calendar `MseWjwAf3rDlJRoj1p75`) — confirmation SMS+email fire
immediately on an API-created appt (the same call `book` makes), the **1h nudge fires exactly at 1h
before**, and the 24h reminder gracefully **skips for sub-24h bookings** (wait step: "if date passed →
skip outbound till next wait"), so same-day bookers aren't stalled; **C** "Post-Meeting — Showed
Follow-up" (`funnel-showed`) and **D** "Onboarding — Purchased" (`funnel-purchased`) each enroll + send
once; **B** "Nurture — New Lead" (`funnel-lead`, goal `funnel-booked`→END) enrolls on the lead step and
correctly **goal-exits when the contact books** (it nurtures only un-booked leads). **Gotcha that cost a
prior session:** the builder's Publish toggle creates a *pending* change — you must click **Save** after
toggling (and after editing any action) or the publish silently reverts to draft. **Duplicate-confirmation
fix:** the contractor calendar's native "Appointment booked (Confirmed)" notification had **Contact**
checked on Email+SMS, double-messaging leads alongside Workflow A; **Contact** is now unchecked on both
(Assigned user / Additional kept) so Workflow A owns lead comms while staff still get booking alerts. The
old "contractor appointment workflow" (had GHL-side Meta CAPI actions that double-fired) stays
**draft/disabled** — do not re-enable.

**Internal booking alerts (2026-07-06).** New standalone GHL workflow **"Internal — New Booking
Alerts (Staff)"** (published; trigger: *Customer booked appointment* on the contractor calendar,
same as Workflow A but fully separate so client-facing messages can't be disturbed): internal SMS
to +1 774-329-3117 + internal SMS to +1 508-308-2714 + internal email to hello@acewebdesigners.com,
each with contact name/phone + appointment time merge fields. Workflow A untouched (last-updated
timestamp still Jun 22). Booking window also changed 2026-07-06: `availability.ts` min notice
**4h**, max advance **24h** (both enforced server-side via `computeOpenSlots`, which `book`
validates against); slots remain 30 min.

**GHL Meet host switched to hello@ (2026-07-09).** GHL's auto-generated Meet links were hosted by
**rhyanalmeida31@gmail.com** (the GHL user's connected Google account) — joining as hello@ hit
"ask the host for permission" (that happened live on a client call; workaround: join as
rhyanalmeida31@gmail.com, it's the host). Fixed in Settings → Calendars → Connections: reconnected
the expired hello@acewebdesigners.com Google connection, set **Linked calendar = hello@** (rhyan…31
auto-removed from linked+conflict; hello@ is now the conflict calendar too), and Video conferencing →
Google Meet now shows **hello@acewebdesigners.com**. Sync stays default one-way (blocked slots only,
no contact creation), so `book`'s service-account events on hello@ won't re-import as appointments.
GHL UI login = hello@acewebdesigners.com (same credentials for the LeadConnector mobile app).

**Meeting link in confirmations (2026-06-22).** All five Workflow A messages (confirmation SMS+email, 24h
reminder SMS+email, 1h nudge) now show the **Google Meet join link** via `{{appointment.meeting_location}}`
(GHL auto-generates one per appointment; `book`'s Google Calendar event adds no competing Meet link) and
**no longer advertise the reschedule link** — verified it renders the real `meet.google.com/…` URL.
Rescheduling is still possible at the calendar level (just not promoted).

**Full funnel verified LIVE end-to-end (2026-06-22).** Drove the real Edge Functions and confirmed BOTH
sides of every stage: **offline conversions** — `Lead`/`Schedule`/`CompleteRegistration`/`Purchase` all
landed in `capi_events` with `status=sent`, `is_test=false`, `events_received=1`, correct `action_source`
(`website` for Lead/Schedule, `system_generated` for CR/Purchase), Purchase `value=1500`, and CR dedupes on
the Purchase call; **notifications** — the GHL contact accrued all four stage tags and all four workflows
enrolled (A confirmation+reminders, B enrolled→goal-exited, C showed, D purchased) with messages sent and
merge fields rendered. **Verification tooling** (kept in `scripts/`): `funnel-verify.mjs` (calls
`slots`/`lead`/`book` with the public anon key + the `capi` retry-dedup check), `funnel-admin.mjs` (mints a
short-lived admin session — service_role fetched from the Management API → GoTrue magiclink → `result`). Note:
the **Supabase MCP is unauthorized**, but the **Management API SQL endpoint works with `SUPABASE_ACCESS_TOKEN`**
(`POST https://api.supabase.com/v1/projects/<ref>/database/query`) — that's how `capi_events` is read; the
`CAPI_INTERNAL_SECRET`/`META_CAPI_TOKEN` are NOT in the local `supabase/.env` (commented placeholders — real
values live only in Supabase secrets). Live test data was flagged `is_test=true` (appointment + its
`capi_events`) to keep `/admin` stats clean; the 4 Meta conversions are irreversible — exclude when reading
reports. **Remaining:** once happy, set `GHL_LEGACY_WEBHOOK=false` + redeploy `book` (note: no
`GHL_INBOUND_WEBHOOK_URL` is set, so the legacy relay is already a no-op).

**Funnel-split pass 2026-06-15 — code complete, deploy pending.** Split the entangled
booking-Lead into a clean four-step funnel (Lead at the gate form → Schedule at booking →
CompleteRegistration → Purchase); added the `lead` Edge Function, shared `contacts.ts` +
`attribution.ts`, durable contact attribution (migration `0004_contact_attribution.sql`:
client_ip/client_user_agent/landing_url/utm), first-touch UTM capture, and a "Booked" admin card.
Builds on the un-deployed 06-10 hardening pass (`0003_is_test.sql`, META_TEST_EVENT_CODE live
fallback removed, admin retry on `capi`). Build + lint + 14 tests green (Deno not installed locally
— `deno check` runs at deploy). **Still to run** (auth is wired via the saved `SUPABASE_ACCESS_TOKEN`
user env var): `npx supabase db push` (applies `0003` + `0004`), then deploy
`lead book result stripe-webhook capi admin-data`, redeploy the Netlify site, then a `test:true`
end-to-end (Lead + Schedule rows) + mark Showed/Purchase. Ads: repoint the ad set's optimization
event toward `Schedule` once volume accrues. Set the ad URL template in Ads Manager:
`utm_source=Facebook&utm_medium={{adset.name}}&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}`.

---

# Meta — pixels & campaign (✅ verified facts)

Ad account `act_553999801104558`, business "Ace Web Designers". Source of truth: `src/config/pixels.ts`.

| Pixel / dataset | Role |
|---|---|
| `4230021860577001` (Contractors Nationwide) | **CONTRACTOR dataset** — `/contractorlanding` + its CAPI |
| `1703925480259996` (Ace Web Designers Landing) | **MAIN pixel** — everywhere except `/contractorlanding` |
| `1548487516424971` | **DEAD** — do not use (caused the old 0-leads bug) |

- Campaign `Free Website Offer For Contractors (6/1/26)` — id `120241554190170259` — **ACTIVE**.
- Ad set (current) `120242709687340259` `Contractors — US — Advantage+ Audience — $20/day - Copy` —
  `OFFSITE_CONVERSIONS` / `LEAD`, `promoted_object.pixel_id = 4230021860577001` ✅ — **ACTIVE**.
  **Targeting went fully broad 2026-07-06** (published via Ads Manager UI): removed all detailed-targeting
  suggestions (interests Home improvement/Construction, behavior Small business owners, job titles
  Owner/President/Founder/CEO) — `targeting` is now just US + `advantage_audience: 1` + age 25–65
  (a soft *suggestion*; the min-age dropdown doesn't go below 25 on this ad set, and Meta delivers
  beyond suggestions anyway). Per owner: let Advantage+ decide, no custom targeting. Next lever for
  booked meetings: switch conversion event Lead → Schedule once ~10+ Schedule events/week accrue.
- Ad (the only live one): `funny hook` — id `120242709687350259`, video + 6 copy variants,
  UTM url_tags published 2026-07-06. All other campaigns/ad sets stay PAUSED.
- Ad destination: `https://acewebdesigners.com/contractorlanding?source=landing-contractors`
  (+ the UTM template appended by Meta at click time).
- The "spend / 0 leads" bug was the ad set optimizing a pixel the page never fired. Current ad set
  is bound to the pixel the page fires — keep it that way.

---

# Environment / secrets

- **Client (`.env.local` dev, Netlify build env):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Supabase Edge secrets** (`supabase/.env` → `supabase secrets set`; template in
  `supabase/.env.example`): `META_CAPI_TOKEN`, `META_DATASET_ID` (=4230021860577001),
  `META_DATASET_ID_MAIN`, `META_TEST_EVENT_CODE` (while verifying), `CAPI_INTERNAL_SECRET`,
  `GHL_API_TOKEN` (PIT) / `GHL_LOCATION_ID` / `GHL_CALENDAR_ID` / `GHL_ASSIGNED_USER_ID` (required for
  appt create) / `GHL_CUSTOM_FIELD_IDS` (JSON id map) / `GHL_INBOUND_WEBHOOK_URL` +
  `GHL_LEGACY_WEBHOOK` (legacy relay flag), `GOOGLE_SERVICE_ACCOUNT_B64` /
  `GOOGLE_CALENDAR_ID_CONTRACTOR` / `_MAIN`, `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`,
  `GHL_WEBHOOK_SECRET`, `ADMIN_EMAILS`, `NETLIFY_AUTH_TOKEN` (auto preview websites) +
  `ANTHROPIC_API_KEY` (generate-site + generate-copy).
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` are auto-injected — don't set.
- Everything degrades gracefully: Google/GHL/Stripe each **no-op when unset**, so you can ship
  booking + CAPI first and add the rest incrementally.

## GHL: messaging only, driven by our funnel
Every funnel stage mirrors into GHL via the v2 API (`_shared/ghl.ts`, `ghlSyncStage`), skipped for
`test` bookings: it upserts the contact with the **same enriched attribution we send Meta** (fbc/fbp/
fbclid, client ip/ua, landing_url, full utm/campaign/adset/ad ids, + deal value/plan at purchase) into
GHL **custom fields** (by id, from `GHL_CUSTOM_FIELD_IDS`) and applies a stage **tag**:
`funnel-lead` (`lead` fn) → `funnel-booked` (`book`) → `funnel-showed` / `funnel-purchased` (`result`;
Stripe also tags `funnel-purchased`). `book` additionally calls `createGhlAppointment` to put a real
appointment on `GHL_CALENDAR_ID` (drives GHL-native Appointment-Created + reminders).

Same email across stages = **one** GHL contact (upsert dedupes on email; later stages update the
original, never duplicate). Tags are **added** via `POST /contacts/{id}/tags`, NOT via the upsert
`tags` field — upsert *replaces* the whole tag set, which would wipe earlier stages; the `/tags`
endpoint accumulates, so a closed deal carries all of `funnel-lead`→`funnel-purchased` and each "tag
added" trigger fires once. (`stripe-webhook` and `result` both add `funnel-purchased`; keep workflow
**re-entry OFF** so onboarding can't run twice — CAPI itself dedupes Purchase via `purchase_<appt>`.)

**You build the workflows in the GHL UI** (the API can't create workflows — verified), triggered by:
`funnel-lead` → nurture; **Appointment-Created** → confirmation + reminders + internal notify;
`funnel-showed` → follow-up; `funnel-purchased` → onboarding. **Remove any CAPI action from GHL
workflows** — CAPI is ours; leaving GHL's would double-fire. One-time setup: run
`node scripts/ghl-setup-custom-fields.mjs` → `supabase secrets set GHL_CUSTOM_FIELD_IDS=...`.

**Legacy relay:** the original inbound-webhook (`pushLegacyBooking` → `GHL_INBOUND_WEBHOOK_URL`) still
fires on booking while `GHL_LEGACY_WEBHOOK !== 'false'`, so confirmations/reminders never lapse during
cutover. Once the GHL-native workflows are verified, set `GHL_LEGACY_WEBHOOK=false` and redeploy `book`.
Optionally add a GHL "Webhook" action → `/functions/v1/ghl-webhook` (with `GHL_WEBHOOK_SECRET`) so
message sends show up in the dashboard.

## Google Calendar
Service account (`GOOGLE_SERVICE_ACCOUNT_B64` = base64 of the JSON key). Share the business calendar
with the service-account email, "Make changes to events". `slots` queries freeBusy live (no cache);
`book` creates the event. **✅ CONFIGURED + VERIFIED 2026-07-06** (was never set up before — the old
local values were placeholders). GCP project `ace-booking-calendar` (org acewebdesigners.com,
id 824553914744), service account **`booking-calendar@ace-booking-calendar.iam.gserviceaccount.com`**,
Calendar API enabled. Both calendar IDs = `hello@acewebdesigners.com` (the primary calendar), shared
with the SA at "Make changes to events". Verified live: freeBusy read + event create/delete all OK;
`/admin` health shows all four integrations green. Setup gotchas that were solved (relevant if
re-doing): the org enforces `iam.disableServiceAccountKeyCreation` — overridden to *Not enforced* on
this one project (needed granting hello@ **Organization Policy Administrator** at org level first);
Workspace Calendar sharing was capped at free/busy — Admin Console → Calendar → Sharing settings →
external sharing raised to "Share all information, and outsiders can change calendars". Key JSON is
at `~/.secrets/ace-booking-calendar-*.json` (NOT in the repo); real B64 + calendar ids are in
`supabase/.env` and set as Supabase secrets; `slots book` redeployed.

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
