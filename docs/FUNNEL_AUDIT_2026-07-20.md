# Contractor Funnel Audit — 2026-07-20

$659.90 spent. 2 leads. 2 bookings. 0 shows. 0 sales.

The booking system and the tracking are both working correctly. The money is being lost in the
ad creative, the placements, and the show rate.

---

## What I verified as healthy (so we stop suspecting it)

| Component | Status | Evidence |
|---|---|---|
| Booking backend | Healthy | Test booking ran end-to-end and returned ok; 130 open slots across 7 days |
| Availability hours | Healthy | Live DB rows = weekdays 7am–8pm + Sat 8am–12pm. The migration seed (Mon–Fri 9–5) was superseded — don't diagnose from `0001_core.sql` |
| Contractor CAPI | Healthy | Both real leads produced Lead + Schedule with `events_received:1` and zero warnings |
| Pixel / dedup | Healthy | Shared `event_id`, correct dataset routing, test mode isolates cleanly |
| Page speed | Healthy | FCP 728ms, 490KB, 30 requests — not a bounce cause |
| Gate form → booking | Excellent | 2 of 2 leads booked. The scheduler is not the problem |

The two `error` rows in `capi_events` are the known main-pixel issue on an organic lead, not contractor.

A test booking was run with `test:true`, verified isolated (no GCal, no GHL, no site-gen, both CAPI
events accepted), then deleted along with its contact and capi rows. No production data affected.

---

## The real funnel

| Stage | Count | Rate |
|---|---|---|
| Impressions | 12,182 | |
| Link clicks | 610 | 5.0% |
| Landing page views | 494 | |
| — Audience Network junk | 203 | 41% of all LPV |
| Quality landing page views | 291 | |
| Leads | 2 | 0.69% |
| Bookings | 2 | 100% of leads |
| Showed | 0 | 0% |
| Sales | 0 | |

Cost per lead $329.95. Cost per show: infinite.

---

## Finding 1 — the creative is the root cause

Frames extracted from the live ad video (22.3s, "funny hook"):

The ad is a young man in a grey hoodie on a couch in a cinder-block room, **holding two
chihuahuas**, with word-by-word TikTok captions ("MOST / WEBSITES / BUILT / 2009 / MODERN /
BUSINESS / FOR / CUSTOMERS").

In the first six seconds there is **nothing that identifies the audience as contractors** — no
roofs, no trucks, no job sites, no website examples, no on-screen "Contractors:". The offer is
never stated plainly.

This single fact explains the rest of the data:

- **`quality_ranking: BELOW_AVERAGE_35`** — it reads as personal content, not a business ad.
- **$54.17 CPM**, roughly 3–4x the ~$13.50 2025 median and well above the $20–35 that would be
  defensible for US home-services lead gen. Below-average quality carries a real CPM penalty;
  practitioner analyses put the Below Average → Average move at up to ~50% CPM reduction.
- **Delivery skew** — 30% of spend went to 25-34 males and 65+ females clicked at ~10%. Advantage+
  sees a young man talking to camera with dogs and delivers it to entertainment consumers, because
  that is who engages with it. It is not finding contractors.
- **30% hold to ~5.6s** (8,207 plays → 2,461 at 25%), against a 40–50% benchmark for the 3–15s
  window. A contractor has no reason to stay.
- **Sean's no-show note: "thought i was wix repair."** He booked a call without understanding the
  offer. That is a creative failure, not a sales failure.

To a 45-year-old roofing contractor, this ad does not look like a company that can build his website.

## Finding 2 — 41% of traffic is Audience Network junk

| Placement | Spend | LPV | $/LPV |
|---|---|---|---|
| instagram_reels | $236.02 | 171 | $1.38 |
| facebook_reels | $142.50 | 22 | $6.48 |
| facebook_feed | $125.89 | 45 | $2.80 |
| instagram_feed | $55.24 | 36 | $1.53 |
| AN rewarded_video | $32.07 | 160 | $0.20 |
| AN an_classic | $12.21 | 43 | $0.28 |

Audience Network rewarded video bought **236 link clicks for $32** — people tapping to dismiss a
reward-gated ad inside a mobile game. 203 of 494 landing page views came from Audience Network and
produced zero leads. Beyond the wasted spend, those 203 views pollute the model of "who clicks."

Facebook Reels is separately a money pit at $6.48/LPV — 4.7x worse than Instagram Reels.

## Finding 3 — the algorithm never learned, and can't at this budget

Meta needs ~50 optimization events per week per ad set to exit the learning phase. We have 2 leads
*lifetime*. At any realistic CPL the required budget is $200+/day, so $20/day optimizing on Lead is
structurally stuck in Learning Limited forever.

This does **not** mean switching the conversion event. Optimizing shallower (ViewContent/traffic)
buys cheaper and worse people — exactly the Audience Network problem, on purpose. The existing owner
decision to stay on Lead is correct. The lever is creative and placement quality, not the event.

## Finding 4 — 0% show rate, both bookings on the 4-hour minimum

| Lead | Booked | Meeting | Hours ahead | Outcome |
|---|---|---|---|---|
| Eric | 07-09 13:26 | 07-09 17:30 | 4.1 | no_show |
| Sean | 07-10 14:25 | 07-10 18:30 | 4.1 | no_show |

Both took the very first slot offered — the 4-hour minimum-notice boundary — because the scheduler
auto-selects the earliest open day.

Reminders are not the cause: GHL Workflow A was verified delivering SMS to both no-shows on 07-17.

**Hypothesis (n=2, unproven):** 4 hours is too short for a working contractor. He taps "4pm today"
while scrolling at noon, then is on a job at 4pm. Note this runs *against* the general benchmark
curve, which shows show rate peaking at next-day (~81%) and declining with distance — so shorter is
usually better. The specific claim is that below ~24h the curve inverts for field-work audiences.
Worth testing, not worth asserting.

Realistic target for cold paid-social bookings with good ops is 50–70%.

## Finding 5 — every conversion fix is one git push from being erased

The live site runs the slimmed 4-field gate form (verified in-browser). The committed HEAD still
renders `Business name *` in the gate step (`git show HEAD:src/components/scheduler/Scheduler.tsx`,
line 367).

All the 2026-07-17 conversion work is uncommitted — Scheduler, LandingContractors, BookingSection,
attribution persistence, availability, generate-site, result. Two local commits are also unpushed.

Netlify is git-linked to github.com/rhyanalmeida/acewebdesigners and the live build was pushed
manually via CLI. **Any git-triggered deploy reverts the landing page to the 6-field gate form that
converted at 0.2%** and silently drops the attribution fix.

## Finding 6 — the form is 12.6 screens down

The booking form sits at 10,656px on an 844px mobile viewport, on a 14,104px page, as the 9th block.
97% of traffic is mobile. A sticky "See available times" CTA is present and working, which mitigates
this but does not eliminate it.

---

## Plan, in priority order

### 1. Commit the live code (today, 5 minutes)
Non-negotiable and blocks everything else. The working tree is the source of truth for what's live.

### 2. Block Audience Network (today, 5 minutes, Ads Manager UI)
Advertising Settings → **Placement Controls** → block Audience Network account-wide. Use the
account-level control, not the ad-set checkbox: ad-set exclusions now carry an auto-enabled "allow
limited spending to excluded placements" option that leaks up to 5% of budget *per excluded
placement*. Account-level has no such leak.

Expected effect: reclaims ~7% of spend and, more importantly, stops feeding 203 junk views into the
optimization model. Consider also excluding Facebook Reels ($6.48/LPV).

### 3. New creative (this week — the highest-value work)
This is the CPM lever and the lead-quality lever at once. Shoot 3–5 hook variants against the same
body. Requirements:
- **Second 1 names the audience on screen**: "Contractors —" / "Roofers —".
- **Second 1 shows the payoff**: the actual free homepage preview on a phone screen.
- **Job-site context**, not a couch. No dogs.
- State the offer plainly: *we build your homepage before the call, free, you pay only if you love it.*
- Keep it phone-shot and native — the problem is not production value, it's that nothing signals
  "this is for you, and here's what you get."

Target: quality ranking Below Average → Average, which should pull CPM from $54 toward $25–30 and
roughly double the impressions $20/day buys.

### 4. Review the 15 ad comments (this week, manual)
The read-only ads token can't fetch them (needs a page token) — check in Ads Manager on post
`674428835752335_122187160304878825`. Hide spam and trolls; hiding comments yourself is safe and has
no delivery penalty. Reply to genuine objections. Ad *hides* and reports are what damage quality
ranking, and a pile of unanswered negative comments drives them.

### 5. Show-rate mechanics (this week, GHL UI)
- Add a **"reply YES to confirm"** SMS to Workflow A. Converts a tentative tap into a commitment.
- Ensure a **~2h-prior** touch exists (a 2h SMS alone is worth roughly +8pts).
- **Test raising minimum notice from 4h to ~24h** (`leadMinutes` 240 → 1440 in
  `_shared/availability.ts`). This is the Finding-4 hypothesis; treat it as an experiment and watch
  whether booking volume drops more than show rate rises.
- Do **not** add a deposit or card hold. At this funnel temperature it would crater an already
  0.69% booking rate.

### 6. Landing page (next, lower priority than creative)
Move `BookingSection` above `ComparisonTable` and `WebsiteSocialCombo`. Do not over-invest here —
the 2-of-2 booking rate says that once someone reaches the form, it works. The problem is who is
arriving, not what greets them.

### 7. Small tracking fixes
- Fire the browser pixel Lead/Schedule even when the server call fails (`Scheduler.tsx` currently
  tracks only in the success branch — a transient 5xx loses the conversion entirely).
- Change the ad CTA button type from `BOOK_TRAVEL` to `BOOK_NOW`.
- `withDefaultAdIds` stamps ad IDs on any `?source=landing-contractors` visit lacking UTM, inflating
  ad-attributed leads in our own DB. Meta's attribution is unaffected.
- `docs/META_ADS.md` describes a removed architecture — delete or rewrite it.

---

## What I would not do

- **Don't switch the conversion event off Lead.** Shallower events buy cheaper, worse people.
- **Don't raise budget yet.** More spend behind a Below-Average creative buys more junk. Fix the
  creative, then reopen the budget conversation if CPL lands in the $30–45 home-services norm.
- **Don't rebuild the scheduler.** It converts at 100%.
