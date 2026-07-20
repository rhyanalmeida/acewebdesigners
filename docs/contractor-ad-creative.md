# Contractor Lead-Gen Ad — Creative Spec & Copy

Single source of truth for the Meta ad. When uploading the video on your phone, copy-paste from this doc.

## Ad copy (paste into Meta Ads Manager)

### Primary text
```
Most contractors are losing $50k+ in jobs every year because their website looks like it's from 2005. We design a custom website for your contracting business — and you don't pay a dollar until you love it.

30-min call. Real designer (not a sales rep). For established US contractors only.

Book your free consultation below ↓
```

### Headline (≤27 chars to avoid feed truncation)
```
Free Website for Contractors
```

### Description
```
Real designer · No payment until you love it
```

### Call-to-action button
```
Book Now
```

### Destination URL (UTMs already baked in)
```
https://acewebdesigners.com/contractorlanding?utm_source=meta&utm_medium=cpc&utm_campaign=contractor_leadgen&utm_content=video_v1
```

### Display URL (what shows under the video)
```
acewebdesigners.com/contractorlanding
```

---

## Why this copy works

- **"Most contractors are losing $50k+"** — opens with pain framed in dollars. Construction owners think in revenue lost, not in "do I have a website?"
- **"You don't pay a dollar until you love it"** — kills the price objection up front without revealing the actual price. The risk reversal is the hook.
- **"30-min call. Real designer (not a sales rep)."** — disqualifies people who hate sales calls; signals quality.
- **"For established US contractors only"** — the soft filter. Side-hustlers, employees, and freebie hunters self-select out without us mentioning a price floor.
- No price mention anywhere. Selling price is a call topic, not an ad topic.

---

## Video creative spec

The video does as much filtering as the copy. A polished 9:16 with confident voiceover attracts established business owners; a phone-shot selfie attracts hobbyists.

### Format
- **Aspect ratio:** 9:16 (1080×1920) for Reels/Stories. If only 1:1 or 16:9 is available, upload it — but 9:16 typically gets 30-50% lower CPMs because Meta is pushing Reels.
- **Length:** 20-30 seconds. <15s feels like a teaser; >30s tanks completion rate.
- **File:** MP4, H.264, ≤4 GB, ≥1080p
- **Captions:** burned-in / open captions. 85% of Meta video plays muted. If they can't read the value prop with no audio, they scroll past.
- **Audio:** voiceover (clean, confident, not salesy) OR trending Reels audio. Avoid generic stock music.

### Structure (proven hook formula for contractors)

| Time | What's on screen | What's said / on text overlay |
|---|---|---|
| **0-3s** | Phone in someone's hand showing a beautiful contractor website | **HOOK:** "Free website for contractors" big bold text |
| **3-10s** | Quick montage of ugly old contractor sites; tradesman frowning at his phone | **PAIN:** "Tired of losing jobs to competitors with better websites?" |
| **10-20s** | Cuts of finished modern sites you've designed; happy contractor on phone receiving leads | **SOLUTION:** "We design a custom website — you only pay if you love it" |
| **20-30s** | "Book Now" button mockup with arrow, your face/logo, single CTA | **CTA:** "Book your free 30-min call. Limited spots." |

### What NOT to do
- ❌ Don't mention the $999 price or $30/mo hosting in the video
- ❌ Don't promise specific lead numbers ("get 50 leads/mo") — Meta's policy hates implausible claims
- ❌ Don't use "you" + "afford" / "can't" / "broke" together — Meta rejects as "personal attribute" violation
- ❌ Don't fake urgency with countdown timers in the video — feels scammy
- ✓ DO say "limited spots" once at the end — soft urgency that's true

---

## ⚠️ The shipped ad does not follow this spec (measured 2026-07-20)

The live ad "funny hook" (video `1003845082530934`, 22.3s) ignores the 0-3s row of the table above.
Frames pulled from the actual creative: a young man in a grey hoodie on a couch in a cinder-block
room, **holding two chihuahuas**, with one-word-per-frame captions ("MOST / WEBSITES / BUILT / 2009").

There is no phone, no website, no job site, no "Free website for contractors" text — nothing in the
first six seconds that tells a contractor this ad is for him or what he gets.

What that cost, from Ads Manager:

| Metric | Value | Read |
|---|---|---|
| `quality_ranking` | `BELOW_AVERAGE_35` | bottom 35% of competing ads |
| CPM | $54.17 | ~3-4x the 2025 median (~$13.50) |
| Hold to ~5.6s | 30% (2,461 of 8,207 plays) | benchmark for the 3-15s window is 40-50% |
| Spend to 25-34 males | 30% | Advantage+ read it as entertainment content, not a contractor ad |
| Leads | 2 lifetime | one of whom said *"thought i was wix repair"* |

A real comment on the ad, 2026-07-19: *"With that haircut? You build the sites with microsoft paint?"*
That is the audience telling us the creative is failing the credibility test — and comments like it
drive ad-hides, which is what `quality_ranking` actually measures.

**This is the single highest-value fix in the funnel.** Moving Below Average → Average should pull
CPM toward $25-30, which roughly doubles the impressions $20/day buys, before any conversion-rate
improvement.

## ✅ We already own a proven creative — use it (found 2026-07-20)

The 2025 campaign that produced ~65 leads and **several paying clients** was driven almost entirely
by ad **"video ad 5/29"** (`120223154842120259`) — $2,656 of the campaign's $2,762 and 971 of its
1,024 link clicks. ("Valerie AD" only ever got $105 and 53 clicks; it was not the performer.)

Its video is **"Free Preview Rhyan 1 - 526"**, 31.5s — the same video already embedded in the
landing-page hero (`LandingContractors.tsx:255`, Vimeo `1088261551`). We have it.

### Same presenter. Completely different presentation.

| | "Free Preview Rhyan 1" (worked) | "funny hook" (current) |
|---|---|---|
| Wardrobe | white collared shirt | grey hoodie |
| Setting | plain neutral wall | couch, cinder-block room |
| Framing | tight head-and-shoulders, direct to camera | wide, seated, laptop |
| Props | none | **two chihuahuas** |
| Captions | none burned in | one word per frame, TikTok style |
| Register | calm, professional, making an offer | comedic |

The problem was never the presenter — it was that one video reads as a business owner making an
offer and the other reads as a teenager making a TikTok.

### The counter-signal, stated honestly

The winning ad's *attention* metrics were *worse*:

| | winner (2025) | current |
|---|---|---|
| CTR | 4.97% | 6.84% |
| CPM | $82 | $54 |
| Hold to 25% | **19%** | **30%** |
| Click → lead | **~6.3%** | **0.69%** |

It held fewer viewers, cost more per impression, and got fewer clicks — and converted **9x better**.
That is the whole lesson: the funny hook buys more attention of the wrong kind. Do not judge the
replacement on CTR, hold rate, or CPM. Judge it on leads.

### Full transcripts (Whisper, 2026-07-20)

**WINNER — "Free Preview Rhyan 1", 31.6s**
```
[ 0.0]  Listen up business owners, your website is the first thing that customers see
        and if it's ugly or outdated, they're going to call someone else.
[ 9.0]  That's why I can build you a new website, one that's fast, gets you more
        business, more leads, more customers
[14.2]  and the best part, I can show it to you for free.
[19.3]  No obligation, only pay when you love it.
[22.4]  My name is Ryan and I've been building websites for years now and I'd love to
        get started on your dream.
[28.0]  Click the link down below and we'll talk soon, bye.
```

**CURRENT — "funny hook", 22.3s**
```
[ 0.0]  Most contractor websites look like they were built in 2009.
[ 3.3]  That's why we build you a fast, modern, mobile-friendly website.
[ 6.4]  Book a free website meeting right now and get a redesign for your business.
[10.5]  No strings attached. You only pay if you love it.
[13.4]  So contractors, what are you waiting for?
[15.4]  Let's work together and transform your digital presence.
[18.2]  Turn all those leads into paying customers.
[20.8]  We'll talk soon. Bye.
```

### Six differences in the script that explain the 9x

1. **Audience named in second 0 vs second 13.4.** The winner opens *"Listen up business owners"* —
   first two words. The current ad's only audience callout is *"So contractors"* at **13.4s**, by
   which point ~70-80% have already scrolled. Effectively nobody hears it.
2. **The offer is a website vs a meeting.** Winner: *"I can show it to you for free."* Current:
   *"Book a free website meeting."* Nobody wants a meeting; everybody wants to see their website.
   This is very likely what produced Sean's *"thought i was wix repair"* — the current ad never makes
   clear that a finished design is the deliverable.
3. **Consequence vs observation.** Winner: *"if it's ugly or outdated, they're going to call someone
   else"* — a customer phoning a competitor. Current: *"look like they were built in 2009"* — an
   aesthetic remark with no stated cost.
4. **A named human with a track record.** Winner: *"My name is Ryan and I've been building websites
   for years now."* The current ad **never gives a name or a credential** — it's all "we". Paired
   with the hoodie and the chihuahuas, nothing anchors credibility. That is the gap the
   *"microsoft paint"* comment walked straight into.
5. **Outcomes vs features.** Winner: *"more business, more leads, more customers."* Current: *"fast,
   modern, mobile-friendly"* — then *"transform your digital presence,"* which is consultant jargon
   a roofer would never use.
6. **"I" vs "we".** The winner is one person making a personal promise. The current is a vague
   corporate "we" that could be anyone.

### Copy that ran with it

Headline: `Get a Website Preview—Only Pay If You Love It`
Description: `Zero risk. We design your website first. You decide if it's worth it.`
Body:
```
🚨 Free Website Preview! No upfront cost.
We'll build you a custom website first—only pay if you love it.
Perfect for local businesses ready to upgrade their online presence.
✅ No risk, no pressure.
🎥 Watch the video to learn more.
```

Note how different this is from the current copy, which is loss-framed and exclusionary
("losing thousands of $$$", "Not for beginners", "established US contractors only", "Limited spots").
The winner is **gain-framed, inviting, and explicitly low-pressure**. "No risk, no pressure" plausibly
helps the show-rate problem too — it lowers the perceived stakes of the call.

### Captions — yes, but not the current style

Roughly 85% of Meta video is watched muted, so an uncaptioned ad loses its message entirely for most
viewers. Add them.

But **do not reuse the current ad's caption style.** One-word-per-frame kinetic captions
("MOST / WEBSITES / BUILT / 2009") are a TikTok-native convention, and they are part of why
Advantage+ reads this as entertainment content and delivers it to 25-34 males rather than contractors.
The winner ran with **no burned-in captions at all** and outconverted it 9x, so captions are clearly
not what was driving the result — the style is a targeting signal, not a comprehension aid.

| Do | Don't |
|---|---|
| 3-5 words per line, bottom third | one word per frame |
| plain sans, white on subtle dark scrim | colored per-word highlighting |
| static per phrase | bouncing / scaling / animated |
| plain punctuation | emoji in captions |

### Fixing the audience-callout problem without re-recording

The spoken words are fixed without a reshoot — but the **on-screen text is not**, and that is enough
to solve the biggest script problem.

The winner says *"Listen up business owners"*, which is general rather than contractor-specific. Add a
**static text overlay in seconds 0-2** reading `CONTRACTORS —` or `ATTENTION: CONTRACTORS`. The audio
stays welcoming and general while the on-screen text does the targeting. A slight mismatch between
spoken "business owners" and overlaid "contractors" is harmless — the text is what both the viewer
and the algorithm read first.

This gets the audience named in **second 0 instead of second 13.4** with no reshoot at all.

### Recommended action

1. Take the existing "Free Preview Rhyan 1" video (Vimeo `1088261551`, or the 9:16 asset already in
   the ad account as video `522183757526673`).
2. Add a static `CONTRACTORS —` overlay over seconds 0-2.
3. Add clean phrase captions in the style table above.
4. Use the winning copy structure, changing only `local businesses` → `contractors`. Keep the
   no-pressure, gain-framed shape.

Change nothing else at the same time, so the result stays readable.

If a reshoot happens later, these are the requirements:

### Requirements for a reshoot (test 3-5 hook variants, same body)

1. **Second 1 names the audience on screen** — "CONTRACTORS:" / "ROOFERS:" in large burned-in text.
   Advantage+ needs this as much as the viewer does; it's how delivery finds the right people.
2. **Second 1 shows the payoff** — the actual generated homepage preview scrolling on a phone. We
   build these automatically; use a real one.
3. **Shoot on a job site or in a truck**, not a couch. No pets.
4. **State the offer plainly by second 5** — "we build your homepage before the call, free, you only
   pay if you love it."
5. Keep it phone-shot and native. The problem is not production value — it's that nothing signals
   *this is for you, and here is what you get*.

Suggested hook lines to test:
- "Contractors — this is your website, and I built it before we ever spoke." *(phone showing preview)*
- "Your competitor's site books jobs at 11pm. Yours doesn't. Here's yours, free."
- "I built a free homepage for your contracting business. You either love it or you walk."

Keep the ad set on Lead and the budget at $20/day while testing — see
`docs/FUNNEL_AUDIT_2026-07-20.md` for why raising budget behind a Below-Average ad buys more junk.

---

## How to upload (after the video is ready)

1. **Phone or desktop:** open `https://adsmanager.facebook.com/adsmanager/manage/ads?act=553999801104558`
2. Confirm top-left says **"Ace Web Designers"** (not your personal account)
3. Find ad set **"Contractors — US — Advantage+ Audience — $20/day"**
4. **+ Create** → **Ad** → **Single Video**
5. Upload your MP4
6. Copy-paste from this doc into the matching fields:
   - Primary text
   - Headline
   - Description
   - Destination URL
   - Display URL
   - CTA button = Book Now
7. **Save** (it'll be paused — same as campaign + ad set)
8. **Settle the billing issue** on the ad account (status was UNSETTLED last we checked — Meta won't deliver until that's fixed)
9. Flip campaign + ad set + ad to **Active** → $20/day starts

---

## Post-launch playbook

### First 7 days — DO NOT change anything
Meta needs ~50 conversions to exit "learning phase". With $20/day and a $25-target CPL, that's roughly 7-14 days. **Editing the campaign during learning resets it.** Hands off.

### KPIs to watch
Run `npm run meta-ads:status` for spend + impressions + clicks. For full funnel, cross-reference GHL contacts:

| Metric | Target | Flag if |
|---|---|---|
| Cost per Lead | < $25 | > $40 |
| Lead → booked appointment (in GHL) | > 60% | < 40% |
| Booked → Showed | > 70% | < 50% |
| Showed → Purchase ($999 close) | > 30% | < 15% |
| Cost per Purchase | < $200 | > $500 |

### Kill criteria
- Spent **$100 with 0 Leads** → pause; the ad isn't resonating. Review copy/creative.
- 5+ Purchases but cost per Purchase **> $400** → not filtering well. Tighten targeting more (drop age range to 35-55, exclude more interests).

### Scale criteria
- Cost per Purchase **< $150 sustained for 7 days** → bump daily budget by **20%/week**. No more — bigger jumps re-trigger learning.
- If 2+ KPIs tank simultaneously after a budget change → you scaled too fast; roll back.

### When to A/B test
You're at $20/day. A/B testing needs 2x+ that to get signal in reasonable time. **Skip for now.**
Once you have a winning ad and want to scale to $100+/day, duplicate the ad set with a different creative or audience for an A/B.

---

## Notes for future-me

- Campaign ID: `120241554190170259`
- Ad set ID: `120242709687340259` (the "- Copy" ad set with the correct pixel `4230021860577001`).
  The original `120241554191670259` is the **deprecated broken duplicate** (dead pixel
  `1548487516424971`, paused) — delete it in Ads Manager.
- Ad account: `act_553999801104558` (Ace Web Designers)
- Pixel/dataset: `4230021860577001` (where CAPI Lead/CompleteRegistration/Purchase land at ~8.4 EMQ)
- All scripts to manage: `scripts/meta-ads-setup.mjs` (create/update/teardown), `scripts/meta-ads-status.mjs` (health check)
