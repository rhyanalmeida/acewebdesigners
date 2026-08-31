# Outbound Funnel — 6-Phase Launch Plan (2026-08-30)

**How to use this doc:** one phase per session. At the start of a session, find the first phase
with unchecked items, do them, check them off (edit this file), and stop at the phase boundary.
Steps are tagged **CLAUDE** (agent does it) or **OWNER** (only Rhyan can). Update the Status
line per phase as it moves: `not started → in progress → DONE (date)`.

**What this launches:** the already-built pipeline — scraped list → cold email via Instantly
(never GHL; LC Email bans scraped lists and a block would kill booking comms) → `/demo/<token>`
page → one-click Opus demo build (~$1, one build EVER per prospect) → $49/mo Stripe subscription
with the customer picking their .com at checkout → automatic Porkbun registration + DNS →
Netlify custom domain + SSL → live. All code is deployed and smoke-tested (see CLAUDE.md
"Outbound cold-email demo funnel"). No Meta pixel/CAPI anywhere in this funnel.

**Decisions locked 2026-08-30:** price **$49/mo** · Supabase keep-alive = **free scheduled
ping** (not Pro) · lead list = **Apify CSV from owner** · registrar = Porkbun · sender =
Instantly on 2–3 lookalike domains.

**Parallelism:** Phase 4's ~3-week inbox warm-up is the long pole — start it as early as
possible; Phases 2/3/5 proceed during warm-up. Nothing cold-emails a real prospect until
Phase 6, and never before Phase 5 is fully green.

---

## Phase 1 — Infrastructure unblock
Status: in progress (2026-08-30 — tasks 1–2 DONE; remainder blocked on OWNER Anthropic credits,
probed same day: API still returns "credit balance is too low")

- [x] **CLAUDE** Supabase keep-alive: daily Windows scheduled task (pattern: the existing
      Clean-Caches task) curling the public `slots` endpoint so the free-tier project never
      auto-pauses again (it sat INACTIVE ~early-Aug → 8/30; bookings were dead). Script in
      `scripts/`, register via `schtasks`, verify one manual run.
      *(2026-08-30: `scripts/supabase-keepalive.ps1`, task "Supabase Keep-Alive" daily 9:00 AM,
      manual run OK 200; logs to `%LOCALAPPDATA%\supabase-keepalive.log`.)*
- [x] **CLAUDE** Price display: `src/config/outboundPlan.ts` `monthly: 149 → 49`; `npm run
      build` + direct Netlify deploy (git push does NOT ship the frontend); grep the live
      bundle for the change.
      *(2026-08-30: deployed; live `DemoPage-*.js` chunk greps `monthly:49`.)*
- [ ] **OWNER** Anthropic credits: top up at platform.claude.com (hello@ Google login). This
      blocks demo builds AND the booking funnel's preview sites + sales briefs.
- [ ] **CLAUDE** (after credits) Seed niche playbooks: `node scripts/seed-niche-playbooks.mjs`
      (~$0.15–0.35/trade; pending since 8/03; watch for the one-off WORKER_RESOURCE_LIMIT).
- [ ] **CLAUDE** (after credits) One real demo build on an `is_test` prospect (~$1) — insert
      row via Management API SQL, hit `demo-site` `{action:'build'}`, eyeball the deployed
      preview for quality, then delete the row.

## Phase 2 — Money + domain rails
Status: not started

- [ ] **OWNER** Porkbun: create account → API Access → generate API key + secret (and sandbox
      keys) → load **$50** balance → enable auto top-up. Put the values in `supabase/.env`
      (gitignored) — never in chat or committed files.
- [ ] **CLAUDE** Set secrets `PORKBUN_API_KEY` / `PORKBUN_SECRET_API_KEY` /
      `PORKBUN_API_BASE=https://api-sandbox.porkbun.com/api/json/v3` (sandbox FIRST).
      ⚠️ Setting secrets restarts every isolate — never while a build is in flight, and never
      run `secrets set --env-file` with any empty local key.
- [ ] **CLAUDE** Stripe via API (existing `STRIPE_SECRET_KEY`): create Product + recurring
      **$49/mo** Price → set `STRIPE_PRICE_DEMO_MONTHLY`; add `customer.subscription.deleted`
      to the existing webhook endpoint's enabled events.
- [ ] **CLAUDE** Sandbox provisioning test: insert `is_test` prospect, stamp `purchased_at` +
      `chosen_domain` via SQL, invoke `provision-domain` → verify status walk
      `registering → dns_set → attached`, and that sandbox-stalled SSL parks at `ssl_pending`
      via the attempt cap. Clean up, then set `PORKBUN_API_BASE` empty (prod) — real
      purchases wait for Phase 5.

## Phase 3 — GHL wiring (parallel with Phase 2)
Status: not started

- [ ] **CLAUDE** `node scripts/ghl-setup-custom-fields.mjs` (idempotent; now includes
      `preview_url` + `chosen_domain`) → set the printed `GHL_CUSTOM_FIELD_IDS` secret.
- [ ] **CLAUDE** (Playwright, GHL UI — workflows can't be created via API) Workflow
      **"Outbound — Interested Lead"**, trigger tag `outbound-lead`: staff SMS + email alert
      (prospect name, business, demo link from the `preview_url` custom field). NO
      prospect-facing sends — Instantly owns the sequence until pilot data says otherwise.
      Re-entry OFF. Gotcha: the Publish toggle is a pending change — click **Save** after.
- [ ] **CLAUDE** (Playwright) Workflow **"Outbound — Purchased (Onboarding)"**, trigger tag
      `outbound-purchased`: customer welcome email (what happens next; site live within ~1h)
      + staff alert. Re-entry OFF. Never touch/re-enable the old disabled CAPI workflow.
- [ ] **CLAUDE** Generate a random `INSTANTLY_WEBHOOK_SECRET` → set secret (consumed in
      Phase 4).

## Phase 4 — Sending infrastructure (start ASAP — warm-up ≈ 3 weeks)
Status: not started

- [ ] **OWNER** Buy 2–3 lookalike sending domains at Porkbun (~$33/yr total), e.g.
      `acewebdesign.co`, `aceweb-designers.com`, `getacewebdesigners.com`. NEVER cold-send
      from acewebdesigners.com — a burned lookalike is disposable, the main domain is not.
- [ ] **OWNER** Google Workspace Business Starter: **2 inboxes per sending domain**
      (~$28–42/mo total), e.g. rhyan@ + hello@ on each.
- [ ] **OWNER** Instantly.ai account (Growth ~$37/mo): connect every inbox, enable warm-up on
      all. **The 3-week warm-up clock starts here.**
- [ ] **CLAUDE** Per sending domain: SPF + DKIM (from Workspace) + aligned DMARC (`p=none`)
      records and a 301 redirect to acewebdesigners.com — set via Porkbun, verify with dig +
      an auth checker.
- [ ] **CLAUDE** Configure the Instantly webhook →
      `https://dwsmrruzufqpopdzlszw.supabase.co/functions/v1/instantly-webhook?secret=<value>`;
      fire test events; verify `suppressions` rows + `outbound-lead` tag land.
- [ ] **BOTH** Cold sequence (2–3 touches): CLAUDE drafts, OWNER approves. Hard rules: no
      invented stats or social proof (owner rule), truthful free-preview framing, physical
      postal address in the footer (**OWNER: provide it**), Instantly unsubscribe link,
      `{{demo_url}}` as the CTA.

## Phase 5 — Full-pipeline dry run (gate: before ANY cold email)
Status: not started

- [ ] **CLAUDE + OWNER's card** End-to-end as a fake prospect on our own email: 1-row CSV →
      `import-prospects.mjs` → open `/demo/<token>` → build (~$1) → domain search → real $49
      checkout → real Porkbun registration (~$11) → DNS → custom_domain → SSL → **live site
      on its own .com**. Verify every transition in /admin → Outbound.
- [ ] **CLAUDE** Cancel the subscription in Stripe → verify the `customer.subscription.deleted`
      handler (row cancelled + GHL field) → refund the $49 → detach the domain in Netlify
      (manual teardown path). Keep the domain as a burner (non-refundable).
- [ ] **CLAUDE** Instantly loop test: send to my own address through the campaign, reply
      (→ `replied_at` + GHL tag) and unsubscribe (→ suppression row).
- **Exit criteria: every stage green. Net cost ≈ $12 + $1 build. No cold email before this.**

## Phase 6 — Pilot, then ramp (after warm-up completes)
Status: not started

- [ ] **OWNER** Deliver the Apify CSV: one trade, US-only, emails included.
- [ ] **CLAUDE** `node scripts/import-prospects.mjs --file <csv> --batch <label> --trade
      <slug>` → `node scripts/export-instantly.mjs --batch <label>` → **OWNER** uploads the
      CSV to the Instantly campaign (map `demo_url`).
- [ ] **BOTH** Pilot: 10–20 prospects at trickle volume. Watch /admin Outbound (emailed →
      viewed → built → replied → purchased) and Instantly (bounces <3%, spam <0.1%).
- [ ] **BOTH** Ramp only on healthy deliverability: ~30/inbox/day ⇒ ~100–150/day at 2–3
      domains. Scaling further = more domains + inboxes (2/domain), never more per inbox.

**Pre-committed review triggers (decided 2026-08-30 — don't rationalize past them):**
- 200 emailed, 0 demo-page clicks → STOP; rework subject/copy before another send.
- Clicks arriving but <30% click→build → rework the demo-page intro (the build-button pitch).
- Any ESP block or spam-rate spike → halt that inbox/domain immediately; let warm-up recover.
- Economics guardrail: builds ≈ $1 each — healthy even at 1 purchase per 100 builds at $49/mo.

---

## Cost summary
One-time: ~$33 sending domains · ~$12 net dry run · ~$20 Anthropic seeding/test builds.
Monthly: Workspace ~$28–42 · Instantly ~$37 · ~$1 per demo build (clicks only) · $11/yr per
customer domain (absorbed by $49/mo).

## Standing guards (every session)
- `npm run build && npm run lint && npm run test` after any code change; frontend ships ONLY
  via the direct Netlify deploy command (production branch is `master`, work is on
  `redesign/marketing-site`).
- Never set Edge secrets or redeploy `generate-site` while a build is in flight.
- Suppression list (`suppressions` table) is law: enforced at import AND export; never email
  around it.
