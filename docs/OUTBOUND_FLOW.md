# Outbound cold-email demo funnel — the whole flow (runbook)

**Read this when working on anything outbound.** CLAUDE.md keeps only a short pointer so new
agents are not loaded with this detail. Record CURRENT state here, not a changelog.
Companion docs: `OUTBOUND_LAUNCH_PLAN_2026-08-30.md` (phase checklist, historical),
`OUTBOUND_COLD_SEQUENCE_v4_DRAFT_2026-09-22.md` (the live email copy — single source),
`MASTER_PLAN_OUTBOUND_REDESIGN_2026-09-22.md` (copy research).

## 1. One-screen picture

```
Apify Google Maps scrape ──► enrich emails (our crawler) ──► import-prospects ──► prospects table
      │  (scripts/apify-scrape-contractors.mjs)   (scripts/enrich-emails.mjs)   (scripts/import-prospects.mjs)
      ▼
export-instantly --limit N ──► instantly-upload-leads ──► Instantly campaign "Outbound — Contractors v2"
      (stamps emailed_at)        (POST /leads/add)         3-step v4 sequence, 06–16 ET weekdays, 30/inbox/day
                                                                     │ prospect replies
                                                                     ▼
instantly-poll fn (pg_cron, 15 min) ──► instantly-webhook fn ──► classify yes/no/unknown
                                                 │                      │
                                                 │                      ├─ every reply → GHL contact + `outbound-lead` tag
                                                 │                      │   → GHL workflow "Outbound — Interested Lead" (staff SMS + email)
                                                 │                      └─ YES (non-test, non-suppressed) → site_status none→generating
                                                 │                            → generate-site (3-stage Opus chain → Netlify preview)
                                                 ▼
          poller tick: auto_send_pending → POST /emails/reply IN-THREAD from the receiving inbox
          (demo link + $49/mo + what's included) → demo_link_sent stamps demo_link_sent_at (once)
                                                                     │ prospect clicks
                                                                     ▼
/demo/<token> page (DemoPage.tsx) ──► Stripe $49/mo (create-subscription, plan demo_monthly)
      ──► stripe-webhook kind:'demo_site' ──► provision-domain (Porkbun register → DNS → Netlify custom_domain → SSL)
      ──► GHL `outbound-purchased` tag → workflow "Outbound — Purchased (Onboarding)" (staff SMS, welcome email, 5-day review ask)
```

Invariants: **no Meta pixel/CAPI** anywhere in this funnel. **Never cold-send from
acewebdesigners.com or through GHL/LC Email** (scraped lists get ESPs banned). `suppressions` is the
CAN-SPAM source of truth and both import + export enforce it. One Opus build EVER per prospect
(atomic `site_status none→generating` gate). Truthful copy only — never invent stats.

## 2. Lead sourcing (Apify) — current state 2026-11-02

- **Plan: Apify Starter** (upgraded by owner 2026-11-01): $19/mo, $19 included usage, BRONZE
  pricing on `compass/crawler-google-places`: **$0.003/place + $0.001 per filter** (`website`,
  `categoryFilterWords`, `placeMinimumStars`, `skipClosedPlaces` each count) and `scrapeContacts`
  add-on **$0.002/place**. Cycle resets on the 1st. `APIFY_TOKEN` in `supabase/.env` (local
  scripts only — never an Edge secret). Account `rhyan`. Every run is started with
  `maxTotalChargeUsd` (`--budget`, default $2) — never start one without a cap.
- **Google Maps publishes NO emails.** Email comes only from crawling the business WEBSITE. So
  the "no-website contractor" segment (≈20% of listings) has **no email source** — it has phones
  (92%) but cold SMS/calls to scraped numbers are TCPA exposure and the funnel is email. The
  email-bearing segment is **real-website contractors → redesign angle** (which is what the live
  v4 copy assumes). Social-only (FB-page) contractors are ~1–2% — too thin to matter.
- **Don't pay for `--contacts`.** `scripts/enrich-emails.mjs` crawls homepage + contact/about
  pages ourselves at $0 and matched Apify's yield (MA: 149/235 = 63%; CT via Apify: 147/250 = 59%).
  So: scrape `--website withWebsite` WITHOUT `--contacts` ($0.004/place) → enrich → import.
  Measured yield ≈ **0.6 emails per place ≈ $0.007 per email**.
- **Recipe (per state × search, ~$1 each):**
  ```
  node scripts/apify-scrape-contractors.mjs --state Maine --search "general contractor" --max 250 --website withWebsite --budget 1.6 --out x.csv
  node scripts/enrich-emails.mjs --in x.csv --out x.enriched.csv --concurrency 8
  node scripts/import-prospects.mjs --file x.enriched.csv --batch 2026-11-ne-gc --trade general-contractor
  node scripts/apify-scrape-contractors.mjs --run <runId> --out x.csv        # re-fetch a finished run for $0
  ```
  Searches used so far: "general contractor" (MA, CT, RI, NH, ME; VT came in the owner's first
  CSV), "remodeling contractor" (MA, CT), "home builder" (MA). Place IDs dedupe on import
  (`on_conflict=gmaps_place_id`), so overlapping runs are safe, just wasteful. ~10–25% of rows come
  back with a blank `state` (search bleed) — they're kept; a 2-letter non-US state is dropped.
  The Apify list has **zero first names** → every merge falls back to "there"; never put
  `{{first_name}}` in a subject.
- **Batches in `prospects`:** `2026-09-newengland-gc` (owner CSV, 241; wave 1 = 100 emailed
  2026-09-23), `2026-11-ne-gc` (this run — see §9 for the count), `internal-seed` (our own
  inbox, see §7), `sample-keep` (the Sep 2026 Hardy Roofing demo row, suppressed).

## 3. Import → export → upload (waves)

- `import-prospects.mjs` drops rows with no/placeholder email, suppressed emails, non-US; upserts
  on `gmaps_place_id` (a re-import never resets token / site_status / emailed_at). Column
  contract the scraper must keep: `title, emails/0, phone, city, state, website, placeId,
  categoryName, totalScore, reviewsCount`.
- `export-instantly.mjs --batch <b> --limit N` writes the Instantly CSV for the next N
  un-emailed, non-test, non-suppressed rows and **stamps `emailed_at`** (`--no-stamp` = dry run).
  Merge fallbacks (`first_name`→"there", `city`→"your area") are baked in here.
- `instantly-upload-leads.mjs --file <csv> --campaign 46657029-fdd6-4567-b5fe-2165bb298367`
  bulk-adds via `POST /leads/add` with `skip_if_in_campaign`.
- **Throughput reality (raised 2026-11-02, owner ask):** 2 inboxes × 30/day = **60 sends/day**; the
  daily limit counts follow-ups, so with 3 steps that is ~20 fresh leads/day (~100/week) at steady
  state. The 496-lead wave 2 clears in ~5 weeks. Step-up plan: 40/day after a week if bounces stay
  <2% and Instantly warm-up health is green (neither API key can read `/accounts` — check the
  dashboard); never jump straight to 50. Before 2026-11-02 it was 20/day, 06–11 ET, 4 steps. The lever for "a sale this week" is more inboxes (Workspace user +
  connect + 2–3 wk warm-up), not a bigger list. Instantly Growth caps at 1,000 active contacts /
  5,000 emails per month — upload in waves that fit, don't dump the whole table.
- **Campaign status codes:** 0 draft · 1 active · 2 paused · 3 completed. After every lead
  finishes the 3 steps the campaign flips to **3 = COMPLETED and must be re-activated**
  (`POST /campaigns/<id>/activate`) or newly added leads never send.

## 4. Instantly (sending)

- Login `rhyan@getacewebdesigners.com`; workspace `b8362bc8-3628-4609-b0c4-457a054aaff9`;
  **Growth $47/mo** (renews the 14th). Webhooks are Hyper-Growth-only → we poll instead.
- Sending inboxes (Google Workspace "Ace Web Designers", Business Starter $8.40/user):
  `rhyan@getacewebdesigners.com`, `rhyan@acewebdesignershq.com`. Domains at Porkbun with
  SPF/DKIM/DMARC(p=none) + wildcard 301 → acewebdesigners.com. Warm-up ON since 2026-08-31.
- **Campaign "Outbound — Contractors v2" `46657029-fdd6-4567-b5fe-2165bb298367`.** Created and
  updated by `scripts/instantly-create-campaign.mjs` (parses the v4 sequence doc; `--dry`,
  `--update <id>`). Settings: both inboxes, **30/day**, **weekdays 06:00–16:00 ET** (tz enum
  `America/Detroit`; widened 2026-11-02 so the higher cap sends at a human pace), stop-on-reply, text-only, open + link tracking OFF, unsubscribe header ON,
  gap 10 + 15 random min. Emails 2–3 send with an EMPTY subject (native threading). **Email 4 (the
  "last one from me" breakup) was REMOVED 2026-11-02** — every wave-1 reply was hostile and came
  off a follow-up, and dropping it buys a third more fresh leads per day. The v4 draft doc still
  shows 4 steps; the live campaign is the truth. Footer postal address = 30 North Main St, Leominster, MA 01453
  (CAN-SPAM requires one — no B2B exemption).
- **Keys** (`supabase/.env`, local only): `INSTANTLY_API_KEY` (`all:read`, poller),
  `INSTANTLY_ADMIN_API_KEY` (campaigns/leads, campaign + upload scripts),
  `INSTANTLY_SENDER_API_KEY` (`emails:all`, the auto-reply sender).
- Wave-1 result (100 leads, Sep 23 → Oct): 394 emails sent, 3 replies (1 no, 2 unknown), 1
  bounce, 0 unsubscribes, 0 opens tracked (tracking is off by design).

## 5. Reply handling (poller → webhook)

- **`instantly-poll` Edge fn** (pg_cron `instantly-poll` every 15 min, header `x-cron-key` =
  CAPI_INTERNAL_SECRET; state in `poll_state`; helpers in `_shared/instantlyEvents.ts` = Deno mirror of
  `scripts/lib/instantly-events.mjs` — change both). The Windows task "Instantly Poll" running
  `scripts/instantly-poll.mjs` is the manual/PC fallback only (disable it once the fn is configured).
  It GETs `/emails?email_type=received` since a watermark + bounced /
  unsubscribed lead lists, maps each (`scripts/lib/instantly-events.mjs`, vitest) to
  `{event_type, lead_email, campaign_id, reply_text, email_id, eaccount, subject}` and POSTs to
  `instantly-webhook` (`?secret=INSTANTLY_WEBHOOK_SECRET`). State in
  `%LOCALAPPDATA%\instantly-poll.json`, log `%LOCALAPPDATA%\instantly-poll.log` (a healthy line:
  `OK seen replies=… forwarded=… links_sent=…`). Auto-replies and mail with no `campaign_id` are
  ignored, so warm-up traffic never fires anything.
- **`instantly-webhook` fn:** bounce/unsub → `suppressions`. Reply → `classifyReply`
  (`_shared/replyClassifier.ts`, mirrored in `scripts/lib/reply-classifier.mjs`): yes / no /
  unknown ("not interested" can never read as yes; mixed → unknown). Stores `last_reply`,
  `reply_sentiment`, `reply_email_id`, `reply_eaccount`, `reply_subject`. **Every** non-test reply
  upserts the GHL contact + `outbound-lead` tag (additive, idempotent). A clear **yes** on a
  non-test, non-suppressed row sets `auto_send=true` and, if `site_status='none'`, starts the
  build.
- **Auto-send:** each poller tick asks the webhook for `auto_send_pending` (auto_send, deployed,
  not suppressed, `demo_link_sent_at` null, `reply_email_id` not null) and replies in-thread via
  `POST /emails/reply` from the inbox that received the reply (`demoLinkReply`: greeting, the
  `/demo/<token>` link once, the $49/mo button, what's included, cancel anytime), then stamps
  `demo_link_sent_at`. Sent exactly once; a failed send retries next tick. A reply with no
  `reply_email_id` (e.g. a synthetic test event) can never trigger a send.

## 5b. Reply desk — the automated sales desk (built 2026-11-02, GO-LIVE PENDING)

Owner rule: "if they are interested or need a reply an AI should email back; if it needs me,
message me." Nothing a prospect sees may look automated.

```
reply → instantly-poll → instantly-webhook
   hard rules (_shared/replyClassifier.ts): remove / hostile / no → suppressions + prospects.suppressed,
                                             NO build, NO GHL alert (this is what wave 1 lacked)
   REPLY_DESK_ENABLED=true → outbound_replies row (direction 'in', status queued) → reply-desk {classify}
reply-desk classify   ONE Sonnet 5.5 call (tool-forced JSON: intent, confidence, needs_human, draft)
                      constrained to _shared/outboundFacts.ts → _shared/replyPolicy.ts decide():
   yes                    → build if none; queue the demo-link reply (kind demo_link); GHL outbound-lead
   question / price       → queue the draft (lintDraft: no $≠49, no %, no AI/automat/minute words,
                            no foreign links, no lists, no "!"); max 2 drafted answers per thread
   later / timing         → queue a short ack; followup_at = +7..60 d (default 21)
   no / remove / hostile  → suppress, silent
   ooo_auto               → ignored, no turn consumed
   unknown / needs_human / lint fail / turn cap / model down → HAND-OFF:
                            prospects.handoff_at + GHL fields last_reply_text/_intent +
                            tag outbound-needs-human (removed then re-added so the SMS fires every time);
                            the desk stays silent on that thread until /admin "Resolved"
reply-desk release    pg_cron */5 — sends rows whose release_after passed: humanReleaseTime() =
                      +20–90 min, clamped to 07:00–19:00 in the lead's STATE tz, never Sunday.
                      Instantly POST /emails/reply {reply_to_uuid, eaccount} → same inbox, same thread.
                      demo_link rows also wait for site_status=deployed; stuck/failed sends → hand-off.
reply-desk followups  pg_cron daily 13:00 UTC — the one "later" re-touch (followupText) and up to 2
                      nudges (+2 d, +5 d more) for prospects who opened the preview and never replied
                      (nudgeText; replies to our last SENT email so it threads). A new reply cancels
                      queued nudges/follow-ups.
```
- **Where replies come from:** always Instantly, from the inbox that received the message, in-thread.
  Never acewebdesigners.com, never GHL.
- **Facts** the desk may state live ONLY in `_shared/outboundFacts.ts` (vitest asserts price + support
  email match `src/config/outboundPlan.ts`). Add a fact there, never in the prompt.
- **/admin → Outbound → Reply desk:** queued answers (Send now / Edit / Cancel), hand-offs
  (Resolved), recent sends. Prospect rows show `NEEDS YOU` while `handoff_at` is set.
- **Dry-run gate:** `node scripts/reply-desk-dryrun.mjs` runs `scripts/data/reply-samples.json`
  (the 3 real hostile texts + yes/question/price/later/needs-human/ooo) through the deployed fn with
  `{action:'dryrun'}` — writes nothing, prints rule / model / decision / draft, exits 1 on a mismatch.
- **Go-live:** `node scripts/go-live-reply-desk.mjs` (secrets → db push → deploy → cron → gate →
  REPLY_DESK_ENABLED → v5 copy → Netlify). Agent runs can't confirm production mutations, so the owner
  runs it. The GHL workflow "Outbound — Needs a Person" (id `30f1e52c-4e17-4969-8a6e-2e1cf3d153ad`) is
  already PUBLISHED: tag `outbound-needs-human` → SMS to Rhyan with company, email,
  `{{contact.last_reply_text}}`, intent + admin link; re-entry ON.
- **Demo page gate (shipped with this):** `demo-site` returns 404 and never builds for suppressed rows
  or `reply_sentiment in (no, remove, hostile)` — the 3 hostile wave-1 sites were built by opening
  the link in the staff-alert email.
- **Copy v5 (docs/OUTBOUND_COLD_SEQUENCE_DRAFT.md):** every email carries `{{demo_url}}`; the page
  builds on open. Day 0 / 3 / 7, price once in E3. `buildPayload` defaults = live settings
  (06–16 ET, daily_limit 60 campaign-wide) because `--update` PATCHes schedule + cap too.

## 6. Demo build, demo page, purchase, provisioning

- `generate-site` **subject adapter** `{prospectId}`: prospects take the **FAST path** (2026-11-02):
  one Haiku 5.5 call → a single self-contained index.html → Netlify, **~50s and ~$0.005 per site**
  (measured twice). The prompt carries a fixed mobile-nav pattern (the first Haiku build shipped
  an always-open mobile menu). `{full:true}` forces the 3-stage Opus chain (~$1, 4–20 min) if a
  prospect ever needs the multi-page build. Saves `preview_url` / `netlify_site_id` /
  `site_status` on `prospects`. Needs `ANTHROPIC_API_KEY` credits (org "Ace Web Designers's Individual Org" on
  platform.claude.com) and `NETLIFY_AUTH_TOKEN`. Admin retry: /admin Outbound → Retry build
  (`admin-data {action:'retryProspectSite', prospectId}`, forces).
- `/demo/<token>` (`DemoPage.tsx`, copy in `config/outboundPlan.ts`): first view fires
  `outbound-lead` in GHL with the demo URL. **Status `none` starts the fast build on open** —
  the click on the email link is the interest signal (owner, 2026-11-02; no button, no
  "build it" copy); the atomic `none→generating` gate still means one build ever. The page
  shows "about a minute" (`BUILDING_COPY`), polls every 4s and flips to Ready by itself
  (verified: open → Ready in 47s). A prospect who never clicks costs $0. Ready state → pre-suggested .com auto-checked
  (`domain-search` → Porkbun) → Stripe → `create-subscription` plan `demo_monthly`
  (`STRIPE_PRICE_DEMO_MONTHLY`) → `stripe-webhook` `kind:'demo_site'` (before the restaurant
  subscription branch — order matters; idempotent on `purchased_at is null`) → `provision-domain`
  (Porkbun register from prepaid balance — NON-refundable, availability re-checked right before —
  → DNS A @→75.2.60.5 + CNAME www → Netlify `custom_domain` → SSL poll, ~1h cap → `ssl_pending`,
  admin Retry re-enters). Purchased state polls `domain_status` every 10s. No customer email is
  sent on go-live by code — GHL's onboarding workflow does that.
- **Post-purchase change requests** (`site-edit` fn + `site_edits` table, 2026-11-02): the purchased
  state of `/demo/<token>` has a "Want something changed? Send it to us" form (text + up to 5 photos,
  downsized in-browser) and a "Keep this page" card (copy link / email-to-self). `{token,
  action:'request'}` stores the row, uploads photos to the public `site-assets` bucket, fetches the
  live site's files from Netlify, and one Sonnet 5.5 call (photos passed as images) returns the
  changed files in full. **Owner rule: never look instant** — the result is parked on the row
  (status `ready`, `release_after` = +30-45 min) and a pg_cron job (`scripts/site-edit-cron.sql`,
  every 5 min, header `x-release-key` = `CAPI_INTERNAL_SECRET`) deploys due rows in order; a
  second request while one is pending builds on the pending files. Customer copy says "within the
  hour" and shows only received / done / needs-a-look. Customers only (purchased_at) or is_test;
  ≤3 pending per site. Cost ~$0.05-0.15/edit. Verified on prod 2026-11-02 with a photo (56s to
  ready) BEFORE the hold existed — the held release path + cron are deployed-pending (see §9).
- **Porkbun:** account `acewebdesigners` (hello@). Prod keys `PORKBUN_API_KEY/SECRET`; sandbox =
  `pk1_sb_*` keys on the MAIN URL + `PORKBUN_API_BASE` set (the old api-sandbox host is dead).
  Prepaid balance funded 2026-11-02 (owner); top up when it runs low — a purchase stalls at registration otherwise.

## 7. GHL (messaging only) — outbound isolation

- Tags `outbound-lead` / `outbound-purchased` (`STAGE_TAGS` in `_shared/ghl.ts`, funnel
  `'outbound'`). Custom fields: "Demo Preview URL", "Purchased Domain".
- Workflows (built in the GHL UI, re-entry OFF): **"Outbound — Interested Lead"**
  `be242a43-d61d-4931-b7b7-cccd26181540` → staff SMS +17743293117 + staff email hello@ (no
  prospect-facing send — Instantly owns the thread). **"Outbound — Purchased (Onboarding)"**
  `edd5c23c-5e48-4c25-8ac1-96dea2cfa9b5` → staff SMS → customer welcome email (domain, ~1h
  go-live, unlimited updates via hello@) → wait 5 days → review-ask email.
- Health check: `select email, reply_sentiment, ghl_contact_id from prospects where last_reply is
  not null` — every replied row should carry a `ghl_contact_id`. Verified 2026-11-02 (all 5 rows
  incl. the seed). The `GHL_API_TOKEN` copy in local `supabase/.env` is STALE (401) — the deployed
  Edge secret is the working one; don't "fix" the Edge secret from the local file.

## 8. Verifying the loop (what was proven, how to re-prove)

- **2026-11-02 live check:** synthetic `reply` event ("Yes please, send it over.") for the
  internal seed prospect `rhyan@acewebdesignershq.com` (row `internal-seed`, is_test=false)
  POSTed to the production webhook → `sentiment=yes`, `auto_send=true`, GHL contact
  `tPaTD4SbFSNq5cyUS7qq` tagged `outbound-lead` (staff alert fired), build started → see §9 for
  the build result. `INSTANTLY_SENDER_API_KEY` authenticates (GET /emails → 200). The in-thread
  auto-send itself needs a REAL inbound reply (needs `reply_email_id`), which is why the seed row
  is uploaded in the live wave: when Email 1 lands in rhyan@acewebdesignershq.com, reply "yes"
  from that Gmail and watch the poller log → `links_sent=1` → the demo link arrives in-thread.
- Re-prove any time: `node scripts/instantly-poll.mjs --dry` (fetch only), the SQL above, and
  /admin → Outbound tab (YES/no/read-it badges, "link sent", site status, Retry buttons).
- Anthropic credit sanity: a 1-token `claude-haiku-4-5` call with the key returns 200 when the
  org has balance. (Max 5x/20x subscribers get monthly API credits — claude.ai → Settings →
  Billing → API credits → **Link organization** → pick the Console org; new subscribers wait 7
  days. Those credits pay for demo builds.)

## 9. Current status (update in place)

- **2026-11-03 02:56 UTC:** go-live steps 1–5 landed (Instantly secrets → poller 200 at 03:00, migration 0015,
  reply-desk + 4 fns deployed, cron reply-desk-release/followups). Classifier was dead on arrival — Sonnet 5.5
  400s on forced `tool_choice` and `temperature` (fixed, redeployed, dry-run 15/15). Steps 6–8 (flag, v5 copy,
  /admin bundle) still pending: `node scripts/go-live-reply-desk.mjs --from 6`.
- **2026-11-02 late:** reply desk built (§5b) — go-live pending `node scripts/go-live-reply-desk.mjs`
  + the GHL "Needs a Person" workflow. Instantly `daily_limit` PATCHed 30→60 (campaign-wide cap).
- **2026-11-02 evening read:** day 1 of wave 2 sent only **30** (16 new leads + 14 follow-ups), 0 replies,
  0 bounces — because `daily_limit` is a CAMPAIGN-level cap, not per-inbox. PATCHed to **60**
  (= 2 inboxes × 30) so Tuesday sends the full 60. ⚠️ The pg_cron `instantly-poll` has returned
  **503 "not configured"** on every run since it was scheduled: the Edge fn requires
  `INSTANTLY_API_KEY` and that key was never set as an Edge secret (the "never Edge secrets" rule
  covered the local scripts, not this fn). Fix = `npx supabase secrets set INSTANTLY_API_KEY=<read key
  from supabase/.env>` (single key, never `--env-file`), then confirm a 200 in `net._http_response`.
  Until then the Windows task is the only poller and it only runs while the PC is awake (it did not
  run 00:40 → 18:25 ET today; a manual run found nothing missed).
- **2026-11-02:** Apify Starter active ($9.83 of $19 used this cycle). Scraped 1,750 places across
  MA/CT/RI/NH/ME (GC + remodeling + home builder) for $8.50; `enrich-emails` found emails on ~60% →
  **batch `2026-11-ne-gc` = 1,072 prospects with emails, all un-emailed except what's below.**
- **Wave 2 uploaded + campaign RE-ACTIVATED (status 1) 2026-11-02 ~00:05 ET:** 496 leads = the
  118 September leftovers + 377 new rows + the internal seed (1 invalid, 1 skipped). Campaign now
  holds 596 leads; Instantly reports 404 contacts left in the plan this month. First sends
  **Monday 2026-11-02 06:00 ET**, ~40/day. 695 rows of `2026-11-ne-gc` remain un-emailed for
  later waves (`export-instantly.mjs --batch 2026-11-ne-gc --limit N`).
- **Seed build result:** the webhook-started build deployed to
  `preview-ace-test-builders-668fb4.netlify.app` (HTTP 200) — but it took **~20 min**, not the ~4
  min seen in September. One accidental second build was forced via `funnel-admin.mjs
  prospect-build` right after it finished (the row's `updated_at` doesn't move on status changes, so
  it looked stuck). Treat build time as 5–20 min when designing the prospect-facing wait.
- **Demo wait SOLVED 2026-11-02 ~00:35 ET:** prospects now build on the FAST Haiku single-page path
  (~50s, ~$0.005) and the page starts it on open — link click → Ready in 47s end-to-end on prod.
  Quality checked by eye on desktop + phone (editorial-serif + nocturne styles). An interim
  "explicit button" version was live for ~15 min and reverted on the owner's ask. The 20-min
  Opus build mystery is moot for prospects (Opus chain only runs with `full:true` / bookings).
- **Sending raised 2026-11-02 ~01:30 ET (owner: "you run it yourself"):** campaign PATCHed via API
  → `daily_limit 30`, window 06:00–16:00 ET, 3 steps (verified by GET). Wave-1 read: 394 sent, 3
  replies — ALL hostile ("remove our name", "spam elsewhere", "bug someone else"), all quoting the
  step-2 follow-up, which in wave 1 went out as "Hi ," (blank first name — fixed; all 496 wave-2
  leads have a greeting, 145 of them the business name, 72 have city "your area"). The three were
  NOT suppressed (sentiment `unknown`/`no` doesn't auto-suppress) → added to `suppressions` +
  `prospects.suppressed=true` by hand. TODO: make the webhook auto-suppress on remove/unsubscribe
  language, not just Instantly unsubscribes.
- **Porkbun funded by owner 2026-11-02** — provisioning is unblocked for the first real sale.
- **Change requests fully live 2026-11-02 ~02:05 ET:** migrations 0012-0014 applied, pg_cron +
  pg_net on, jobs `site-edit-release` (*/5) + `instantly-poll` (*/15) scheduled
  (`scripts/cron-jobs.sql`), held-release `site-edit` deployed. Verified end-to-end on prod: request
  → `ready` with a 42-min hold → release → deployed + heading live. Test prospect + its Netlify site
  deleted (one orphan photo remains in `site-assets/07e2501d-…/` — storage API delete only).
- **GHL done 2026-11-02:** "Outbound — Purchased (Onboarding)" now has a second staff SMS to
  +1 508-308-2714 (sales only) and the welcome email carries "Fastest way: your website page —
  bookmark this link… {{contact.demo_preview_url}}" after step 3. Published + saved.
- **Poller moved server-side (PENDING two secrets):** `instantly-poll` Edge fn is deployed and cron
  calls it every 15 min, but it answers `not configured` until the owner runs
  `npx supabase secrets set INSTANTLY_API_KEY=… INSTANTLY_SENDER_API_KEY=…` (values in
  supabase/.env; classifier blocks secret writes in-session). Then: one dry tick
  (`POST /functions/v1/instantly-poll {"dry":true}` with `x-cron-key`), and DISABLE the Windows task
  (`schtasks /change /tn "Instantly Poll" /disable`) so replies are not forwarded twice. Until then
  the Windows task is still the live poller.
- Next: reply "yes" from rhyan@acewebdesignershq.com
  when Email 1 lands Monday to prove the in-thread auto-send; consider 2 more inboxes for 2× volume.
