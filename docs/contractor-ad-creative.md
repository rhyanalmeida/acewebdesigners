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

1. **Direct address vs description.** ~~The current ad doesn't name its audience until 13.4s.~~
   **Correction (2026-07-20): that was wrong.** "Most **contractor** websites" — the word is the
   second word of the ad, at 0.0s. Both ads name the audience immediately, and Meta's content
   understanding picks up "contractor" from second 0 either way, so there is no targeting-signal
   difference here.

   What survives is a smaller, purely rhetorical point: the winner uses **direct second-person
   address** — *"Listen up business owners"* is a summons aimed at the viewer. In the current ad
   "contractor" is an **adjective modifying "websites"** — it describes a category of object rather
   than speaking to the person watching. The viewer isn't addressed directly until *"So contractors,
   what are you waiting for?"* at 13.4s. That's a real direct-response distinction, but it is a much
   weaker claim than the one originally made here, and it should not carry much weight in the
   diagnosis.
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

### Making the winner contractor-specific without re-recording

This applies to the **winner** video, which genuinely is general — it says *"Listen up business
owners"* and never says "contractor" at all. (The current ad does not have this problem; see the
correction in difference 1.)

Add a **static text overlay in seconds 0-2** reading `CONTRACTORS —` or `ATTENTION: CONTRACTORS`. The
audio stays welcoming and general while the on-screen text does the targeting. A slight mismatch
between spoken "business owners" and overlaid "contractors" is harmless — the text is what both the
viewer and the algorithm read first.

No reshoot needed.

---

## The script to record (2026-07-20)

Design rule: **the 2025 script is the proven asset — change only what has a reason to change.**
Every edit below is traceable to something measured, not to taste.

### Script A — minimal change (record this one)

~95 words, ~30s at conversational pace (the winner was 95 words / 31.6s).

```
Listen up contractors — your website is the first thing a customer sees.
And if it's ugly or outdated, they're going to call the next guy.

That's why I'll build you a brand new website. One that's fast, and gets you
more calls, more jobs, more customers.

And the best part? I'll build it first, and show it to you for free.
No obligation. You only pay when you love it.

My name is Rhyan, I've been building websites for years, and I'd love to
build yours.

Tap below and we'll talk soon.
```

Every change from the proven original, and why:

| Original | New | Reason |
|---|---|---|
| "Listen up business owners" | "Listen up contractors" | targets the niche; keeps the proven direct-address opening |
| "they're going to call someone else" | "call the next guy" | contractor vernacular; same consequence framing |
| "more business, more leads, more customers" | "more calls, more jobs, more customers" | *jobs* is the outcome a contractor actually thinks in |
| "I can show it to you for free" | "I'll build it first, and show it to you for free" | fixes the single biggest gap — makes the deliverable a **website**, not a meeting |
| "get started on your dream" | "build yours" | drops vague filler |
| "Click the link down below" | "Tap below" | 97% of traffic is mobile |

Everything else is verbatim, including the structure: direct address → consequence → offer →
risk reversal → named human with track record → CTA.

### Script B — the variant worth testing against it

We now auto-generate a real preview site before every call, which we did not have in 2025. That is a
genuinely stronger offer than "I can show it to you for free," so it deserves a test — but it is
unproven, so it runs as the challenger, not the default.

```
Contractors — I already built you a website.

I'm serious. Book a time, and before we ever talk, my team builds a real
homepage for your business. Not a template. A real site, with your name on it.

You show up, you look at it, and if you love it we go from there.
If you don't, you walk. It costs you nothing either way.

I'm Rhyan — I've been building websites for years, and yours is already
waiting.

Tap below.
```

### ✅ SHIPPED ASSET — filmed + captioned (2026-07-20)

**Final video: `C:\Users\rhyan\Downloads\IMG_1174_captioned.mp4`** — approved, ready to upload.
1080×1920 · H.264 High · yuv420p · 30fps · AAC 192k stereo · 28.95s · faststart. Source take
`IMG_1174.MOV` (untouched).

**What Rhyan actually says** (differs from Script C v2 below — he improvised):
```
Attention contractors, your website is the first thing that people see.
And if it's ugly and outdated, they're going to call someone else.
Hi, my name is Ryan. I own Ace Web Designers, and I've been working with contractors for years now.
We build fast, clean, modern, mobile-friendly sites that work anywhere.
So what are you waiting for? Book down below to go on a free discovery call,
where we can show you a website design.
No strings attached, no obligation. You only pay if you love it. There's nothing to lose. We'll talk soon.
```
⚠️ **Known weakness, accepted for this run:** it sells the *discovery call*, not the *free website*,
and uses "we"+features rather than "I build them myself". That's the one thing Script C v2 fixes —
worth a retake later, but this take still beats the failing "funny hook" ad on every count.

**Captions** — source of truth: `docs/ad-assets/contractor-ad-captions.ass` (re-burnable any time).
Built from Whisper `medium.en` **word-level** timestamps, then hand-grouped into 22 phrases and
manually stamped. Style: Montserrat Bold 68px, white, semi-transparent dark bar (`&H33000000`,
BorderStyle 3), bottom-center, `MarginV 470` (above Instagram's ~420px bottom UI zone, clear of the
right-side buttons, never over his face), 3–5 words per line, static.
- Money-lines render **fully yellow** (`for a FREE discovery call`, `No strings attached`,
  `No obligation`, `You only pay if you love it`, `There's nothing to lose`).
  **Do NOT switch colour mid-line** — two runs = two overlapping semi-transparent boxes = a visible
  darker seam. One run per line keeps every bar uniform. This was the fix that made it ship.
- Caption text corrects the brand: **"Rhyan"** (he says "Ryan") and **"Ace Web Designers"**.

Re-burn command (font: Montserrat-Bold.ttf via `fontsdir`):
```
ffmpeg -y -i IMG_1174.MOV -vf "subtitles=contractor-ad-captions.ass:fontsdir=fonts" \
  -map 0:v:0 -map 0:1 -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -r 30 \
  -c:a aac -b:a 192k -ac 2 -movflags +faststart IMG_1174_captioned.mp4
```

**Ad set + copy to run it with: `docs/AD_SET_PLAN_2026-07-20.md`** (settings table, build sequence,
copy options). Note the old headline `Free Website for Contractors` is **28 chars and truncates** —
use `Free Site for Contractors` (25).

---

### Script C v2 — research-tuned, modular hook test (2026-07-20) — RECORD THIS

Supersedes the first Script C draft. A fresh **9:16 selfie of Rhyan's face**, proven "build & show
free" offer with a **warm, personal founder credential** ("I build them myself, not a big agency" —
the antidote to the "AI slop / they're all identical" roast). Validated against 2026 best practice,
triangulated across multiple independent sources, weighted below our own first-party data:

- **The hook is the #1 lever.** Meta's own research: **47% of a video ad's value lands in the first
  3 seconds**, 74% by 10s; 65% who watch 3s keep watching to 10s. Hook swaps move performance
  **40–60%** on identical content. So the pain/consequence must hit in **second 1** — not a self-intro
  first (the earlier draft delayed it to ~4–5s). Both the research and our own 2025 winner lead with
  the pain. *(adligator, coinis, benly, roaspig)*
- **Test 3–5 hooks against one body** — but Meta's current **Andromeda** algorithm rewards creative
  *diversity*, so 5 near-identical clones with one line swapped is penalised. The hooks below are
  **distinct angles** on purpose; let winners become distinct creatives. *(leadsbridge, tailorededge)*
- **Founder-led talking head + authenticity** is a named lead-gen winner for home services; **visible
  proof** (a real site on a phone) converts contractors better than pure talking head — hence the
  phone insert. *(performancemarketer, creeksidemarketingpros, pipelineon)*
- **Risk reversal** ("only pay if you love it") lifts conversion ~21% and is a recognised
  high-converting pattern. *(quicksprout, crazyegg)*

#### The BODY — film once (~22s)

Opens generically ("So here's what I'll do") so it splices cleanly after any hook.

```
So here's what I'll do. I'll build you a brand-new website — fast, clean,
made to get you more calls and more jobs.

And I build them myself. I'm Rhyan — not a big agency, not a call center.

[CUT — phone scrolling a real generated contractor homepage, 2–3s]

I'll build it first and show it to you for free. You only pay if you love it.
No pressure, no catch. Tap below and let's talk.
```

#### The HOOKS — film each as a separate ~3s take, lands the message in second 1

Record A + B + C at minimum (all face-led). D and E are stretch takes.

| # | Hook (spoken to camera, sec 0–3) | Why / basis |
|---|---|---|
| **A** *(safest — closest to the proven 2025 winner)* | "Your website is the first thing a customer sees — and if it looks outdated, they just call the next guy." | Pain + consequence in second 1; contractor vernacular. The exact shape that converted 9x in 2025. |
| **B** *(offer-forward challenger)* | "Contractors — I'll build your whole website for free. And I'll prove it." | Names audience + offer + credibility promise up front; "prove it" sets up the phone insert. |
| **C** *(curiosity / relevance)* | "When's the last time you actually looked at your own website?" | Question hook opens a loop; forces self-relevance. |
| D *(honest / anti-"AI-slop")* | "You've probably seen a hundred of these ads. I'm gonna be straight with you." | Disarms the "they're all identical" pattern skeptics recognise. Stretch take. |
| E *(show-the-payoff — phone in hand at open)* | "This is a website I built for a contractor — free, before we ever talked." | Leads with visible proof (strongest per contractor research); needs the phone visible from frame 1. |

**What each beat does (unchanged logic from the proven winner):** direct address → consequence →
offer = a *website* not a meeting → outcomes ("calls and jobs", not "mobile-friendly") → named human
→ risk reversal → low pressure → mobile CTA ("Tap below", ~97% mobile).

#### On camera (9:16 face shot)

Match the winner — collared shirt or clean plain tee, plain wall with even light (or a truck / real
job site), tight head-and-shoulders with the phone at eye level straight to lens, nothing else in
frame, **no pets**. 1080×1920, MP4/H.264, total cut **~25–28s** (hook in second 1). The phone-insert
clip = a real generated homepage (from `generate-site`) scrolling on a phone screen.

#### On-screen text + captions

- Seconds 0–2: static overlay `CONTRACTORS —` (large). Audio hook plays; the text does the
  audience-targeting for muted viewers *and* for Advantage+ delivery.
- Captions: burned-in (85% watch muted), **clean phrase style** — 3–5 words per line, bottom third,
  plain white sans on a subtle dark scrim, static per phrase. NOT one-word-per-frame kinetic captions
  (that TikTok signal skewed delivery to 25–34 males / entertainment audiences).

#### Ad copy to pair (gain-framed, low-pressure — like the winner)

- Headline (≤27 chars): `Free Website for Contractors`
- Description: `Real builder · Only pay if you love it`
- Primary text:
  ```
  Your website is the first thing a customer sees — and if it's outdated, they call the next guy.

  So I'll build you a new one first and show it to you for free. You only pay if you love it. No pressure, no catch — just a real designer (me), not a sales rep.

  Tap below and let's talk ↓
  ```
- CTA button: `Book Now`
- Destination: `https://acewebdesigners.com/contractorlanding?source=landing-contractors`

#### Testing & KPIs

Run A/B/C as **distinct creatives** in the ad set (Andromeda rewards diversity — not 5 clones).
**Judge on leads, not CTR/CPM/retention** — the 2025 winner beat "funny hook" 9x on conversion while
losing every attention metric. Use **hook rate (>25–30% watch-past-3s)** only as an early diagnostic
that a hook isn't dead on arrival; the deciding KPI is leads. Keep the ad set on **Lead / $20/day /
Advantage+**. Let it run to enough leads before picking a winner.

### Do not put these in the script

Each of these is in the current failing ad:

- **"Book a free website meeting"** — sells a calendar appointment. Sell the website.
- **"transform your digital presence"** — consultant jargon; a roofer would never say it.
- **"fast, modern, mobile-friendly"** — features. Say what they *get*: calls, jobs, customers.
- **"established US contractors only" / "Not for beginners" / "Limited spots"** — the winning ad copy
  was *"Perfect for local businesses... No risk, no pressure."* Gain-framed and inviting beat
  loss-framed and exclusionary by 9x. Low pressure probably helps the show-rate problem too.
- Anonymous **"we"** with no name and no credential.

### On camera

Match the winner, since the visual read is half the result:

| Do | Don't |
|---|---|
| collared shirt | hoodie |
| plain wall, clean light | couch, cluttered room |
| tight head-and-shoulders, straight to lens | wide seated shot |
| nothing in frame | **no pets** |
| 9:16, ~30s | 22s rushed |

Add clean phrase captions (3-5 words, bottom third, static) — **not** the one-word-per-frame kinetic
style. See the captions section above.

### Recommended action

1. Take the existing "Free Preview Rhyan 1" video (Vimeo `1088261551`, or the 9:16 asset already in
   the ad account as video `522183757526673`).
2. Add a static `CONTRACTORS —` overlay over seconds 0-2.
3. Add clean phrase captions in the style table above.
4. Use the winning copy structure, changing only `local businesses` → `contractors`. Keep the
   no-pressure, gain-framed shape.

Change nothing else at the same time, so the result stays readable.

If a reshoot happens later, these are the requirements:

## The comments: the ad is being served to web developers (2026-07-20)

11 comments sit on the ad. Only one is on Facebook (`674428835752335_122187160304878825`); the rest
are on the **Instagram** copy (`instagram.com/p/Davd_w2g5bU/`), which is where the spend went.

Facebook — Mike Dee: *"With that haircut? You build the sites with microsoft paint?"*

Instagram:
| Who | Comment | Likes |
|---|---|---|
| iainfeeney | "Your website is clearly made with Claude, and you didn't even use a transparent file for your logo." | 1 |
| enlevator | "no one wants your AI slop" | 2 |
| kevinfromlongisland | "There are multiple errors in your schema, google didn't even index your services page because it is terrible" | 1 |
| wallykillbot | "I see the site was built with AI. Did y'all do a QA check?" | 3 |
| official.nap.god | "No offense, but these ads are hurting more than they help… the real devs are gonna continue to roast bud… **Us devs are bombarded by these ads every other reel**, and they're all identical." | 3 |
| mharris750 | "😂😂" | 1 |

**Every commenter is a web developer.** Not one contractor. That is a delivery failure, not a comment
problem: Meta is showing a website-services ad to the people who *build websites*, because they are
the ones who engage with website content. It explains the 30% of spend going to 25-34 males, the
6,510 post engagements against 2 leads, and the `BELOW_AVERAGE_35` quality ranking — 11 likes sit on
hostile comments, and agreement-with-criticism is exactly the negative signal quality ranking
measures.

`official.nap.god`'s note is the most useful thing anyone has told us: the creative reads as a
saturated, recognisable genre ("the same scripted new cheap websites… they're all identical"). Devs
recognise the template on sight and pile on.

### Which criticisms are actually true

| Claim | Verdict |
|---|---|
| Logo isn't transparent | **False.** `logo.png` is 500×500 PNG colour type 6 (RGBA) with a real alpha channel. |
| Multiple schema errors | **Partly true.** All 5 JSON-LD blocks parse as valid JSON, but `@type: WebDesignCompany` is **not a schema.org type** (schema.org/WebDesignCompany → 404). Should be `ProfessionalService` or `LocalBusiness`. One real error, not "multiple". |
| Services page not indexed | **Unverified.** `/services` is present in `public/sitemap.xml`; actual Google index status not checked. |

Fix the `WebDesignCompany` type — it's real, it's cheap, and it's the kind of thing that gets quoted
back at us.

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
