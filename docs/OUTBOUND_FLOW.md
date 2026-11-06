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
          (demo link + $37/mo + what's included) → demo_link_sent stamps demo_link_sent_at (once)
                                                                     │ prospect clicks
                                                                     ▼
/demo/<token> page (DemoPage.tsx) ──► Stripe $37/mo (create-subscription, plan demo_monthly; $49 until 2026-11-04)
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
  node scripts/verify-emails.mjs --in x.enriched.csv            # MillionVerifier → x.enriched.verified.csv (verify_result/quality)
  node scripts/import-prospects.mjs --file x.enriched.verified.csv --batch 2026-11-ne-gc --trade general-contractor --verify
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

- **Email quality (2026-11-04, after a 15% bounce day):** `scripts/lib/email-quality.mjs` (vitest, 155 tests) is the
  ONE junk filter — `extractEmailsFromHtml` takes addresses only from `<a href=mailto:>` and visible text (never
  `<script>`/`<style>`/comments/attributes, so font-licence and placeholder emails can't leak), `cleanEmail` strips
  the ``/`
` tails, `isJunkEmail` drops placeholders, site-builder/hosting/font/agency domains and national chains,
  `findSharedEmails` drops an address that sits on 2+ different businesses (= the web agency), `pickBestEmail`
  ranks own-domain → business-like free-mail → info@. `enrich-emails` and `import-prospects` both use it.
  **Verify before every upload:** `verify-emails.mjs` (MillionVerifier single-email API, key
  `MILLIONVERIFIER_API_KEY` in `supabase/.env`, cache `leads/.verify-cache.json`, `--dry`/`--limit`/`--force`,
  prints credits left) → `import-prospects --verify` imports **ok only**, writes `catch_all` rows to
  `<file>.catchall.csv` for a later low-volume wave (`--verify-accept ok,catch_all`), skips invalid/unknown/
  disposable/error. `import-prospects --dry` = no Supabase call (so no suppression check).
  `instantly-remove-leads.mjs --campaign <id> --emails-file <txt|csv> [--mark-junk] [--live]` pulls listed
  leads out of a campaign (dry by default; `--mark-junk` sets `prospects.suppressed=true, reason junk-email`).
- `import-prospects.mjs` drops rows with no/placeholder email, suppressed emails, non-US; upserts
  on `gmaps_place_id` (a re-import never resets token / site_status / emailed_at). Column
  contract the scraper must keep: `title, emails/0, phone, city, state, website, placeId,
  categoryName, totalScore, reviewsCount`. ⚠️ **2026-11-04 bug fixed:** the header matcher never
  lowercased camelCase names, so `categoryName/totalScore/reviewsCount` silently missed and every
  restaurant imported with `business_type`/`rating` NULL → generate-site built them as "General
  Contracting". Backfilled (299 rows) with `scripts/backfill-prospect-fields.mjs`; after any import,
  check `select count(*) filter (where business_type is null) from prospects where batch='…'` = 0.
- `export-instantly.mjs --batch <b> --limit N` writes the Instantly CSV for the next N
  un-emailed, non-test, non-suppressed rows and **stamps `emailed_at`** (`--no-stamp` = dry run).
  Merge fallbacks (`first_name`→"there", `city`→"your area") are baked in here.
- `instantly-upload-leads.mjs --file <csv> --campaign 46657029-fdd6-4567-b5fe-2165bb298367`
  bulk-adds via `POST /leads/add` with `skip_if_in_campaign`.
- **Throughput reality (raised 2026-11-02, owner ask):** 2 inboxes × 30/day = **60 sends/day**; the
  daily limit counts follow-ups, so with 3 steps that is ~20 fresh leads/day (~100/week) at steady
  state. The 496-lead wave 2 clears in ~5 weeks. Step-up plan: 40/day after a week if bounces stay
  <2% and Instantly warm-up health is green (`GET /api/v2/accounts` with the READ key returns
  `warmup_status` + `stat_warmup_score` per inbox — both read 100 on 2026-11-04); never jump straight to 50. Before 2026-11-02 it was 20/day, 06–11 ET, 4 steps. The lever for "a sale this week" is more inboxes (Workspace user +
  connect + 2–3 wk warm-up), not a bigger list. Instantly Growth caps at 1,000 active contacts /
  5,000 emails per month — upload in waves that fit, don't dump the whole table.
- **Campaign status codes:** 0 draft · 1 active · 2 paused · 3 completed. After every lead
  finishes the 3 steps the campaign flips to **3 = COMPLETED and must be re-activated**
  (`POST /campaigns/<id>/activate`) or newly added leads never send.

## 4. Instantly (sending)

- Login `rhyan@getacewebdesigners.com`; workspace `b8362bc8-3628-4609-b0c4-457a054aaff9`;
  **Growth $47/mo** (renews the 14th). Webhooks are Hyper-Growth-only → we poll instead.
- Sending inboxes (Google Workspace "Ace Web Designers", Business Starter $8.40/user; admin =
  rhyan@getacewebdesigners.com, creds `~/.secrets/google-workspace-credentials.txt`):
  `rhyan@getacewebdesigners.com`, `rhyan@acewebdesignershq.com` (warm-up ON since 2026-08-31, score 100) **+
  `rhyan.a@getacewebdesigners.com`, `rhyan.a@acewebdesignershq.com`** (created 2026-11-04 as rhyan.almeida@, renamed
  on owner ask — old address = alias; name "Rhyan A."; 2 per domain, ≤3 is the ceiling). New inboxes: ≥14 days
  warm-up + score ≥90 before joining a campaign, then 5–10 → 15–20 → 30/day over weeks 3–5 (playbook §3); raise the
  campaign-level `daily_limit` in step (60 → 120). Domains at Porkbun with SPF/DKIM/DMARC(p=none) + wildcard 301 →
  acewebdesigners.com.
- **Restaurant campaign `94ab9d2a-…` live settings (2026-11-04):** windows Mon–Fri 07:00–11:30 + 13:30–16:30 ET,
  gap 6 + 8 random min, `daily_limit` 60 (= 2 × 30), 3 steps (day 0/3/7), text only, tracking off. Capacity rule:
  window-hours × (60 ÷ avg gap) must exceed each inbox's 30 — the old 3.5 h windows capped sends at ~12/inbox/day.
  `SCHEDULES.restaurant` + `EMAIL_GAP_MINUTES` in `scripts/lib/instantly-campaign.mjs` match the live values.
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
  `/demo/<token>` link once, the $37/mo button, what's included, cancel anytime), then stamps
  `demo_link_sent_at`. Sent exactly once; a failed send retries next tick. A reply with no
  `reply_email_id` (e.g. a synthetic test event) can never trigger a send.

## 5b. Reply desk — the automated sales desk (LIVE since 2026-11-03)

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
                      nudges (+2 d, +5 d more) for prospects who opened the preview and never replied —
                      only once the lead is ≥ 8 days past `emailed_at` (the 3-step sequence has finished)
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
  one call → a single self-contained index.html → Netlify. **2026-11-04: Haiku 5.5 → Sonnet 5.5**
  (owner: the demo must look enterprise-grade; ~$0.05 and ~2 min per site — the /demo building
  state already says "a minute or two"). Food businesses (`isFoodBusiness`) get the RESTAURANT
  spec (appetite hero, menu highlights, ambiance strip, visit card, no stats/forms/trade words),
  a food-only design pool (5 food art directions added in migration 0017; `selectDesignSystem`
  never gives a food business a universal/corporate style) and the restaurant playbook fallback.
  The prompt carries a fixed mobile-nav pattern (the first Haiku build shipped
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

- **2026-11-06 audit — PROD BROKEN, fix pending `node scripts/go-live-outbound-fix.mjs` (owner-run):** (1) Netlify
  auto-built production from `master` (commit `132d313` pushed 2026-11-05) = July code with no `/demo` route, so every
  demo link opens the homepage since 19:46 UTC that day; cherry-picked to `redesign/marketing-site`, script redeploys
  + moves the production branch. (2) `STRIPE_PRICE_DEMO_MONTHLY` still = $49 price and Email 3 still says $49
  (`go-live-restaurant-sites.mjs` steps 4-8 never ran; the fix script runs them). (3) `reply-desk` nudges now wait
  8 d past `emailed_at` (sequence done). (4) `first_line` NULL everywhere — enrich-haiku only the next wave.
  Healthy: all 5 crons 200 every tick, 11-05 sent the full 60, the one real reply since the desk went live
  ("not interested") suppressed correctly, 4 restaurant demo views all carry GHL ids.
- **2026-11-05 late — DEPLOYED (`scripts/go-live-alerts.mjs`: secret set, migration 0018 applied, demo-site +
  reply-desk + create-subscription live; verified 404/400 boots + columns present). Only the 3 GHL workflows
  remain (UI). Original note:** (1) **Lead sourcing without Apify** — `scrape-places.mjs`
  (our Playwright on Google Maps, $0, proven 47 results/12s) → `enrich-emails` → **`enrich-haiku.mjs`** (Haiku
  5.5 reads each site: owner first name only with a quote, cuisine, dishes, `first_line` = the email opener,
  ≈$0.0004/site) → verify → import. (2) **Personalized Email 1** — migration `0018` adds
  `prospects.first_line/hook/cuisine/dishes/owner_evidence`; export sends `{{first_line}}` with the v2 opener as
  fallback; v3 copy in the sequence doc, push for NEW waves only. (3) **Specific staff texts** —
  `outbound-replied` / `outbound-viewed` / `outbound-checkout` tags with details in custom fields
  (`docs/GHL_OUTBOUND_ALERTS_2026-11-05.md`: run the custom-fields script, set the secret, deploy demo-site +
  reply-desk + create-subscription, build 3 GHL workflows, then disable "Interested Lead"). (4) **`ace-site`
  skill** for hand-built multi-page sites on Netlify (`docs/ZOKAGO_COMPARISON_2026-11-05.md`).

- **2026-11-04 list-quality read (day 2 of restaurants):** 27 contacted / 50 sent → **4 bounces (15% of
  contacted)**, 1 reply (declined). Contractors ran 321 contacted / 1 bounce, so this is the restaurant LIST,
  not the inboxes. Every bounce was a scraped placeholder or third-party address (`mail@gmail.com`,
  `mymail@mailservice.com`, `impallari@gmail.com` = a font designer's licence email in the site CSS, one dead
  mailbox). The same pattern sits in what is still queued: ~15 junk/agency addresses among the 256 un-contacted
  restaurant leads (`example@mysite.com`, `hi@mystore.com`, `team@latofonts.com`, `astigma@astigmatic.com`,
  `pressable@alias-solutions.com`, `hello@rfuenzalida.com`, Barnes & Noble / Chili's corporate, two with a
  trailing backslash from the enricher's regex) and 25 junk + ~100 non-matching-domain rows in the 691 un-emailed
  `2026-11-ne-gc`. Instantly's auto-pause is 5% and only arms after 200 sends, so it will NOT catch this.
  Root cause: `enrich-emails.mjs` has no verification step and a 10-pattern junk filter. Decision pending
  (owner): pull the queued junk from the campaign, add MillionVerifier (or Instantly 0.25-credit verify) before
  every upload, widen the junk/agency filters, and only then add inboxes. Both inboxes: warm-up score 100.
  **Same day, later:** (1) **Why only ~25/day went out:** the restaurant windows (09:30–11 + 14–16 ET = 3.5 h) at a
  10–25 min gap cap each inbox at ~12 sends, so the 60 `daily_limit` was unreachable. PATCHed via API to
  **07:00–11:30 + 13:30–16:30 ET, gap 6 + 8 random** (7.5 h × ~6/h > 30/inbox) — full 60/day from 2026-11-05.
  (2) **MillionVerifier account** created under hello@ (creds `~/.secrets/millionverifier-credentials.txt`, 500 free
  credits, then $39/10k; key = `MILLIONVERIFIER_API_KEY` in `supabase/.env`, local scripts only). (3) Research-backed
  operating playbook written: **`docs/COLD_EMAIL_SALES_PLAYBOOK_2026-11-04.md`** (weekly sequence, v3 A/B copy,
  bounce ladder, new-inbox ramp, benchmarks → ~1 sale per 1,000 verified contacts, decision thresholds). (4) Two more
  inboxes (one per existing domain, 2 ≤ 3 per domain) are the agreed next step — blocked only on the Workspace admin
  password, which the auto-mode classifier will not let an agent read; the owner types it into the automation browser.
  **Later the same night:** inboxes 3+4 created in Admin console (owner typed the password), first sign-in done,
  passwords set (creds file), renamed to `rhyan.a@` per owner; **both CONNECTED to Instantly via Google OAuth and
  WARM-UP ON 2026-11-05 ~03:50 UTC (owner typed the Instantly Google login; 4 accounts now, `warmup_status 1` on
  all). Earliest campaign join ≈ 2026-11-19 (≥14 days + score ≥90), then 5–10 → 15–20 → 30/day.** Instantly's
  bounce auto-pause threshold is plan-gated (customising it is a Hypergrowth upsell) — stays at the 5%/200-send
  default, so the playbook's bounce ladder is applied by hand. **Queue verified:** the 256 un-contacted restaurant leads went through MillionVerifier →
  **ok 159 · catch_all 36 · junk 27 · invalid 23 · unknown 11** (`leads/restaurants-queued-2026-11-04.verified.csv`).
  Removal lists: `.remove-dead.txt` (50 = junk+invalid, delete + `--mark-junk`) and `.remove-held.txt` (47 =
  catch_all+unknown, delete only; rows kept in `.held.csv` for a later wave). The `--live` runs were denied by the
  auto-mode classifier ("Unverifiable Deletion Scope"); **run on the owner's say-so 2026-11-05 ~04:00 UTC: 50 + 47
  deleted, 55 prospect rows marked `junk-email`** (first attempt failed — Instantly's API 400s a DELETE that carries
  a JSON content-type with no body; the script now sends no content-type on body-less calls). Campaign analytics
  `leads_count` lags the leads list after deletes. After removal + the new wave the campaign holds 307 leads, 280 queued, every one verified-ok (≈ 14 send-days) → the next
  wave (new scrape → verify → import --verify) must be ready by ~2026-11-14, when the Instantly contact cap resets.
  **Next wave DONE the same night (first run of the new pipeline):** Apify "restaurant <city>" × Worcester, Lowell,
  Framingham, Cambridge, Somerville, Quincy, Brockton (`--max 80 --website withWebsite`) → 560 places, $2.24 → crawler
  210 emails (0 junk — the mailto/visible-text extractor) → MillionVerifier **ok 147 · catch_all 45 · invalid 10 ·
  unknown 8** → batch **`2026-11-ma-restaurants-central`** = 144 prospects (5 were already-emailed overlaps) →
  **121 uploaded** to the restaurant campaign (campaign now 404 leads; `POST /leads/add` answered
  "Remaining uploads: 121" — Growth's monthly contact cap is now 0 until the 14th). Left for after the reset: 18
  verified-ok rows (`export-instantly --batch 2026-11-ma-restaurants-central`) + 45 catch-alls
  (`leads/restaurants-ma-central-2026-11-04.enriched.verified.catchall.csv`). Apify cycle: $18.4 of $19 used (ends
  2026-12-01) — the next scrape needs the owner to raise the Apify spend limit or a Google Places API source.
  MillionVerifier: 316 credits left.
- **2026-11-04 (incident + fixes):** every restaurant prospect had `business_type`/`rating` NULL — the
  import header matcher never lowercased camelCase Apify columns — so the two restaurant demos opened so far
  (Point Breeze, Steaming Tender) were built as "General Contracting" with construction photos. Fixed the
  matcher, backfilled 299 rows (`scripts/backfill-prospect-fields.mjs`), rebuilt both at the SAME preview
  URLs (verified by eye, desktop + phone: appetite hero, real Google rating chip, grouped menu, ambiance strip,
  visit card). generate-site fast path: Haiku 5.5 → **Sonnet 5.5** (adaptive thinking, effort medium — Sonnet
  5.5 400s on `thinking:disabled`; first redeploy died on it), restaurant ingredient list + playbook fallback,
  5 food-only design directions (migration 0017) with the on-trade pool rule. Builds now ~55-60s, ~$0.05.
  Email copy → **v2** (~40 words each) on the live campaign. **Price cut $49 → $37/mo (owner):** Stripe price
  `price_1UYF6ZJHIJK0EFOz2tJCdGJZ` created (live); code/copy/docs say $37; **pending owner-run**
  `node scripts/go-live-restaurant-sites.mjs` (plain, from step 1) = redeploy generate-site with the nav-legibility
  rule (Point Breeze's nav links were dark-on-dark over its hero photo) → rebuild Point Breeze → set
  `STRIPE_PRICE_DEMO_MONTHLY` → deploy reply-desk + instantly-poll → Netlify → email 3 → archive the $49 price. Until step 4 runs, checkout still
  charges $49 (the deployed /demo page still shows $49 too, so nothing is inconsistent yet).
- **2026-11-03 late:** owner switched the funnel to RESTAURANTS (`docs/RESTAURANT_OUTBOUND_PLAN_2026-11-03.md`).
  Contractor campaign paused. Restaurant campaign `94ab9d2a-faac-46da-8470-7ade9c9fd55c` created (not running), 283
  leads uploaded (273 site-email + 10 Facebook-email). Restaurant demo spec + food photo library in generate-site
  (deployed), niche-aware reply desk (deployed), own-domain checkout (migration 0016 + 5 fns + domain-recheck cron +
  Netlify) ALL LIVE 2026-11-03 ~04:30 UTC; restaurant campaign ACTIVATED. First read ~2026-11-17.
- **2026-11-03 02:56 UTC:** go-live steps 1–5 landed (Instantly secrets → poller 200 at 03:00, migration 0015,
  reply-desk + 4 fns deployed, cron reply-desk-release/followups). Classifier was dead on arrival — Sonnet 5.5
  400s on forced `tool_choice` and `temperature` (fixed, redeployed, dry-run 15/15). Steps 6–8 landed 03:22 UTC:
  REPLY_DESK_ENABLED=true, v5 copy on the live campaign, /admin Reply desk panel deployed. Windows task
  "Instantly Poll" disabled — the Edge poller owns replies. **Reply desk is LIVE.**
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
