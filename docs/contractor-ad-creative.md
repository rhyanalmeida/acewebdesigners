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
- Ad set ID: `120241554191670259`
- Ad account: `act_553999801104558` (Ace Web Designers)
- Pixel/dataset: `4230021860577001` (where CAPI Lead/CompleteRegistration/Purchase land at ~8.4 EMQ)
- All scripts to manage: `scripts/meta-ads-setup.mjs` (create/update/teardown), `scripts/meta-ads-status.mjs` (health check)
