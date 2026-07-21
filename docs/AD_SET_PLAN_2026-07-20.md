# Ad Plan — contractor creative (2026-07-20)

Three questions: is the dataset broken, what settings should run, what copy runs with it.
Creative is done: `IMG_1174_captioned.mp4` (see `contractor-ad-creative.md` → SHIPPED ASSET).

> **Source-quality warning.** Most top-ranking "2026 Meta specs" content is AI-generated SEO farms
> citing each other with untraceable statistics. Verified-primary sources here: `engineering.fb.com`,
> `ppc.land`, `searchengineland.com`, Meta Transparency Center, and a peer-reviewed paper. Nearly every
> performance percentage circulating (32% lower CPA, 19% lower CPQL, 4% from enhancements) traces to
> **Meta's own internal benchmarks**, not independent studies. Treat as directional. `[uncertain]` means
> verify in Ads Manager before acting.

---

## 1. Dataset verdict — **KEEP `4230021860577001`. Do not create a new one.**

The premise is backwards. The dataset is not polluted; it is nearly **empty**.

### Every CAPI event ever recorded — 8 rows, lifetime

| event_name | is_test | status | n | first | last |
|---|---|---|---|---|---|
| Lead | false | error | 2 | 2026-06-23 | 2026-06-23 |
| Lead | false | sent | 2 | 2026-07-09 | 2026-07-10 |
| Lead | **true** | sent | **1** | 2026-07-17 | 2026-07-17 |
| Schedule | false | sent | 2 | 2026-07-09 | 2026-07-10 |
| Schedule | **true** | sent | **1** | 2026-07-17 | 2026-07-17 |

**8 lifetime · 2 test · 6 live · 4 live successfully sent · 2 errors.** `appointments`: 3 (1 test, 2 live).
Source: Management API SQL on `capi_events` (columns: `event_id, event_name, action_source, contact_id,
appointment_id, value, status, meta_response, sent_at, is_test` — **no `created_at`**).

| Claim | Verdict |
|---|---|
| "So many tests on the CAPI" | **FALSE.** Exactly **2** test events exist, both 2026-07-17. The test booking was deleted afterward with its contact and capi rows (`FUNNEL_AUDIT_2026-07-20.md`). |
| "The tests messed up the dataset" | **FALSE.** Test events carry `test_event_code`, route to the Test Events channel, are flagged `is_test`, and are kept out of live reporting. Two events cannot move an optimization model. The audit independently verified *"Contractor CAPI — Healthy… zero warnings"*. |
| "That's why we're barely getting leads" | **FALSE as stated, TRUE inverted.** Only **4 successful live conversion events lifetime**. Learning needs ~50 per ad set per 7 days. The problem is **absence of signal, not bad signal.** |

**Cost of replacing, for zero upside:** discards the only 4 real events, the accumulated event match
quality, and all attribution history; restarts learning at zero; requires re-plumbing `META_DATASET_ID`,
re-verifying the token can write the new dataset, updating `src/config/pixels.ts`, redeploying functions
+ Netlify. Pixel churn is exactly how the original "spend / 0 leads" bug happened (dead pixel
`1548487516424971`).

**Real cause of low leads, already documented:** `quality_ranking BELOW_AVERAGE_35` → $54 CPM (3–4x
median), 41% of landing views were Audience Network junk (now blocked), click→lead 0.69%.

---

## 2. Where external research overrides our own 2025 precedent

An earlier draft justified several settings with "the 2025 campaign did this." Multi-source 2026 research
contradicts six of them. Corrections:

| First draft | External evidence | Now |
|---|---|---|
| ABO (ad-set budget) | **Campaign-level budget is a requirement for Advantage+ status** — ad-set budget flips `advantage_state_info` to `DISABLED`. Unified structure mandatory since API v25.0, Q1 2026. | **CBO** |
| Duplicate the ad set | **Duplication inherits zero learning.** New IDs at every level; delivery history, learning progress and quality rankings all start at zero. Adds auction overlap + splits signal. | **Never duplicate** |
| Build a new ad set | Quality ranking is per-**ad** (35-day window), so a new ad gets its own score without inheriting "funny hook"'s Below Average. Consolidating signal matters more at $20/day than isolation — and with Advantage+ Audience both ad sets would chase the same pool anyway, so the isolation is illusory. | **New ad in the existing ad set** |
| Age 25–55 | Under Advantage+ Audience, age is a **suggestion Meta overrides at will**, and the hard minimum-age control **caps at 25** — a 30+ floor is impossible without leaving Advantage+. Leakage is worst on **Lead** optimization specifically. Narrowing at low budget accelerates Learning Limited. | **Don't hard-narrow** |
| 7-day click + 1-day view | Sources genuinely conflict (1-day-click for lead gen vs. signal starvation at low budget). Attribution affects **delivery, not just reporting**, and changing it **resets learning**. | **7-day click, drop 1-day view** |
| Copy: *"Your website is the first thing a customer sees… they call the next guy"* | **Violates Meta's Personal Attributes policy** (implying knowledge of the viewer's business/financial situation) — cited as the most common rejection cause. | **Rewrite third-person** |

---

## 3. Settings

| Setting | Value | Why |
|---|---|---|
| Campaign type | Advantage+ config, all levers on | "Manual" no longer exists as a campaign type; campaigns now *qualify* for Advantage+ by configuration. At $20/day you cannot out-target the algorithm, and on a lead goal detailed targeting can't be restricted anyway. |
| Objective / location | Leads / **Website** | We own the scheduler and CAPI. **"Conversion leads" (lead-quality) optimization is Instant-Forms-only + needs a CRM integration — unavailable to us.** |
| Optimization event | **Lead** | Standing owner decision. See "Surfaced, not acted on" below — this is contested by the research. |
| Budget level | **CBO (campaign)** | Required for Advantage+ status. With one ad set, CBO and ABO allocate identically, so there is no cost to complying. |
| Daily budget | **$20/day** | Owner-set. `(CPL × 50) ÷ 7` → a $25 CPL needs **~$179/day**; $50 CPL needs **~$357/day**. Independent sources put the practical floor at **$25–50/day**. **At $20/day this is permanently Learning Limited.** Plan around it; evaluate on **14–30 day** windows, never 7. |
| Bid strategy | **Highest volume / lowest cost, no cap** | Standard at launch; a cost cap below achievable CPL suppresses delivery. **Never bid cap** — it also forfeits Advantage+ status. Move to cost cap only after ~50 total leads and stable CPL. |
| Attribution | **7-day click, no view** | Keeps the widest click signal (critical at our volume) while dropping the least trustworthy path for a form fill. Set once — changing it resets learning. `[uncertain]` 7-day/28-day view windows reportedly removed Jan 2026; verify in-account. |
| Targeting | US, broad, Advantage+ Audience on, **no detailed targeting** | Locked doctrine. Note research disagrees — see below. |
| Age | **Leave wide (suggestion only)** | Cannot be enforced under Advantage+ (min-age control caps at 25). Let the **creative** filter: it opens "Attention contractors." Revisit only if breakdowns show real under-30 waste. |
| Placements | Advantage+ placements ON | Manual restriction compounds Learning-Limited risk at this budget. |
| Audience Network | Keep the **account-level** block | **Verified:** the ad-set "Allow limited spend to excluded placements" toggle is **default-ON** for Sales and Leads and leaks **5% per excluded placement** (4 exclusions ≈ 20%). Account-level controls are not subject to it. |
| Facebook Reels | Do **not** exclude yet | Judging Reels on cost-per-landing-page-view is the **wrong metric** when optimizing for Lead — Reels reliably buys cheap shallow clicks. Judge on cost per Lead, and only with meaningful spend behind it. |
| Advantage+ creative — **OFF** | Text improvements · Site links · **Enhance CTA** · Music · Overlays + dynamic overlays · 3D animation · Catalog items · **Relevant comments** | Text improvements rewrites deliberately-written copy. Site links pull clicks off the scheduler and don't carry UTMs. Enhance CTA would destroy the CTA test below. Music fights a talking-head. Overlays collide with burned-in captions. **Relevant comments is a live risk — the old ad carries real hostile developer comments.** |
| Advantage+ creative — **ON, conditionally** | Visual touch-ups, brightness/contrast | Low risk **but verify every placement preview first** — crop/resize can **clip the burned-in captions**. If they clip, turn off. |
| Ads in the ad set | 3–5 **genuinely distinct** creatives, loaded together | Andromeda (Meta engineering blog, Dec 2024) is built to retrieve from a large, diverse creative pool. Distinct angles, not colour variants. `[uncertain]` the circulating "20–30 creatives" figures are agency blogs, and are written for accounts spending 10x ours. |
| Schedule | Standard delivery, no dayparting | Not enough data; it only thins an already-thin auction. |
| Learning phase | No edits for 7 days | Edits reset learning. `[uncertain]` the "20% budget change" rule is practitioner folklore, not a verified Meta number. |
| Kill | $100 spend, 0 leads → pause | Existing playbook. |
| Scale | CPL < $150 sustained → raise **decisively**, not in $4 creeps | At $20/day, 20% = $4. There's no stable learning state to protect, so creeping is pointless. |
| **Deciding metric** | **Leads / cost per booked call. Never CTR, CPM, or hold rate.** | The 2025 winner lost on every attention metric and converted 9x better. |

### Surfaced, not acted on (owner decisions)

1. **Budget.** Every independent source puts the functional floor at $25–50/day, and exiting learning at
   a $25 CPL needs ~$179/day. $20/day optimizing on Lead means ~4 events/week against 50 needed.
2. **Optimization event.** The research's highest-leverage lever at this budget is optimizing on an
   **upstream, higher-volume event** (we could fire one from our own CAPI), which would give the algorithm
   roughly 10x the signal. **Counter-argument is real and documented:** shallower events buy cheaper, worse
   people — exactly the Audience Network failure, on purpose. Standing decision is Lead. Don't change without the owner.
3. **Detailed targeting.** Research says niche-B2B at sub-$30/day is *the* documented exception where
   audience **suggestions** help. Countervailing: on a lead goal under Advantage+, detailed targeting is
   only ever a suggestion Meta can ignore. Locked doctrine says broad — not overridden here.

---

## 4. Copy

Rules applied: no second-person assertions about the viewer's business or finances (**Personal
Attributes** policy — the most common rejection cause); no guaranteed-results or income claims
(**Unacceptable Business Practices**); offer front-loaded into the first ~40 characters; no
"not just X, it's Y", no rule-of-three lists, no empty intensifiers; a real place name as a human signal.

### Headlines — **≤25 chars** (narrow devices collapse ~40 → ~25)
1. `Free Site for Contractors` (25) ✅ recommended
2. `See It Before You Pay` (21)
3. `Only Pay If You Love It` (23)

⚠️ The old headline `Free Website for Contractors` is **28 chars and truncates.**

### Descriptions (~30 visible)
1. `Real designer. No pressure.` ✅ · 2. `Built first. You decide.` · 3. `No risk, no pressure.`

### Primary text A — offer-first *(recommended)*
```
Free website build for US contractors. I build it first, you only pay if you love it.

Most homeowners look a contractor up online before they call. If the site looks dated, a lot of them
keep scrolling. So rather than pitch you on that, I'd rather just show you.

Pick a time and I'll have a real homepage built for your business before we talk. Look at it. If you
love it, we go from there. If you don't, you walk and it costs nothing.

I'm Rhyan. I own Ace Web Designers in Leominster, Massachusetts.
```

### Primary text B — show, don't pitch
```
I build websites for contractors, and I'd rather show you one than pitch you.

Pick a time and I'll build a real homepage for your business first, free. You look at it. If you love
it, great. If you don't, you walk away and it costs nothing.

That's the whole offer. No risk, no pressure.

Rhyan, Ace Web Designers
```

### CTA button — test, don't assume
Cold audiences respond to **low-commitment** CTAs; "Book Now" asks for commitment before they've
evaluated the offer. Test in order: **Learn More** (cold-audience default) → **Get Quote**
(contractor-native language) → **Book Now** (current). Skip "Sign Up" (reads as newsletter).
Judge on **cost per booked call**, never CTR — the one real CTA experiment found "Learn More" won CTR
while "Sign Up" won conversion rate, i.e. they pull opposite ways.

**Destination:** `https://acewebdesigners.com/contractorlanding?source=landing-contractors`

### Keep "free" — but qualify downstream
The zero-price effect is peer-reviewed (Shampanier, Mazar & Ariely, *Marketing Science* 26(6), 2007):
dropping 1¢→0¢ increases demand far beyond any equivalent price cut. The same mechanism suppresses
scrutiny, which is the tire-kicker problem. **Remedy is 2–3 qualifying questions in the scheduler**
(trade, years in business, has a site now), not removing "free" from the ad.

⚠️ The filmed creative says *"book a free discovery call"* — it sells the meeting. The copy above
compensates by selling the website. Durable fix is the Script C v2 retake.

---

## 5. Build sequence (Ads Manager UI)

`META_ADS_TOKEN` is **read-only** — none of this is possible by API.

1. Open Ads Manager for **act_553999801104558**; confirm top-left reads "Ace Web Designers".
2. Open campaign **"Free Website Offer For Contractors (6/1/26)"** (`120241554190170259`).
3. Confirm budget sits at **campaign level (CBO)**. If it's at the ad set, move it — otherwise the
   campaign loses Advantage+ status.
4. Open the **existing** ad set `120242709687340259`. **Do not duplicate it and do not create a new one.**
5. Verify: conversion location **Website**, pixel **4230021860577001**, optimization **Lead**,
   attribution **7-day click (no view)**, bid **highest volume, no cap**, US broad, Advantage+ Audience on,
   age left wide, Advantage+ placements on, no ad-set placement exclusions.
6. **+ Create Ad** inside that ad set → Single Video → upload `IMG_1174_captioned.mp4`.
7. Paste headline / description / primary text from §4. Set the CTA and destination URL.
8. Advantage+ creative enhancements: turn **OFF** Text improvements, Site links, Enhance CTA, Music,
   Overlays, Dynamic overlays, 3D animation, Catalog items, Relevant comments.
9. **Check every placement preview** (FB Feed, IG Feed, FB Reels, IG Reels) and confirm the burned-in
   captions are not clipped. If they are, also turn off Visual touch-ups.
10. Publish, then **pause the old "funny hook" ad** so the new creative actually gets delivery.
11. Change nothing for 7 days. First real read at **14 days**.

---

## 6. Sources

**Verified primary:** [Meta Engineering — Andromeda](https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/) ·
[ppc.land — unified Advantage API](https://ppc.land/meta-launches-unified-api-structure-for-advantage-campaigns/) ·
[ppc.land — legacy API deprecation](https://ppc.land/meta-deprecates-legacy-campaign-apis-for-advantage-structure/) ·
[ppc.land — 5% excluded-placement spend](https://ppc.land/meta-pushes-spending-5-on-excluded-placements-for-sales-and-leads-campaigns/) ·
[Search Engine Land — Advantage+ leads campaigns](https://searchengineland.com/meta-advantage-campaign-setup-leads-campaigns-451713) ·
[Meta — Personal Attributes policy](https://transparency.meta.com/policies/ad-standards/objectionable-content/privacy-violations-personal-attributes/) ·
[Meta — Unacceptable Business Practices](https://transparency.meta.com/policies/ad-standards/fraud-scams/unacceptable-business-practices/) ·
[Shampanier/Mazar/Ariely — Zero as a Special Price (PDF)](https://web.mit.edu/ariely/www/MIT/Papers/zero.pdf)

**Practitioner:** [Jon Loomer — age restriction](https://www.jonloomer.com/qvt/restrict-ad-targeting-by-age/) ·
[Loomer — duplicating ad sets](https://www.jonloomer.com/qvt/should-you-duplicate-ad-sets-when-scaling/) ·
[Loomer — ad set count](https://www.jonloomer.com/active-ad-sets-meta-ads-campaign/) ·
[Loomer — attribution impacts performance](https://www.jonloomer.com/qvt/how-attribution-impacts-performance/) ·
[Loomer — creative enhancements](https://www.jonloomer.com/advantage-plus-creative-enhancements/) ·
[Loomer — website vs instant forms](https://www.jonloomer.com/qvt/website-and-instant-forms-conversion-location/) ·
[AdEspresso — CTA experiment](https://adespresso.com/blog/best-cta-facebook-ads/) ·
[Digiday — AI backlash](https://digiday.com/marketing/with-ai-backlash-building-marketers-reconsider-their-approach/) ·
[Sprinklr — quality ranking](https://www.sprinklr.com/help/articles/reporting-analytics/facebook-ad-quality-ranking/63f36219e024591337249ff9) ·
[Pipeline On — contractor ad copy](https://pipelineon.com/blog/high-converting-facebook-ad-examples/)

**First-party:** `capi_events` / `appointments` via Management API SQL · `docs/FUNNEL_AUDIT_2026-07-20.md`
