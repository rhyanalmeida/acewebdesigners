# Master Plan — contractor funnel turnaround (2026-07-20)

Single prioritized plan from ad impression to closed sale. Supersedes the action lists in
`FUNNEL_AUDIT_2026-07-20.md`. Settings/copy detail lives in `AD_SET_PLAN_2026-07-20.md`;
creative detail in `contractor-ad-creative.md`.

---

## The one number that decides everything

**Show rate is 0%.** Two bookings, two no-shows.

At a 0% show rate, *no* budget and *no* creative makes money. Every improvement upstream — better ads,
cheaper clicks, more leads — multiplies by zero. This reorders the entire plan: **show-rate mechanics
must ship before any budget increase**, not after.

Where it stands today:

| Stage | Count | Rate | Healthy? |
|---|---|---|---|
| Impressions | 12,182 | | ⚠️ $54 CPM, 3–4x median |
| Link clicks | 610 | 5.0% | ✅ |
| Landing page views | 494 | | ⚠️ 41% was Audience Network junk (now blocked) |
| Leads | 2 | **0.69%** | ❌ 2025 comparable was 6.3% |
| Bookings | 2 | 100% of leads | ✅ scheduler works, don't touch it |
| **Showed** | **0** | **0%** | ❌❌ **the killer** |
| Sales | 0 | | ❌ |

$659.90 spent · $329.95 per lead · cost per show: infinite.

**What's verified healthy, so stop suspecting it:** booking backend, availability, CAPI/pixel/dedup,
page speed, gate form. And the dataset — see `AD_SET_PLAN_2026-07-20.md` §1: 8 CAPI events lifetime,
only 2 of them tests. It is not polluted, it is nearly empty. **Do not create a new dataset.**

---

## Priority 1 — Ship show-rate mechanics (GHL UI, this week)

Highest-value work in the plan, and it costs nothing. Prerequisite to spending another dollar.

Research is consistent across sources: **show rate is a function of prospect quality, an explicit
confirmation step, and pre-meeting engagement.** A reminder that only pushes information out does half
the job; one the prospect can *reply to* does all of it.

| Change | Where | Evidence |
|---|---|---|
| **Add "Reply YES to confirm"** to Workflow A | GHL | Requiring an explicit reply converts a tentative tap into a commitment. Click-to-confirm plus one ask commonly lifts show rate 10–20 points; two-message reminder sequences are reported to move show rates ~60% → ~85%. |
| **Add a ~2h-prior SMS** | GHL | Standard in every reminder sequence found (24h + 1–2h). Both our no-shows booked on the 4h minimum, so a 2h touch lands inside the actual risk window. |
| **Add 2–3 qualifying questions to the scheduler** | `src/components/scheduler` | *"Poor initial qualification represents the biggest driver of no-shows."* Ask: trade, years in business, has a website now. Also the correct remedy for "free" attracting tire-kickers (see §Copy in the ad plan). |
| Keep 24h reminder (skips sub-24h bookings) | GHL | Already live and verified delivering. |

**Do NOT add a deposit or card hold.** At a 0.69% booking rate that would crater already-thin volume.

**Target:** 50–70% (realistic for cold paid-social bookings; B2B benchmark is 65–80%, average B2B
no-show ~30%). Halving no-shows roughly doubles ROI without another dollar of spend.

**Owner decision, unresolved:** raise minimum booking notice 4h → 24h (`leadMinutes` 240 → 1440 in
`_shared/availability.ts`). Both no-shows took the earliest 4h slot. But this runs *against* the
general benchmark curve (show rate normally peaks next-day and declines with distance), and at 2
bookings there is no way to measure it. Treat as a deliberate experiment, not a silent fix.

---

## Priority 2 — Launch the new creative (this week)

The creative is done and captioned: `IMG_1174_captioned.mp4`. This is the CPM lever and the
lead-quality lever simultaneously — moving quality ranking Below Average → Average should pull CPM
from $54 toward $25–30, roughly doubling the impressions $20/day buys before any conversion gain.

Full settings, copy and click-path: **`AD_SET_PLAN_2026-07-20.md` §3–§5.** The five that matter most:

1. **New ad inside the existing ad set** `120242709687340259`. Do **not** duplicate, do **not** create a
   new ad set — duplication inherits zero learning and splits an already-starved signal.
2. **Budget at campaign level (CBO)** or the campaign silently loses Advantage+ status.
3. **Turn off 8 creative enhancements** — especially **Relevant Comments** (the old ad carries real
   hostile developer comments) and **Text Improvements** (rewrites the copy).
4. **Headline ≤25 chars** — `Free Site for Contractors`. The current one is 28 and truncates.
5. **Pause the old "funny hook" ad** on publish, or the new creative gets no delivery.

⚠️ The filmed creative still says *"book a free discovery call"* — it sells the meeting, not the
website. Ad copy compensates. The durable fix is the Script C v2 retake.

---

## Priority 3 — Moderate the ad comments (this week, manual)

11–15 comments sit on the ad; **every commenter is a web developer, not a contractor** ("no one wants
your AI slop", "clearly made with Claude", "With that haircut?"). Those carry 11 likes.

Agreement-with-criticism is exactly the negative signal `quality_ranking` measures, and it feeds the
$54 CPM. Hiding comments yourself is safe and carries no delivery penalty. Hide the trolls, answer
genuine objections.

Needs a human: reading them requires a page token the ads token doesn't have, and the UI route runs
through the owner's personal feed. Post: `674428835752335_122187160304878825`.

Also worth fixing while here: `@type: WebDesignCompany` in the site's JSON-LD **is not a real
schema.org type** — one of the developer criticisms was legitimate. Should be `ProfessionalService`
or `LocalBusiness`.

---

## Priority 4 — The budget decision (yours to make)

The honest math, three scenarios. Learning phase needs **~50 optimization events per ad set per
7 days**; required daily budget = `(CPL × 50) ÷ 7`.

| | **$20/day** (today) | **$50/day** | **$180/day** |
|---|---|---|---|
| Monthly | $600 | $1,500 | $5,400 |
| Leads/wk @ $25 CPL | ~5.6 | ~14 | ~50 |
| Leads/wk @ $40 CPL | ~3.5 | ~8.75 | ~31 |
| Exits learning? | **Never** | No (~28% of need) | **Only if CPL ≤ $25** |
| Time to a readable result | ~30 days | ~14 days | ~7 days |
| Risk | Slow, high variance, but cheap to be wrong | Moderate | **Can burn $5,400 proving the creative doesn't work** |

Independent sources put the practical floor at **$25–50/day**. At $20/day you are permanently
Learning Limited — Meta's optimizer is being asked to learn from ~4 data points a week.

**My recommendation — sequence it, don't guess:**

- **Now:** hold **$20/day** and launch the new creative. It costs $600/mo to learn whether CPL is
  sane. Raising spend behind unproven creative just buys more junk faster — the audit's standing
  warning.
- **Trigger to raise:** ≥3 leads at **<$60 CPL** *and* show rate >40% once P1 ships.
- **Then:** move **decisively to $150–180/day**, not in $4 creeps. At $20/day a "20% safe increase" is
  $4 — absurd micro-management when there's no stable learning state to protect. *(The 20% rule is
  practitioner folklore, not a Meta-published number.)*

**The trap to avoid:** raising budget while show rate is 0%. That converts a $600/mo loss into a
$5,400/mo loss. Fix P1 first.

---

## Priority 5 — Measurement: what to judge, and when

**Judge on leads and cost per booked-and-shown call. Never CTR, CPM, or hold rate.** The 2025 winner
lost on every attention metric and converted **9x** better. Expect the new creative's attention metrics
to look *worse* than the funny hook's.

| Metric | Target | Flag if |
|---|---|---|
| Cost per lead | < $45 | > $80 |
| Lead → booked | > 60% | < 40% |
| **Booked → showed** | **> 50%** | **< 30%** |
| Showed → sale | > 30% | < 15% |
| Cost per sale | < $400 | > $700 |

**Read windows:** nothing before **14 days**; monthly is the honest cadence at $20/day. At ~4 leads/week,
a 7-day read is noise. **Do not edit the ad set for 7 days** after launch — edits reset learning.

**Unit economics sanity check:** at $40 CPL, 50% show, 30% close → ~6.7 leads per sale → **~$267 per
sale** against a $999 upfront. The economics work — *if* show rate gets fixed. At 0% they never do.

---

## Priority 6 — What NOT to do

- ❌ **Don't create a new dataset/pixel.** Verified healthy. Pixel churn caused the original
  "spend / 0 leads" bug.
- ❌ **Don't rebuild the scheduler.** It converts booked-from-lead at 100%.
- ❌ **Don't switch niches.** The 2025 data isolates creative, age and optimization event — all
  changeable *inside* contractors. Moving to general traffic also returns you to no working CAPI.
- ❌ **Don't duplicate ad sets to scale.** Zero learning inherited, plus auction overlap.
- ❌ **Don't add detailed targeting.** Locked doctrine — and on a lead goal under Advantage+ it's only
  a suggestion Meta can ignore anyway.
- ❌ **Don't switch the conversion event off Lead** without an explicit owner call (see below).
- ❌ **Don't raise budget before show rate is fixed.**
- ❌ **Don't judge the new creative on CTR/CPM.**
- ❌ **Don't over-invest in the landing page.** Once someone reaches the form it works.

---

## Owner decisions still open

1. **Budget** — §Priority 4. Recommendation: hold $20/day, raise decisively on the stated trigger.
2. **Optimization event.** Research says the single highest-leverage lever at this budget is optimizing
   on an **upstream, higher-volume event** (~10x more signal; we could fire one from our own CAPI). The
   2025 winner used `COMPLETE_REGISTRATION`. **Counter-argument is real:** shallower events buy cheaper,
   worse people — exactly the Audience Network failure, deliberately. Standing decision is **Lead**.
   *(Note: Meta's "conversion leads" quality optimization is Instant-Forms-only + needs a CRM
   integration — unavailable to us on conversion-location=Website.)*
3. **Minimum booking notice 4h → 24h** — §Priority 1. Experiment, not a fix.
4. **Script C v2 retake** — sells the website instead of the discovery call.

---

## Sequence

```
Week 1   P1 show-rate mechanics (GHL)  +  P2 launch creative  +  P3 hide troll comments
Week 2   Hands off. No edits. Watch nothing but delivery health.
Week 3   First real read (14 days): CPL, booked→showed
Week 4+  Budget decision against the Priority-4 trigger
```

## Verification

- P1: book a test appointment, confirm the YES-reply and 2h SMS fire in GHL execution logs.
- P2: after publish, confirm the new ad is delivering and the old one is paused; check every placement
  preview for clipped captions.
- P3: re-check the ad post; hostile comments hidden.
- P5: pull `npm run meta-ads:status` + `/admin` at day 14, not before.
