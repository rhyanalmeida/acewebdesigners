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
      *(2026-09-14 OWNER DECISION: deferred, together with the Porkbun balance, until the
      funnel is "rolling" — the FIRST client's demo build + domain get done BY HAND. Consequence
      to remember: a prospect who clicks "Build my free preview" with no credits lands on the
      existing `failed` state copy — "hit a snag on our side… reply to our email and we'll
      build it for you" — so replies still flow to the GHL staff alert. Acceptable for a
      hand-held pilot, NOT for scale: top up before the ramp.)*
- [ ] **CLAUDE** (after credits) Seed niche playbooks: `node scripts/seed-niche-playbooks.mjs`
      (~$0.15–0.35/trade; pending since 8/03; watch for the one-off WORKER_RESOURCE_LIMIT).
- [ ] **CLAUDE** (after credits) One real demo build on an `is_test` prospect (~$1) — insert
      row via Management API SQL, hit `demo-site` `{action:'build'}`, eyeball the deployed
      preview for quality, then delete the row.

## Phase 2 — Money + domain rails
Status: in progress (2026-08-31 — all CLAUDE tasks done incl. a required registerDomain API
fix; remaining OWNER action: $50 Porkbun balance + auto top-up, blocked on no card on file)

- [x] **OWNER→CLAUDE** Porkbun: agent created the account 2026-08-30 (username
      `acewebdesigners`, hello@; registrant = owner's real EIN-listing address; password in
      `~/.secrets/porkbun-credentials.txt`) → API Access enabled for all domains → prod +
      sandbox keys generated (titles `supabase-prod`/`sbx`) into `supabase/.env`.
      ⚠️ **$50 balance + auto top-up still OWNER**: account has no card on file — add a card
      at porkbun.com → Account → Billing, load $50, enable auto top-up (needed before
      Phase 5's real registration; sandbox needed none). Note: 3 stray untitled API keys
      ("code") were created by a UI misfire — secrets unseen/unrecoverable; delete at leisure.
- [x] **CLAUDE** Porkbun secrets set individually 2026-08-30. ⚠️ Reality changed vs plan:
      the `api-sandbox.porkbun.com` host is DEAD (403). Sandbox is now **key-driven**:
      `pk1_sb_*` keys against the SAME `https://api.porkbun.com/api/json/v3` (responses carry
      `"sandbox": true`, $1,000 fake credit). For the test, deployed keys = sandbox keys with
      `PORKBUN_API_BASE` set to the main URL (satisfies provision-domain's is_test guard);
      flipped to prod keys + `PORKBUN_API_BASE` unset at end of phase. Ping verified both.
- [x] **CLAUDE** Stripe done 2026-08-30 via restricted key `claude-ops` (Products/Prices/
      Webhook Endpoints write; in `supabase/.env` — the full deployed `STRIPE_SECRET_KEY` is
      write-only and was NOT recoverable): product `prod_VAfN7P63mmSbnl` + price
      `price_1UAK4BJHIJK0EFOzqlk5VOaJ` ($49/mo USD, active) → `STRIPE_PRICE_DEMO_MONTHLY`
      secret set; `customer.subscription.deleted` added to existing endpoint
      `we_1TniowJHIJK0EFOzumhuA7xu` (kept `checkout.session.completed`); verified by API
      read-back.
- [x] **CLAUDE** Sandbox provisioning test 2026-08-30: is_test prospect + throwaway Netlify
      site → `provision-domain` → **found + fixed a real bug**: Porkbun `/domain/create` now
      requires `cost` (integer cents, must equal checkDomain's price) + `agreeToTerms` —
      `registerDomain` sent neither ("Cost must be a valid integer"). Fix in
      `_shared/porkbun.ts` (+ provision-domain passes `check.price`), deployed. After fix:
      sandbox register + DNS + Netlify attach walked `registering → dns_set → attached`.
      ⚠️ The `ssl_pending` park was NOT observed: the self-invoking SSL poll chain died
      silently (row still `attached` 9h later; `step:'ssl'` can't be re-entered from
      outside — internal-key only, and the Mgmt-API service_role ≠ runtime key). Not a
      launch blocker (an `attached`-stuck row is recoverable via /admin Retry and Netlify
      keeps retrying SSL itself once DNS resolves) — but watch the Phase 5 dry run: if it
      also stalls at `attached`, the selfInvoke chain needs hardening. Test row +
      throwaway site deleted; prod keys live, `PORKBUN_API_BASE` unset — real purchases
      still wait for Phase 5 (and the $50 balance).

## Phase 3 — GHL wiring (parallel with Phase 2)
Status: DONE (2026-08-31)

- [x] **CLAUDE** `node scripts/ghl-setup-custom-fields.mjs` (idempotent; now includes
      `preview_url` + `chosen_domain`) → set the printed `GHL_CUSTOM_FIELD_IDS` secret.
      *(2026-08-31: 21 fields matched, 2 created — Demo Preview URL `ywQp2gT8RhVEFGFjHq5b`
      / fieldKey `contact.demo_preview_url`, Purchased Domain `MKwDW5R9q5ZOCuqRtYu7` /
      `contact.purchased_domain`. Secret set via single `secrets set` after 0-builds-in-flight
      check; local supabase/.env synced. Also fixed a gap: nothing populated `preview_url` in
      GHL — added the `/demo/<token>` URL as a qualifier in demo-site + instantly-webhook
      `ghlSyncStage` calls, both deployed.)*
- [x] **CLAUDE** (Playwright, GHL UI — workflows can't be created via API) Workflow
      **"Outbound — Interested Lead"**, trigger tag `outbound-lead`: staff SMS + email alert
      (prospect name, business, demo link from the `preview_url` custom field). NO
      prospect-facing sends — Instantly owns the sequence until pilot data says otherwise.
      Re-entry OFF. Gotcha: the Publish toggle is a pending change — click **Save** after.
      *(2026-08-31: id `be242a43-d61d-4931-b7b7-cccd26181540` — Published (verified in list
      after save + re-open), re-entry OFF, staff SMS to +17743293117 + staff email to hello@,
      both merge in `{{contact.demo_preview_url}}`. Zero prospect-facing sends. Tags
      `outbound-lead`/`outbound-purchased` created in GHL via the trigger picker.)*
- [x] **CLAUDE** (Playwright) Workflow **"Outbound — Purchased (Onboarding)"**, trigger tag
      `outbound-purchased`: customer welcome email (what happens next; site live within ~1h)
      + staff alert. Re-entry OFF. Never touch/re-enable the old disabled CAPI workflow.
      *(2026-08-31: id `edd5c23c-5e48-4c25-8ac1-96dea2cfa9b5` — Published (verified),
      re-entry OFF. Welcome email from hello@: domain + ~1h go-live + reply-for-changes +
      $49/mo coverage, truthful framing, no invented stats. Staff SMS with
      `{{contact.purchased_domain}}`. Old CAPI workflow untouched. Builder gotcha found:
      the email editor autolinks `{{contact.name}}`-style tags — .name/.email/.phone/.company
      parse as TLDs — breaking "custom variables" validation; fix = select-all + unlink
      before saving.)*
- [x] **CLAUDE** Generate a random `INSTANTLY_WEBHOOK_SECRET` → set secret (consumed in
      Phase 4). *(2026-08-31: 48-hex value written to supabase/.env + set as Edge secret
      after a second 0-builds-in-flight check; value never echoed.)*

## Phase 4 — Sending infrastructure (start ASAP — warm-up ≈ 3 weeks)
Status: in progress (2026-08-31 — domains bought + full DNS/auth stack live on both, Workspace
live with both inboxes, Instantly trial live with inbox 1 connected + warm-up ON —
**⏱ 3-WEEK WARM-UP CLOCK STARTED 2026-08-31**. Remaining: inbox 2 Google sign-in block
(owner: one phone sign-in), Instantly webhook plan gating (decide at plan purchase),
sequence draft owner approval + postal address, Workspace plan downgrade decision by Sep 14)

- [x] **OWNER** Buy 2–3 lookalike sending domains at Porkbun. NEVER cold-send
      from acewebdesigners.com — a burned lookalike is disposable, the main domain is not.
      *(2026-08-31 BOUGHT: **getacewebdesigners.com** + **acewebdesignershq.com**, $11.08/yr
      each ($22.16 total, lean 2-domain plan), WHOIS privacy on, auto-renew on, expire
      2027-08-31. Agent staged cart via Playwright, owner paid via Stripe Checkout.)*
- [x] **OWNER+CLAUDE** Google Workspace: **1 inbox per sending domain** (scale to 2/domain at
      ramp). *(2026-08-31 DONE: agent drove signup via Playwright, owner paid. Org "Ace Web
      Designers", admin `rhyan@getacewebdesigners.com` (creds in
      `~/.secrets/google-workspace-credentials.txt`), secondary domain `acewebdesignershq.com`
      + second user `rhyan@acewebdesignershq.com` (temp password in same file, forced change
      on first sign-in). Both domains verified + Gmail activated + DKIM keys generated/confirmed
      in the wizard. ⚠️ Plan is **Business Plus** (Google preselected; no Starter option surfaced
      at checkout) — 14-day trial, $0 until Sep 14, then $19.80/user/mo (promo) → $26.40. OWNER
      DECISION: downgrade to Business Starter (~$7/user) in Admin console → Billing before
      Sep 14, or keep Plus. Agent offered; owner said "stop messing with it" mid-checkout, so
      left as-is.)*
      *(2026-09-14 RESOLVED: Admin console → Billing shows **Business Starter**, Flexible,
      $8.40/user, est. $16.80/mo, 2 licenses, Visa ••8765 on file, next bill Oct 1. No Plus
      subscription exists — nothing to downgrade.)*
- [x] **OWNER+CLAUDE** Instantly.ai account: connect every inbox, enable warm-up on all.
      **The 3-week warm-up clock starts here.**
      *(2026-08-31 MOSTLY DONE — agent-driven: account created on FREE TRIAL (login
      rhyan@getacewebdesigners.com, password in `~/.secrets/instantly-credentials.txt`; email
      verified; NO PLAN PAID YET — owner pays when trial ends or a gated feature is needed.
      **2026-09-14: trial EXPIRED** — app redirects to `/expired` paywall; both inboxes still
      list Active / 100% health / "standard warmup pool" but warm-up is unverified while locked.
      **Same day: owner bought Growth $47/mo monthly** (renews Oct 14). Post-purchase check:
      paywall gone, both inboxes Active, warm-up toggle ON since Aug 31, inbox 1 shows 60
      sent / 41 received / 0 spam over the prior week, so warm-up never actually stopped.
      Webhooks re-checked: still Hyper-Growth-gated → polling script it is. v2 API key
      (`all:read`) created and stored as `INSTANTLY_API_KEY` in `supabase/.env`; `GET
      /api/v2/accounts` returns both inboxes with `warmup_status:1`, score 100.)
      Instantly's OAuth app ("Instantly oAuth Email v1") configured as Trusted in Workspace
      App Access Control (one-time, org-wide). **Inbox 1 rhyan@getacewebdesigners.com
      CONNECTED via OAuth + WARM-UP ON → clock started 2026-08-31.** Two leftovers:
      (a) RESOLVED same day: inbox 2 rhyan@acewebdesignershq.com was hard-blocked by Google's
      new-account risk engine (2 rejections even with correct SMS codes); owner signed in once
      from their phone, which cleared it — **inbox 2 then CONNECTED via OAuth + WARM-UP ON,
      so BOTH inboxes are warming from 2026-08-31**. Lesson for future sending domains: after
      creating a Workspace user, sign into it once from a real device before OAuth connects.
      (b) **Webhooks are plan-gated**: "Add Webhook" pops an upgrade dialog (Hyper Growth
      $97/mo) on the trial. Not needed until sending starts (Phase 5/6) — when picking the
      paid plan, verify whether Growth (~$37/mo) includes webhooks; if truly Hyper-Growth-only,
      alternatives: poll Instantly API from a scheduled script into `instantly-webhook`, or
      budget the higher plan. Endpoint side is already tested and live either way.)*
- [x] **CLAUDE** Per sending domain: SPF + DKIM (from Workspace) + aligned DMARC (`p=none`)
      records and a 301 redirect to acewebdesigners.com — set via Porkbun, verify with dig +
      an auth checker. *(2026-08-31 FULLY DONE — same session as Workspace setup: DKIM
      `google._domainkey` TXT set + confirmed in the wizard for BOTH domains, MX swapped to
      `smtp.google.com` prio 1 (stale fwd2.porkbun.com rows removed; verified via
      nslookup @8.8.8.8) on BOTH. Earlier same day: SPF root TXT
      `v=spf1 include:_spf.google.com ~all` (replaced Porkbun's default `_spf.porkbun.com`
      SPF — gotcha: new domains ship parking DNS incl. a temporary l.ink URL forward, which
      was deleted), DMARC `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:hello@acewebdesigners.com;
      aspf=r; adkim=r`, permanent wildcard URL forward → https://acewebdesigners.com. Verified
      via nslookup @1.1.1.1 (both TXT pairs resolve) + curl (301 + Location live on
      getacewebdesigners.com; acewebdesignershq.com's 301 confirmed live later same day).)*
- [x] **CLAUDE** Configure the Instantly webhook →
      `https://dwsmrruzufqpopdzlszw.supabase.co/functions/v1/instantly-webhook?secret=<value>`;
      fire test events; verify `suppressions` rows + `outbound-lead` tag land.
      *(2026-08-31: ENDPOINT HALF DONE — curl bounce + unsubscribe (fake @example.com) → 200 +
      correct `suppressions` rows; curl reply on a throwaway non-is_test prospect → `replied_at`
      stamped + GHL contact created with tag `outbound-lead` + Demo Preview URL field carrying
      the `/demo/<token>` URL (verified via GHL API). All test rows + the GHL contact deleted.
      Side effect: the reply test fired one staff SMS/email via "Outbound — Interested Lead" —
      expected. REMAINING: paste the URL into Instantly → campaign → webhooks (reply/bounce/
      unsub events) once the account exists; secret value is in `supabase/.env`.)*
      *(2026-09-14 DONE VIA POLLING instead: Instantly webhooks are Hyper-Growth-only and
      we bought Growth. `scripts/instantly-poll.mjs` + scheduled task "Instantly Poll"
      (15 min) forward reply/bounce/unsub to the same endpoint — see CLAUDE.md. Verified:
      manual run + first scheduled run both exit 0 (0 events, nothing sent yet). Campaign
      **"Outbound — Contractors v2"** (`46657029-fdd6-4567-b5fe-2165bb298367`) created via
      API from the approved v2 draft, status Draft/not launched, settings verified in UI.
      Owner approved v2 copy as-is 2026-09-14; postal address (30 North Main St, Leominster, MA 01453 — the office) supplied same day and pushed with
      `node scripts/instantly-create-campaign.mjs --update 46657029-fdd6-4567-b5fe-2165bb298367`
      — no placeholders remain in the campaign.)*
- [x] **BOTH** Cold sequence (2–3 touches): CLAUDE drafts, OWNER approves. Hard rules: no
      invented stats or social proof (owner rule), truthful free-preview framing, physical
      postal address in the footer (**OWNER: provide it**), Instantly unsubscribe link,
      `{{demo_url}}` as the CTA.
      *(2026-08-31: CLAUDE draft done → `docs/OUTBOUND_COLD_SEQUENCE_DRAFT.md` — plain text,
      `{{demo_url}}` sole CTA, `{{unsubscribe}}` + postal-address placeholder in every footer,
      merge fields limited to what `export-instantly.mjs` emits.
      2026-09-01: draft revised to v2 per research (owner-requested): 4 touches Day 0/3/7/14,
      price removed from Day 0 and named once in Email 3, "Re:" threading on 2–3.
      2026-09-14: OWNER approved v2 as-is and supplied the office address (30 North Main St,
      Leominster, MA 01453) after a CAN-SPAM check — 16 CFR 316.2 allows street / USPS PO
      Box / CMRA only, no hidden-address option. Doc + campaign updated, zero placeholders.)*

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
