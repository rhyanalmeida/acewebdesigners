# Task: Outbound funnel — Monday go-live watch + fix the "/demo still generating" wait without building a site for everyone
(handoff written 2026-11-02 00:15 ET, against commit 222dfc1 on redesign/marketing-site)

## RECONCILE FIRST
This brief decays. Before trusting anything: read `docs/OUTBOUND_FLOW.md` (the outbound runbook — CLAUDE.md's
outbound section is now a 23-line pointer to it), run `git log --oneline 222dfc1..HEAD`, and re-verify every
file/symbol named below still exists. Treat this as a map, not gospel. Stay lean: grep CLAUDE.md sections, don't
read it whole; delegate broad searches to subagents.

## WHY
Owner (2026-11-01/02): "I want that list sending emails tonight", "make sure site generation and emails are
working and everything is going through GHL", "add however much you think ... to get a sale this week", and the
problem to focus on NEXT: "when you click the link it's still generating — how can we get around it so it's as
frictionless and cost efficient as possible so they are not waiting around and we don't make a site for everyone."

## GOAL (this session's unit)
1. Monday 2026-11-03 06:00 ET: confirm wave 2 actually sends, the seed reply proves the in-thread auto-send, and
   replies flow to GHL. Keep the owner informed with real numbers.
2. Design + implement the demo-page wait fix: a prospect who opens /demo/<token> must never sit on "generating"
   for 5–20 min, AND an Opus build (~$0.60–1.10, measured ~20 min tonight) must only run for prospects who showed
   interest — not for every link open.

## OWNER QUESTION TO ANSWER (asked 2026-11-02)
"If I put my personal phone number into Porkbun for verification, will it mess with GHL SMS sending?"
Answer: **No.** Porkbun's phone verification is stored only in Porkbun's account / registrant contact record
(and WHOIS privacy is ON for both sending domains, so it isn't published). GHL SMS is sent from GHL's own
LC Phone / A2P-10DLC-registered number and the staff alerts go TO +17743293117; the two systems share no
data, numbers, or carrier registration. Nothing in Porkbun can affect GHL deliverability. Only caveat: use a
number you can actually receive a verification call/text on — Porkbun gates domain purchases behind it.
[REASONED from how both systems work; not something that can be "tested" — no code path links them.]

## CURRENT STATE
- Committed [VERIFIED]: 222dfc1 (enrich-emails.mjs, funnel-admin.mjs `prospect-build`, docs/OUTBOUND_FLOW.md,
  CLAUDE.md slim). This handoff file is NOT yet committed. NOT pushed: 4+ commits ahead of origin (69cc7c1,
  ad5fbe8, 23ea62f, 222dfc1). Push is safe — Netlify builds `master`, work is on `redesign/marketing-site`,
  so push never deploys.
- Frontend: nothing changed this session; the demo-page UX from 69cc7c1 IS live [VERIFIED last session].
- Edge functions: nothing redeployed this session.
- DB [VERIFIED via Management API]: `prospects` batches — `2026-11-ne-gc` 1,072 rows (377 emailed_at stamped
  tonight, 695 still un-emailed), `2026-09-newengland-gc` 218 (all emailed), `internal-seed` 1
  (rhyan@acewebdesignershq.com, id fe45cd2f-b9d4-45c3-9889-447006b5ab68, token 2dd901abd7eaeac52163794f9c515471,
  is_test=false, auto_send=true, reply_email_id NULL), `sample-keep` 1 (suppressed).
- Instantly [VERIFIED via API 00:05 ET]: campaign 46657029-fdd6-4567-b5fe-2165bb298367 status 1 (ACTIVE —
  it was 3/COMPLETED; re-activated via POST /campaigns/<id>/activate), 596 leads (100 old + 496 uploaded tonight),
  `remaining_in_plan: 404` (Growth-plan contact cap). Schedule weekdays 06–11 ET, 20/day/inbox, 2 inboxes
  → ~40 new leads/day. First sends Monday 06:00 ET. Wave-1 stats: 394 sent, 3 replies, 1 bounce.
- Seed build [VERIFIED]: webhook-started build deployed to https://preview-ace-test-builders-668fb4.netlify.app
  (HTTP 200) after ~20 MIN (not the ~4 min documented in Sept). Then a SECOND build was accidentally forced
  (`node scripts/funnel-admin.mjs prospect-build <id>`) because `updated_at` doesn't move on status changes and it
  looked stuck → row read `generating` again at 00:08 ET; expect it to return to `deployed` on the same
  netlify_site_id 07f33359-…; if it reads `failed` later, retry via /admin Outbound → Retry build.
- GHL [VERIFIED]: every replied prospect incl. the seed has a ghl_contact_id (seed → tPaTD4SbFSNq5cyUS7qq); the
  staff "Outbound — Interested Lead" alert fired for the seed tonight. The GHL token in LOCAL supabase/.env is
  STALE (401); the DEPLOYED Edge secret works — never "fix" the Edge secret from the local file.
- Apify [VERIFIED]: Starter plan ($19 cap, BRONZE pricing), $9.83 used, cycle ends 2026-12-01.
- Anthropic [VERIFIED 2026-11-01 ~23:50 ET]: key in supabase/.env has credit (1-token haiku call → 200).
- Porkbun balance: UNKNOWN — no balance endpoint; last known (2026-08-31) "no card/balance". A real $49
  purchase will succeed at Stripe and then FAIL at `provision-domain` register until funded. Owner must check
  porkbun.com → Account → Billing (and complete phone verification — see OWNER QUESTION above).
- Poller [VERIFIED]: Windows task "Instantly Poll" ticking every 15 min, log `%LOCALAPPDATA%\instantly-poll.log`
  lines read `OK seen replies=0 … links_sent=0`.

## ENVIRONMENT & ACCESS GOTCHAS (session-learned)
- Auto-mode classifier DENIED: PowerShell `Get-ScheduledTaskInfo`, and any command touching `~/.secrets/*`
  (even grep -c). Use `schtasks /query` and don't read ~/.secrets; Instantly/Apify/Anthropic keys are in
  `supabase/.env` and are fine to read via grep/cut.
- Supabase Management API logs: `/analytics/endpoints/logs.all` is REMOVED; `/analytics/endpoints/logs` with
  `sql=` rejected tables `function_logs`, `function_edge_logs`, `edge_logs` → no Edge logs were obtained.
  UNKNOWN which collection name works; `npx supabase functions logs` or the dashboard are the fallback.
- Instantly keys (supabase/.env): INSTANTLY_API_KEY (read, poller), INSTANTLY_ADMIN_API_KEY (campaigns/leads;
  `/accounts` returned nothing — lacks that scope), INSTANTLY_SENDER_API_KEY (emails:all; GET /emails → 200).
- Apify `scrapeContacts` is a paid per-place event ($0.002 BRONZE) — don't use it; `scripts/enrich-emails.mjs`
  matched its yield for $0.
- Apify `state` comes back as full names ("Connecticut") or blank (10–25% search bleed); importer keeps both,
  stores "CONNECTICUT"; export writes it to the `state` column (not used in copy — `{{city}}` is).
- `import-prospects.mjs` upsert on gmaps_place_id MOVES an existing row's `batch` to the new label (33 Sept
  rows got re-labelled; the emailed ones were moved back by SQL). Export is still safe (filters emailed_at).
- `python` is not installed; `nodemailer` is not installed. Use Node + fetch.
- Prospects `updated_at` does NOT change on site_status updates (no trigger) — don't use it to judge "stuck".

## REPRODUCE & BASELINE
- Build duration baseline: webhook POST at 04:58:06 UTC → `deployed` observed between 05:15 and 05:20 UTC
  (~20 min). Re-measure: insert an is_test prospect, `node scripts/funnel-admin.mjs prospect-build <id>`,
  poll `select site_status from prospects where id=…` every minute.
- Reply→GHL→build path repro (production, costs ~$1, fires the staff SMS):
  `curl -X POST "https://dwsmrruzufqpopdzlszw.supabase.co/functions/v1/instantly-webhook?secret=$INSTANTLY_WEBHOOK_SECRET"
   -H content-type:application/json -d '{"event_type":"reply","lead_email":"<prospect email>","campaign_id":"46657029-…","reply_text":"Yes please","eaccount":"rhyan@getacewebdesigners.com","subject":"Re: X homepage?"}'`
  → `{"received":true,"sentiment":"yes","auto_send":true,"build_started":true}`. With no `email_id` the row can
  never auto-send (auto_send_pending requires reply_email_id) — that's what makes it a safe test.
- Email-yield baseline: Apify --contacts 147/250 (CT), our crawler 149/235 (MA), 167/294, 120/197, 136/245,
  138/249, 127/235 → ~0.6 emails/place, ≈$0.007/email at $0.004/place.
- Transcript of the writing session: ~/.claude/projects/C--Projects-acewebdesigners/6a16249f-7d21-4b83-b490-d15b00a1e3d6.jsonl

## ARCHITECTURE MAP (the wait problem)
- `src/pages/DemoPage.tsx`: on mount fetches `demo-site` state; **effect at ~L154–158: if `siteStatus==='none'`
  it calls `startBuild()` AUTOMATICALLY on first view** [VERIFIED by grep] — i.e. today EVERY prospect who opens
  their link triggers an Opus build, and sits in the `generating` state polling every 5s (~L160–165). This is
  the root of both halves of the owner's complaint (waiting + building for everyone). The header comment
  (L12) still describes the state as a "DONE preview" — the reply-gated v4 flow was meant to deliver only
  deployed links, but the page's auto-start undermines the cost gate for anyone who reaches the page
  otherwise (old v2 links, forwarded links, GHL "Demo Preview URL" field, the demo_url column still exported).
- `supabase/functions/demo-site/index.ts`: GET state (`publicPayload`, ~L56–67) + POST build with the atomic
  `none→generating` gate (~L94–99) that fire-and-forgets `generate-site {prospectId}`; `failed` written on error.
- `supabase/functions/instantly-webhook/index.ts`: reply → `classifyReply` → on yes sets `auto_send` + `startBuild`
  if `site_status==='none'`; `auto_send_pending` returns deployed+unsent rows; `demo_link_sent` stamps.
- `scripts/instantly-poll.mjs` `sendDemoLinks()` → `POST /emails/reply` with `demoLinkReply()` from
  `scripts/lib/instantly-events.mjs` (the auto-sent email body — says "$49/mo", describes the page).
- `supabase/functions/generate-site/index.ts`: 3-stage Opus chain, prospect subject adapter; `force` bypasses
  the deployed check. Stage isolates can die (~400s) — a stuck `generating` with no `failed` is possible.
- `src/config/outboundPlan.ts`: all demo-page copy (GO_LIVE_STEPS / AFTER_LIVE / FAQ); claims only what code does.

## RELEVANT FILES (by symbol)
- DemoPage.tsx — `startBuild`, `fetchState`, the `siteStatus==='none'` auto-start effect, generating poll.
- demo-site/index.ts — `publicPayload`, the none→generating conditional update.
- instantly-webhook/index.ts — `startBuild`, `auto_send_pending`, `demo_link_sent`, `ghlSyncStage({funnel:'outbound'})`.
- instantly-poll.mjs — `sendDemoLinks`; instantly-events.mjs — `mapReceivedEmail` (drops non-campaign +
  auto-replies), `demoLinkReply`.
- scripts/enrich-emails.mjs (new) — `crawl`, `extract`, `rank`; scripts/funnel-admin.mjs — `prospect-build`.
- scripts/export-instantly.mjs (`--batch --limit --no-stamp`), scripts/instantly-upload-leads.mjs.
- docs/OUTBOUND_FLOW.md §3 (waves/throughput), §5 (reply handling), §8–9 (verification log, status).

## DECISIONS MADE / REJECTED (+why)
- Segment = real-website contractors, redesign copy (only email-bearing segment). REJECTED: no-website list
  (no email source; cold SMS/calls = TCPA), social-only (≈1–2%, too thin).
- Scrape without `--contacts`, enrich ourselves ($0, equal yield). Scrape runs always capped (`--budget`).
- Uploaded 496 (not all 1,190): Instantly Growth contact cap (404 left) and 40/day throughput — a bigger
  upload wouldn't send faster. Left campaign schedule (06–11 ET weekdays) untouched — evidence-based, and
  cold email on Saturday night is bad.
- Did NOT touch campaign copy: every uploaded row has a real website, so the redesign opener fits.
- Seed inbox (rhyan@acewebdesignershq.com) added as a REAL lead so Monday's Email 1 can be replied to from
  Gmail → proves the full auto-send loop with a real reply_email_id. REJECTED: faking reply_email_id with a
  real prospect's id (would send our test link into a real prospect's thread).
- Build-leg test used the production webhook on a non-test row (so GHL + build + staff alert all fire) rather
  than an is_test row (is_test skips GHL and auto_send → proves nothing).

## INVESTIGATE FIRST (unknowns)
- [UNKNOWN] Why the build took ~20 min vs ~4 min in Sept — Anthropic latency? stage retries? Check Edge logs
  (find the right logs collection) or time a fresh is_test build. This number drives the UX design.
- [VERIFIED] DemoPage auto-starts a build on first view when status is `none` — decide: remove the auto-start
  (page becomes a true "deployed-only" viewer; status `none` shows "reply yes / we'll build it" copy) OR keep a
  one-click explicit button. Owner's framing says: no build without a clear interest signal.
- [UNKNOWN] Whether any live lead ever receives a /demo link while `none` — v4 copy has no {{demo_url}}, the
  auto-send only fires on `deployed`, so the only paths are: the GHL "Demo Preview URL" field (staff only),
  the exported CSV's demo_url column (unused by the template), forwarded links. Confirm by grepping the live
  sequence doc + `scripts/lib/instantly-campaign.mjs`.
- [ASSUMED] Owner's "frictionless" means: an interested prospect sees SOMETHING in seconds. Candidate designs:
  (a) instant templated/static preview (no LLM, seconds) + background Opus upgrade + email-when-ready
  (`demo_link_sent`-style stamp); (b) keep reply-gating as the ONLY trigger and make the page's `none` state
  say "we're building it — you'll get the link by email"; (c) show a generic trade sample site instantly
  (from `design_systems`/existing previews) while the real one builds. Present these to the owner with cost
  per path before coding; (b) is the cheapest and already 90% built.
- [UNKNOWN] Porkbun balance (see CURRENT STATE). Blocking for the first real sale's provisioning.
- [UNKNOWN] Instantly `remaining_in_plan` semantics (contacts/month?) — matters before wave 3 (695 rows wait).
- [UNKNOWN] Whether the owner wants 2 more Workspace inboxes ($8.40 each + 2–3 wk warm-up) — the only lever
  for "a sale this week"-scale volume. Ask once.

## SUCCESS CRITERIA
- Monday ≥06:00 ET: `GET /campaigns/analytics?id=…` shows `new_leads_contacted_count` rising above 100 and
  `campaign_status` 1; /admin Outbound shows new "emailed" rows getting first-touch status.
- Seed proof: owner (or you via Gmail) replies "yes" to Email 1 in rhyan@acewebdesignershq.com → next poller
  tick log shows `forwarded=1`, then `links_sent=1`; DB row `demo_link_sent_at` set; the demo link arrives
  in-thread from rhyan@getacewebdesigners.com. GHL contact already exists — no duplicate created.
- Wait fix: a prospect opening /demo/<token> with no build sees a meaningful page in <2s and NO Opus build
  starts unless an explicit interest signal exists (reply "yes" or an explicit click, per owner's choice);
  cost per non-interested link open = $0. Verify: insert an is_test prospect, open its /demo URL → DB
  `site_status` stays `none`; `npm run build && npm run lint && npm run test` pass; deploy via
  `npm run build && npx netlify deploy --prod --dir=dist --site=4ea5b9c0-5a70-406f-a928-7f009290f519` and grep
  the production chunk for a string you added.
- Owner verifies: open any un-built prospect's /demo link → no spinner wait; /admin Outbound → seed row
  "link sent"; Instantly dashboard → sends on Monday.

## FAILURE CRITERIA (stop and back out)
- Any Opus build triggered by a mere page view (status none→generating with no reply/click).
- Auto-send fires to a prospect whose site is not `deployed`, or more than once (demo_link_sent_at guard).
- Campaign settings changed (schedule, daily limit, tracking) without an explicit owner ask.
- A redesign-angle email sent to a row with no website, or a suppressed email re-uploaded.
- Edge secrets set from `supabase/.env --env-file` (would clobber the working GHL token with the stale one and
  push APIFY/INSTANTLY keys as Edge secrets).

## DO NOT BREAK
- Atomic `site_status none→generating` gate (demo-site + instantly-webhook) — the one-build-ever guarantee.
- `auto_send_pending` predicate (auto_send ∧ deployed ∧ ¬suppressed ∧ demo_link_sent_at null ∧ reply_email_id
  not null) and the `demo_link_sent` stamp — exact-once sending.
- `mapReceivedEmail` dropping non-campaign/auto-reply mail (otherwise warm-up traffic fires GHL alerts).
- `import-prospects.mjs` column contract (`title, emails/0, phone, city, state, website, placeId,
  categoryName, totalScore, reviewsCount`) and upsert-on-gmaps_place_id semantics.
- `suppressions` enforcement in import + export. Footer postal address in the sequence (CAN-SPAM).
- Never cold-send from acewebdesigners.com or via GHL. Never set Edge secrets mid-build (kills isolates).
- `/demo/` stays pixel/CAPI-free (index.html + App.tsx exclusions).

## OUT OF SCOPE / DEFERRED
- Wave 3 (695 un-emailed rows in 2026-11-ne-gc) — only after Instantly cap/throughput is understood and
  wave 2 is flowing. More scraping — not needed; list exceeds send capacity for weeks.
- No-website opener / non-email channel — rejected segment.
- Anthropic Max-plan API credits: owner action (claude.ai → Settings → Billing → API credits → Link
  organization → "Ace Web Designers's Individual Org"; 7-day wait for new subscribers).
- Restaurant funnel, contractor ad funnel, demo-page copy tweaks — untouched, leave alone.

## PROCESS
- Commands: `npm run lint` (zero warnings) · `npm run test` (vitest, 72 passing at 222dfc1) · `npm run build` ·
  frontend deploy = `npm run build && npx netlify deploy --prod --dir=dist --site=4ea5b9c0-5a70-406f-a928-7f009290f519`
  (git push does NOT deploy) · Edge deploy = `npx supabase functions deploy <name>` (demo-site/generate-site
  are `--no-verify-jwt`; never redeploy generate-site while a build is running) · DB = Management API SQL
  `POST https://api.supabase.com/v1/projects/dwsmrruzufqpopdzlszw/database/query` with $SUPABASE_ACCESS_TOKEN
  (the Supabase MCP points at the wrong project).
- Instantly API: `https://api.instantly.ai/api/v2`, Bearer keys from supabase/.env; campaign analytics at
  `GET /campaigns/analytics?id=<id>`; poller dry run `node scripts/instantly-poll.mjs --dry`.
- Risk: the reply→build→send loop is production and spends real money + emails real contractors — test only
  on is_test rows or our own seed address; anything that sends email or spends needs the owner's go.
  Owner preference: act autonomously on reversible steps, truthful copy only, keep CLAUDE.md lean and update
  docs/OUTBOUND_FLOW.md §9 in place after changes.
- Stay lean: don't re-read CLAUDE.md or OUTBOUND_FLOW.md in full — grep the section you need; delegate broad
  searches to subagents so you don't rebuild the bloated context this handoff escaped.
