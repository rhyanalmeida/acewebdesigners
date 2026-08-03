# Research Audit — Contractor Funnel vs 2026 Best Practice (2026-08-03)

Read-only audit: six parallel web-research passes (source-graded) cross-checked against live Graph
API values and repo code. **No state was modified anywhere.** Source ratings: **[M]** Meta official ·
**[P]** named practitioner with data · **[L]** low-quality listicle · **[U]** uncertain/unverifiable.
Where our first-party data contradicts generic advice, our data wins (stated inline).

**Headline: zero unexplained deviations (❌) found.** The funnel matches Meta-official or strong
practitioner guidance on every load-bearing item. Findings are expectation-corrections and
post-flight opportunities, not defects. The standing commitments (run to $100, judge on leads only,
conversion event stays Lead, broad Advantage+, dataset stays, AN stays blocked) are all *supported*
by this research.

---

## 1. Scorecard

Verdicts: ✅ matches best practice · ⚠️ deviates with documented reason (or sources conflict) ·
❌ deviates unexplained. Evidence column = live API field or file verified 2026-08-03.

### A. Campaign / ad-set settings

| Item | We do | Evidence | Verdict |
|---|---|---|---|
| Budget level | CBO $20/day at campaign | API `daily_budget:2000` on campaign | ✅ With one ad set CBO≡ABO (Loomer [P]); it's also an Advantage+ qualification lever |
| Bid strategy | Highest volume, no cap | `bid_strategy: LOWEST_COST_WITHOUT_CAP` | ✅ Consensus for small budgets; no credible source recommends caps at $20/day; cost caps need conversion history we don't have [M]+[P] |
| Structure | 1 campaign / 1 ad set / consolidated | ad-set list | ✅ Loomer's ideal structure verbatim [P] |
| Budget size | $20/day → permanent Learning Limited | Meta: ~50 events/7d to exit [M]; at our CPL that needs $1.5–4k/wk | ⚠️ Owner decision, documented in AD_SET_PLAN. Meta official: "learning limited isn't a penalty" — delivery continues [M]. Creative remains the lever that works pre-learning |
| Optimization event | Lead (pixel 4230021860577001) | `promoted_object.custom_event_type: LEAD` ✅ pixel bound correctly | ✅ **Owner-locked and vindicated**: Meta's own low-volume remedy points *up*-funnel, never down [M]; no source recommends optimizing rarer events at $20/day |
| Attribution | 7-day click + **1-day engaged-video-view** | `attribution_spec` on ad set | ⚠️ AD_SET_PLAN said "7d click, no view" — live config has no view-through but carries the 1-day engage bucket (predates the 2026 engage-through split). Loomer's lead-gen rec is 1-day click [P], but shorter windows also starve an already-starved signal — sources genuinely conflict at low volume [U]. Changing it resets learning — **leave alone**, esp. mid-flight |
| Audience Network | Blocked account-wide | CLAUDE.md 2026-07-20; ad set carries no exclusions | ✅ Strongly validated: Loomer measured 3 quality visitors in 607 AN clicks [P]; our own data: 41% of LPV, 0 leads. Account-level control is right — ad-set exclusions carry the 5%-leak toggle |
| Marketplace / right column | Left on | account settings | ✅ No credible source recommends excluding them; each removed placement constricts the auction [M] |
| Advantage+ audience | On, broad US, no detailed targeting | `targeting_automation.advantage_audience:1`, no interests | ✅ Owner-locked doctrine; matches the 2025 winner and practitioner consensus for small budgets |
| Age suggestion 25–55 | Set 2026-08-03 | `targeting.age_range [25,55]` (legacy age_min/max 25/65 — normal, not a failed edit, confirmed by API-behavior research [P]) | ⚠️ **Expectation correction:** Loomer tested exactly this scenario (lead optimization + age suggestion) and Meta spent >78% of budget *outside* the suggested range [P]. The suggestion is nearly free but expect little steering. His proven fix that keeps Advantage+ on: **value rules** (bid −90% on 65+) — see §3 |
| Advantage+ status | CLAUDE.md says "Advantage+ leads campaign = On" | API: `advantage_state: DISABLED`, `advantage_audience_state: ENABLED`, `advantage_budget_state: ENABLED`, `advantage_placement_state: DISABLED` | ⚠️ Two of three qualification levers on; the placement lever reads DISABLED even though the ad set has **no** placement restrictions (verified: placement fields empty) — most plausible cause is the account-level AN block [U — no source documents this interaction]. Consequence appears to be labeling/Campaign Score only, and Campaign Score has no shown performance correlation [P]. Our AN-block evidence beats the label — keep the block. CLAUDE.md's "= On" wording is stale vs the API field |
| CTA button | API `call_to_action_type: BOOK_TRAVEL` | creative 1178436358691539 | ⚠️ `BOOK_TRAVEL` is (per API lore) the enum behind the "Book Now" display label, and CLAUDE.md records the CTA as "Book now" — but the 7/20 audit listed BOOK_TRAVEL→BOOK_NOW as an unfinished to-do. **Verify visually in an Ads Manager preview** that the button says "Book now"; if it says "Book travel," fix post-flight [U] |

### B. Creative (9:16 lead-gen video)

| Item | We do | Evidence | Verdict |
|---|---|---|---|
| Hook timing | "Attention contractors…" at 0.0s | transcript in contractor-ad-creative.md | ✅ Meta anchors on first-3-seconds [M]; practitioner window is 1–3s [P] |
| Captions | Burned-in, phrase-style, brand-corrected | `contractor-ad-captions.ass` | ✅ Muted-first design is correct (~80–85% watch muted — dated stat but direction solid [P/U]); burned-in beats auto-captions by consensus (no head-to-head study exists [U]) |
| Length | 28.95s | shipped asset | ✅ Within the defensible 15–30s lead-gen band [M/L]; nobody credible argues >60s for cold booking funnels |
| Format | Talking-head founder, native | shipped asset | ✅ Lo-fi/native beats polished on every attention dataset (VidMob [P]) — though all DTC-skewed; **our 2025 first-party 9x result is as good as any external evidence here** |
| quality_ranking | BELOW_AVERAGE_20 at 728 impr | API insights 7/21–8/03 | ✅ Correctly discounted: rankings are assigned from ~500 impressions [M] and volatile until well past that [P] — at 728 impressions the ranking is at the assignment floor and near-meaningless. Supports the $100-before-judging commitment |
| Judging metric | Leads only, never CTR/CPM/hold | CLAUDE.md commitment | ✅ Hott + Loomer both prescribe exactly this [P]; our 2025 winner lost every attention metric and converted 9x |
| Enhancements | 5 optional OFF; OPT_IN set = standard_enhancements, enhance_cta, inline_comment, reveal_details_over_time, show_destination_blurbs, video_filtering | `degrees_of_freedom_spec` on creative | ✅/[U] The OFF list matches practitioner consensus for talking-head video [P]. The OPT_IN residue matches the "Essential enhancements (5/5) can't be disabled" Ads Manager observation — **no external source documents this locked bundle** (likely staged UI rollout); multiple 2026 guides still claim everything is disableable. Our Ads Manager observation stands as primary source [U] |
| Comments | **4 comments on the live ad** (insights `comment:4`) | API insights | ⚠️ Unread — ads token can't fetch them (needs page token). Last ad's hostile comments fed its quality ranking. **Human should check/moderate** — hiding is safe, no delivery penalty |

### C. Landing page (cold paid-social)

| Item | We do | Evidence | Verdict |
|---|---|---|---|
| Form fields | 4 (first/last/email/phone) | `Scheduler.tsx:485-495` | ✅ Fewer/simpler fields is the only robust finding (HubSpot ~2010 [P-stale], Unbounce benchmark [P]); business fields deferred to confirm step |
| Phone microcopy | "We text your free design link + a call reminder. No spam calls, ever." | `Scheduler.tsx:492-494` | ✅ Matches Baymard's actual guidance (explain sensitive fields) [P]; note: no hard Baymard "phone abandonment %" exists publicly [U] |
| Form-first vs calendar-first | Form → calendar, data passed through | `Scheduler.tsx` flow | ✅ Chili Piper's exact recommended pattern (their enemy is *re-entering data*, which we avoid) [P]; vendor positions conflict (Calendly sells the opposite) but the neutral synthesis favors form-first for paid cold traffic needing attribution + follow-up |
| Message match | Hero mirrors ad promise; CTA scrolls to form | `LandingContractors.tsx:235,174` | ✅ Principle is core CRO doctrine [P]; the "2.5–3x" figure is untraceable [U]; no evidence message match moves Meta quality_ranking — its effect is on-page conversion [U] |
| CTA discipline | Single conversion goal; low-commitment copy ("See available times") | `Scheduler.tsx:501` | ✅ Unbounce 1:1 attention ratio (2018 data, directionally solid) [P] |
| Booking widget depth | Above Team strip, hero → examples → blueprint → booking | `LandingContractors.tsx:296-351` | ✅ NN/g: attention concentrated in first ~2 screenfuls [P]; further page edits correctly held until the 14-day read |
| Social proof w/ small counts | Outcome numbers (519.2K views, $20k contract), no fake review counts | `SocialMedia.tsx`, CLAUDE.md | ✅ BrightLocal 2025: consumers increasingly accept low review counts [P]; leading with specific outcomes over follower counts is sound craft |
| Page speed | FCP 728ms / 490KB (measured 7/20); TTFB 0.49s today; bundle current | curl + prior audit | ✅/[U] Healthy by every prior measure; current mobile **LCP vs the ≤2.5s bar [M]** couldn't be re-measured today (PSI API quota) — re-check when quota resets. Retired zombie stats: "53% abandon at 3s" (2016), "0.1s = +8.4%" (2020 retail) |

### D. UTM / attribution / CAPI

| Item | We do | Evidence | Verdict |
|---|---|---|---|
| url_tags template | Set on live ad: source/medium/campaign/content names + campaign/adset/ad **ids** | API `url_tags` on creative 1178436358691539 | ✅ IDs-over-names is the practitioner consensus (names snapshot at publish — we observed this ourselves) [P]; every param parses into `ATTRIBUTION_KEYS` |
| fbc construction | `fb.1.<Date.now()>.<fbclid>` when cookie missing; 7-day first-touch persistence | `src/utils/attribution.ts:113,125,140` | ✅ Byte-for-byte Meta's official spec (version fb, subdomainIndex 1 server-side, ms timestamp, never modify fbclid) [M]; sessionStorage persistence = recommended SPA practice [P] |
| Phone hashing | Digits + country code | CLAUDE.md 2026-07-21 fix | ✅ Meta official spec verbatim [M] |
| user_data breadth | All 13 available fields incl. ip/ua/external_id | `_shared/meta.ts` | ✅ Meta: ip+ua "may help matching and delivery" [M]; EMQ labels: 8+ great [M]; gains above ~6–7 marginal [P] |
| Geo backfill abstention | ct/st/zp wired but empty; never IP-inferred | CLAUDE.md | ✅/[U] Meta is silent on inferred geo; no official ruling either way — abstaining is the safe default, stance unrefuted |
| Dedup | Shared event_id browser+server, same event_name | `Scheduler.tsx` + `_shared/meta.ts` | ✅ Exact-match event_name+event_id is the rule [P]; post-meeting ids (`cr_<appt>`, `purchase_<appt>`) prevent double-count |
| action_source | website for Lead/Schedule; system_generated for CR/Purchase | `_shared/meta.ts:95` | ✅ Matches Meta's offline-events-via-CAPI guidance [M]; Test-Events tool being blind to system_generated matches practitioner reports [P] — verify in Activity, as CLAUDE.md already says |
| IG `PA…` click-ID theory | Documented as probable cause of Sean's unattributed lead | CLAUDE.md | [U] **No external documentation exists** — Meta or practitioner — of PA-prefixed IG click IDs or their attribution behavior. Stays an anecdote; "do not re-fire events" remains correct |
| Reporting windows | `meta-ads:status` hardcodes 7d | `scripts/meta-ads-status.mjs`; known trap | ⚠️ Already documented; note deprecated attribution windows return **empty data silently, not errors** [L/U] — never read empty as zero |

### E. Booking / show-rate mechanics

| Item | We do | Evidence | Verdict |
|---|---|---|---|
| Reminder cadence | Confirm SMS+email → 24h SMS+email → 2h SMS | GHL Workflow A (verified delivering 7/17) | ✅ Mirrors the literature: multi-touch multi-channel, 24h "most critical", 2–4h day-of window [P + peer-reviewed]; the 1h→2h move matches the cited ideal window |
| Reply-to-confirm | "Reply YES to confirm your spot" | Workflow A, 2026-07-21 | ✅ Strongest-evidenced tactic in the whole area: two-way messaging beats one-way in peer-reviewed meta-analysis; commitment-device RCTs cut no-shows 18–31.7% [primary] |
| Max advance 2 days | `maxAdvanceMinutes 2880` | `availability.ts:47` | ⚠️ Directionally right (show rate peaks day 1 at ~81%, holds ~75% through day 4, cliff at day 5+ [P]) but **no source supports a cliff at exactly 2 days** — widening to 3 days (`4_320`, the documented fallback) costs little show rate if volume drops. Watch volume, as CLAUDE.md already says |
| Min notice 4h | `leadMinutes 240` | `availability.ts:46` | ✅ Kept correctly: research found **zero external evidence** that short-notice bookings no-show more — same-day slots are the *best*-attended in every dataset (healthcare ~2%; sales 6.9% same-day vs 9.6% next-day) [primary+P]. The n=2 "booked at 4h minimum" hypothesis stays unsupported; the 7/20 decision to hold at 4h was right |
| Qualification placement | Post-booking, on done screen, optional | `Scheduler.tsx` qualify flow | ✅ Commitment-device literature supports answered questions [primary]; no evidence pre-booking qualification lifts show rate enough to offset lost bookings [U] — post-booking placement is the defensible choice |
| Concrete stake | "we're building your free homepage preview for this call" | confirm/done screens | ✅ Consistent with the meeting-quality thesis (reminders confirm, they don't create the reason to attend [P]); the specific tactic is unquantified [U] |
| Benchmark context | 0/2 shows | admin data | ✅ Correctly treated as noise: at even a pessimistic 40% true show rate, P(0 of 2) = 0.36. Realistic target with good ops: ~40–70% [P/U] |

### F. Advantage+ deep-dive (requested emphasis)

Covered above where it intersects settings; standalone findings:

- **"Advantage+ leads campaign" is not a type** — it's a Leads campaign with three levers on
  (campaign budget + supported bid, Advantage+ audience, no ad-set placement restrictions); breaking
  one flips `advantage_state` to DISABLED but the campaign runs normally [P/trade-press, High].
- **Suggestions barely steer.** The only hard controls under Advantage+ audience: age *minimum*
  (≤25), location, language, custom-audience exclusions. Everything else is a hint Meta overrides —
  most aggressively on shallow events like Lead [P, Loomer's own tests]. Our 25–55 suggestion is
  free but weak; **value rules** are the Loomer-verified way to actually push spend off 65+ without
  leaving Advantage+ (his result: 45% → <2% of spend on 65+) [P].
- **Enhancements:** Meta claims ~4% average improvement [M-marketing]; independent verification is
  absent and per-delivery conditionality makes it nearly untestable [U]. Practitioner consensus for
  talking-head video is to disable text/music/crop/overlay ones — which we did. The locked
  "Essential" bundle we observed (incl. Relevant comments + Enhance CTA) is documented nowhere
  externally [U] — since Relevant Comments surfaces a comment we can't choose, the 4 unread comments
  on the live ad matter more (see §B).
- **Campaign Score** measures adoption of Meta's recommendations, not performance — ignore it [P].
- **Opt-out在 2026:** manual-style campaigns still possible (each lever off → DISABLED, still runs);
  legacy ASC/AAC creation is API-blocked from v24/v25; `advantage_audience` defaults to 1 on new ad
  sets (explicit 0 honored); on Leads objectives Advantage Detailed Targeting can't be escaped even
  on "original audiences" [P/trade-press].

---

## 2. ❌ items

**None.** No checklist item deviates from a well-sourced best practice without a documented,
evidence-backed reason. The three items closest to the line, for honesty:

1. **CTA enum `BOOK_TRAVEL`** — likely renders "Book now" (the enum's known display label) and
   CLAUDE.md records the button as "Book now", but the 7/20 audit's rename to-do was never executed
   and I could not verify the rendered label read-only. *Action: 30-second visual check in Ads
   Manager preview. If it says "Book travel": fix after the flight.*
2. **`advantage_state: DISABLED`** vs CLAUDE.md's "Advantage+ leads campaign = On" — a stale doc
   claim, not a config error; the probable cause (account AN block) is an owner decision our own
   data supports. No documented delivery penalty. *Action: none beyond a CLAUDE.md wording fix
   (not made — read-only audit).*
3. **4 unmoderated comments on the live ad** — unreadable with the ads token; the previous ad's
   hostile comments fed its quality collapse, and Relevant Comments (undisableable) can surface one
   under the ad. *Action: human checks the ad post from the owner account; hide trolls (safe, no
   delivery penalty).*

## 3. Top 3 changes after the $100 flight completes

Ranked by expected impact ÷ effort. None touch the locked decisions; none should happen mid-flight.

1. **Value rules on age buckets** (Ads Manager, ~10 min). Bid −90% on 65+ (and optionally −20% on
   55–64). The age *suggestion* demonstrably doesn't move spend (Loomer measured >78% delivered
   outside a suggested range in our exact scenario); value rules are his verified fix that keeps
   Advantage+ fully on, and our first flight sent 18% of spend to the 65 bucket for 0 leads.
   Caveat: availability varies by objective/account — check whether Leads campaigns on this account
   expose value rules; if absent, accept the suggestion as-is.
2. **Social-norm line in the reminder SMS** (GHL UI, ~5 min, zero risk). The JRSM RCT's combined
   commitment + social-norm framing cut no-shows 31.7% — we have the commitment half (Reply YES)
   but no social-norm line ("most contractors who book this call show up" style). Highest-evidence
   show-rate lever we haven't used, on the metric (0% show) that multiplies everything else.
3. **Append `&placement={{placement}}&site_source={{site_source_name}}` to url_tags** (Ads Manager
   Tracking field, ~5 min — **re-triggers review, so post-flight only**). Gives per-placement and
   FB-vs-IG splits in our own contacts DB — exactly the first-party visibility that would have
   settled the Sean/Instagram attribution question, and the AN-style placement-quality questions,
   without waiting on Meta breakdowns. Learning-reset risk: probably none (URL params aren't a
   "significant edit" per the better source), but conflicting reports exist [U] — do it alongside
   the next natural edit.

Honorable mentions: re-measure mobile LCP when the PSI quota resets (last real measure 7/20 was
healthy); widen booking window to 3 days *only if* volume sags (evidence says day 3–4 shows fine).

## 4. Claims that could NOT be verified with a trustworthy source

- The **"Essential enhancements" locked bundle** (incl. Relevant comments / Enhance CTA being
  undisableable) — zero external documentation; our Ads Manager observation is the only source.
- **Instagram `PA…`-prefixed click IDs** and any attribution gap vs Facebook click IDs — nothing
  published anywhere; remains an internal anecdote.
- Whether **account-level Placement Controls flip `advantage_placement_state` to DISABLED** — our
  API reading suggests yes; no source documents the interaction.
- Whether **inferred/IP-backfilled geo hurts EMQ** — Meta is silent; abstention is unrefuted but unproven.
- **Quality-ranking → CPM elasticity** (e.g. "Below→Average = up to 50% CPM cut") — mechanism is
  Meta-official (auction total value), magnitude is unpublished; treat all such percentages as directional.
- **Hook-rate benchmarks** (20–30% etc.), exact **video-length optima**, and the **85% muted** figure —
  listicle-tier or a decade old; direction fine, numbers soft.
- **"Message match = 2.5–3x"**, **"11→4 fields = 160%"**, **"53% abandon at 3s"**, **"sticky CTA
  +31%"**, Chili Piper's "30% industry average" comparator — zombie/untraceable statistics; retired.
- Whether **URL-parameter edits reset learning** — sources conflict; better source says no.
- Any controlled test of **fully-broad Advantage+ lead gen at exactly $20/day** — doesn't exist;
  the mechanism (signal starvation) is solid, the dollar floors ($25–50/day) are soft.
- The **2026 attribution-overhaul specifics** (Jan 12 date, 5s video-view threshold) — Loomer-tier
  for existence of engage-through; exact dates/thresholds uncorroborated.

---

*Method: live values via read-only Graph API GETs (campaign 120241554190170259, ad set
120242709687340259, ad 120247255043930259 + creative 1178436358691539, insights time_range
2026-07-21→2026-08-03); code evidence from the files cited inline; six research passes with
per-claim source grading. No writes to Ads Manager, DB, GHL, secrets, or deploys.*
