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
      (stamps emailed_at)        (POST /leads/add)         4-step v4 sequence, 06–11 ET weekdays, 20/inbox/day
                                                                     │ prospect replies
                                                                     ▼
Windows task "Instantly Poll" (15 min) ──► instantly-webhook fn ──► classify yes/no/unknown
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
- **Throughput reality:** 2 inboxes × 20/day = **40 new leads/day, ~200/week**. A 1,000-row list
  is ~5 weeks of sending. The lever for "a sale this week" is more inboxes (Workspace user +
  connect + 2–3 wk warm-up), not a bigger list. Instantly Growth caps at 1,000 active contacts /
  5,000 emails per month — upload in waves that fit, don't dump the whole table.
- **Campaign status codes:** 0 draft · 1 active · 2 paused · 3 completed. After every lead
  finishes the 4 steps the campaign flips to **3 = COMPLETED and must be re-activated**
  (`POST /campaigns/<id>/activate`) or newly added leads never send.

## 4. Instantly (sending)

- Login `rhyan@getacewebdesigners.com`; workspace `b8362bc8-3628-4609-b0c4-457a054aaff9`;
  **Growth $47/mo** (renews the 14th). Webhooks are Hyper-Growth-only → we poll instead.
- Sending inboxes (Google Workspace "Ace Web Designers", Business Starter $8.40/user):
  `rhyan@getacewebdesigners.com`, `rhyan@acewebdesignershq.com`. Domains at Porkbun with
  SPF/DKIM/DMARC(p=none) + wildcard 301 → acewebdesigners.com. Warm-up ON since 2026-08-31.
- **Campaign "Outbound — Contractors v2" `46657029-fdd6-4567-b5fe-2165bb298367`.** Created and
  updated by `scripts/instantly-create-campaign.mjs` (parses the v4 sequence doc; `--dry`,
  `--update <id>`). Settings: both inboxes, 20/day, **weekdays 06:00–11:00 ET** (tz enum
  `America/Detroit`), stop-on-reply, text-only, open + link tracking OFF, unsubscribe header ON,
  gap 10 + 15 random min. Emails 2–3 send with an EMPTY subject (native threading); Email 4
  breaks the thread on purpose. Footer postal address = 30 North Main St, Leominster, MA 01453
  (CAN-SPAM requires one — no B2B exemption).
- **Keys** (`supabase/.env`, local only): `INSTANTLY_API_KEY` (`all:read`, poller),
  `INSTANTLY_ADMIN_API_KEY` (campaigns/leads, campaign + upload scripts),
  `INSTANTLY_SENDER_API_KEY` (`emails:all`, the auto-reply sender).
- Wave-1 result (100 leads, Sep 23 → Oct): 394 emails sent, 3 replies (1 no, 2 unknown), 1
  bounce, 0 unsubscribes, 0 opens tracked (tracking is off by design).

## 5. Reply handling (poller → webhook)

- **Windows scheduled task "Instantly Poll"** runs `scripts/instantly-poll.mjs` every 15 min
  (wrapped in run-hidden.vbs). It GETs `/emails?email_type=received` since a watermark + bounced /
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

## 6. Demo build, demo page, purchase, provisioning

- `generate-site` **subject adapter** `{prospectId}`: same 3-stage Opus chain as bookings, saves
  `preview_url` / `netlify_site_id` / `site_status` on `prospects`. ~$0.60–1.10 and ~4 min per
  site. Needs `ANTHROPIC_API_KEY` credits (org "Ace Web Designers's Individual Org" on
  platform.claude.com) and `NETLIFY_AUTH_TOKEN`. Admin retry: /admin Outbound → Retry build
  (`admin-data {action:'retryProspectSite', prospectId}`, forces).
- `/demo/<token>` (`DemoPage.tsx`, copy in `config/outboundPlan.ts`): first view fires
  `outbound-lead` in GHL with the demo URL; the page's own button is a second build gate for
  prospects who were never auto-built. Ready state → pre-suggested .com auto-checked
  (`domain-search` → Porkbun) → Stripe → `create-subscription` plan `demo_monthly`
  (`STRIPE_PRICE_DEMO_MONTHLY`) → `stripe-webhook` `kind:'demo_site'` (before the restaurant
  subscription branch — order matters; idempotent on `purchased_at is null`) → `provision-domain`
  (Porkbun register from prepaid balance — NON-refundable, availability re-checked right before —
  → DNS A @→75.2.60.5 + CNAME www → Netlify `custom_domain` → SSL poll, ~1h cap → `ssl_pending`,
  admin Retry re-enters). Purchased state polls `domain_status` every 10s. No customer email is
  sent on go-live by code — GHL's onboarding workflow does that.
- **Porkbun:** account `acewebdesigners` (hello@). Prod keys `PORKBUN_API_KEY/SECRET`; sandbox =
  `pk1_sb_*` keys on the MAIN URL + `PORKBUN_API_BASE` set (the old api-sandbox host is dead).
  ⚠️ Prepaid balance must be funded before a real purchase can provision.

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

- **2026-11-02:** Apify Starter active ($9.83 of $19 used this cycle). Scraped 1,750 places across
  MA/CT/RI/NH/ME (GC + remodeling + home builder) for $8.50; `enrich-emails` found emails on ~60% →
  **batch `2026-11-ne-gc` = 1,072 prospects with emails, all un-emailed except what's below.**
- **Wave 2 uploaded + campaign RE-ACTIVATED (status 1) 2026-11-02 ~00:05 ET:** 496 leads = the
  118 September leftovers + 377 new rows + the internal seed (1 invalid, 1 skipped). Campaign now
  holds 596 leads; Instantly reports 404 contacts left in the plan this month. First sends
  **Monday 2026-11-03 06:00 ET**, ~40/day. 695 rows of `2026-11-ne-gc` remain un-emailed for
  later waves (`export-instantly.mjs --batch 2026-11-ne-gc --limit N`).
- **Seed build result:** the webhook-started build deployed to
  `preview-ace-test-builders-668fb4.netlify.app` (HTTP 200) — but it took **~20 min**, not the ~4
  min seen in September. One accidental second build was forced via `funnel-admin.mjs
  prospect-build` right after it finished (the row's `updated_at` doesn't move on status changes, so
  it looked stuck). Treat build time as 5–20 min when designing the prospect-facing wait.
- **Open problem (owner, 2026-11-02):** a prospect who opens `/demo/<token>` before the build is
  done sits on "still generating". Goal: frictionless for them, no Opus build for everyone.
  Direction to evaluate next session: the reply-gated flow already builds BEFORE the link goes out
  (so yes-repliers never wait); for the page's own build button, show an instant templated preview
  (no LLM, seconds) and upgrade to the Opus build in the background + notify by email when ready.
- Next: fund Porkbun before the first real purchase; reply "yes" from rhyan@acewebdesignershq.com
  when Email 1 lands Monday to prove the in-thread auto-send; consider 2 more inboxes for 2× volume.
