# Outbound cold sequence — v4 (evidence-optimized, reply-gated) — DRAFT, NOT approved, NOT pushed (2026-09-22)

Built from three deep research passes (subject/opener data · CTA/body/follow-up tests · agency→SMB
case studies) on top of `docs/MASTER_PLAN_OUTBOUND_REDESIGN_2026-09-22.md`. Every line below has a
reason in the **Evidence table** at the bottom. v3 stays the approved copy in the Draft campaign
until the owner approves this; to ship, paste the chosen copy into `OUTBOUND_COLD_SEQUENCE_DRAFT.md`
and run `node scripts/instantly-create-campaign.mjs --update 46657029-fdd6-4567-b5fe-2165bb298367`.

**Locked rules honored:** reply-gated (no link anywhere) · $49/mo named once (Email 3) · 4 touches
Day 0/3/7/14 · plain text · `{{unsubscribe}}` + office address in every footer · merge fields only
`{{first_name}} {{company_name}} {{city}}` (fallbacks baked into export) · **no invented stats** —
the only figure in any email is BrightLocal's (n=1,002, 2026-02-11), cited inline, wave 1 only.

**Honest ceiling:** no published study tests a "we'll build your homepage first" offer to
contractors. The best benchmark for this exact segment is Belkins 2025 (7.5M emails): owners of
0–10-person firms reply at 0.72%, construction at 0.56–0.60%. Copy quality moves that by a
multiple, not an order of magnitude; the list filter (reviews signal) is the bigger lever.

---

## Waves, subjects, A/B

| Wave | Rows | Email 1 | Emails 2–4 |
|---|---|---|---|
| 1 | `rating < 4.5 OR review_count < 20`, ≤100 rows first | **1B** | shared |
| 2 | the rest | **1A** | shared |

Email 1 subject A/Z test (50/50). Both are 2–4 words, reference the company, contain no selling
word ("free", "offer", "save"), no number:
- **S1:** `{{company_name}} homepage?`
- **S2:** `homepage idea for {{company_name}}`

Emails 2–3: **empty subject** (Instantly threads them under Email 1). Email 4: fresh subject
`bad timing, {{first_name}}?`

---

## Email 1A — Day 0 · wave 2 · 63 words

**Subject:** {{company_name}} homepage?

Hi {{first_name}},

I came across {{company_name}}'s site while looking at contractors in {{city}}.

I design websites for contractors. I'd like to mock up a new homepage for {{company_name}} — a
real preview built around your work, not a template. It's free, and there's no call.

Want to see it? Reply "yes" and I'll have it to you in a day.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 1B — Day 0 · wave 1 (review signal) · 74 words

**Subject:** {{company_name}} homepage?

Hi {{first_name}},

I came across {{company_name}} while looking at contractors in {{city}}.

A survey this year found 47% of people skip a business with under 20 reviews (BrightLocal, Feb
2026). While the review count is still growing, the homepage has to earn the trust — photos,
license, real jobs.

I'd like to mock up that homepage for {{company_name}}. Free, no call. Want to see it?
Reply "yes".

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

*Truth check: the figure is BrightLocal's and cited. The email says nothing about the prospect's
own rating or count.*

---

## Email 2 — Day 3 · threaded, empty subject · new value, not a bump · 58 words

Hi {{first_name}},

Adding to my last note. The preview I'd build for {{company_name}} is a homepage that loads fast
on a phone, puts a tap-to-call button up top, and shows your best jobs first — built for someone
looking you up from their driveway.

Want me to put it together? A one-word reply is enough.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 3 — Day 7 · threaded, empty subject · price + objection, once · 57 words

Hi {{first_name}},

In case cost is the hold-up: the preview is free. If you like it and want it live, it's $49 a
month — your own .com, hosting, and changes when you need them. Cancel anytime. If you don't like
it, you're out nothing.

Still want to see it? Reply "yes" and I'll start.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 4 — Day 14 · fresh subject · breakup, no guilt · 56 words

**Subject:** {{company_name}} — bad timing?  *(the scraped list has no first names — `{{first_name}}` falls back to "there", so it must never appear in a subject)*

Hi {{first_name}},

Last one from me. No reply usually means one of two things — bad timing, or not a fit. Either
is fine.

If it's timing, reply "later" and I'll check back in a couple of months. If you'd like the
preview after all, reply "yes".

Good luck out there.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Hand replies (same Instantly inbox, in-thread)

**R1 — "yes" (same business day):**
> On it — you'll have the preview from me within a day. One quick one so it's accurate: which
> service do you want front and center?

**R2 — preview ready (the only message that ever carries a link):**
> Here it is: https://acewebdesigners.com/demo/<token>
> It's a draft — tell me what to change and I'll turn it around. If you want it live on your own
> .com, the page walks you through it ($49/mo, cancel anytime). Want to go over it on a 15-minute
> call — Thursday morning or Friday afternoon?

**R3 — "later":**
> Got it. I'll check back in [month]. Good luck with the season.
*(Set a GHL task or calendar note; do not re-enter the sequence.)*

**R4 — "no" / "not interested":**
> Understood — thanks for replying. You're off my list.
*(Mark unsubscribed in Instantly so the poll suppresses the row.)*

---

## Settings (deltas from v3 in bold)

Both inboxes · 20/day each · **send window 06:00–11:00 ET** (was 08–17) · **launch waves Tue/Wed**
· stop on reply · text only · open + link tracking OFF · unsubscribe header ON · gap 10 min + 15
random · Emails 2–3 empty subject · Email 4 new thread · **A/Z test on Email 1 subject** · warm-up ON.

## Pre-send checklist
- [ ] Owner approves 1A, 1B, 2–4, both subjects, the 06–11 window.
- [ ] Wave-1 export filter (`rating<4.5 OR review_count<20`, ≤100 rows) — small flag on
      `export-instantly.mjs`.
- [ ] Warm-up placement ≥85% on both inboxes that morning.
- [ ] Anthropic credits topped up, or hand-built demos for the pilot.
- [ ] Judge on "yes" replies per 100 sent; no verdict under ~100 sends per subject arm.

---

## Evidence table — why each element is written this way

| Element | Choice | Evidence (source · n · date · grade) |
|---|---|---|
| Subject length | 2–4 words | Belkins subject study, 5.5M emails, 2024: 2–4 words 46% open vs 7 words 39%, 10 words 34% (A-) [E1]; Gong/30MPC 85M+: 1–4 words optimal (B) [E2] |
| Subject content | company reference, no "free/offer", no number | Belkins: personalized subject 46%/7% reply vs 35%/3%; lift comes from a specific reference, not a first-name token (A-) [E1][E3]; Gong: selling words (free/offer/save/demo) −17.9% opens; numbers hurt (B) [E2] |
| Subject form | specific question | Belkins: question-type subjects top at 46% open (A-) [E1]; "quick question" flagged as fatigue by every 2026 source, no primary test (C) [E4] |
| Casing | lowercase | Belkins: ≤5-pt spread across casings (flat); Gong/30MPC says lowercase won. Second-order; harmless (A-/B) [E1][E2] |
| No fake "Re:" | real threading only | Google guidelines + EmailBison 6/10 spam in seed test (C, unanimous) [E5] |
| Body length | 56–74 words | Instantly 2026 elite <80 (B) [E6]; Gangly 50–100 words 9.7% vs 200+ 1.9% (B) [E7]; Warmer.ai 50–100 words 16.9% vs >200 4.1% (B) [E8] |
| Reading level | short words, 1–2-clause sentences | Lavender, 231,818 emails: grade 3–5 +67% replies; 70% of cold emails ≥10th grade; mobile-short +83% (B-) [E9] |
| No pitch paragraph | one line of who I am, then the offer | Gong 28M+, 2025: pitching in the body −57% replies; ROI language −15% (B) [E10] |
| Opener | observation of their site + city | No A/B on "came across" vs "noticed"; timeline/observation hooks 10.0% vs problem hooks 4.4% (Digital Bloom, aggregate, B-/C) [E11]; two custom attributes +56% replies (Hunter 31M) [E12] |
| CTA | interest question about *their own asset* + "reply yes" | Gong 304k: interest CTA highest on cold (A for direction) [E13]; Salesforge 1M+: "teardown of your page, want to see it?" 5–7%, top soft ask (B) [E14]; Gangly: interest 11.4%, reply-yes 8.2%, calendar link 3.1% (B, n=500) [E7]; Puzzle Inbox 200k+: soft 4.2% vs hard 1.4% (B) [E15] |
| One CTA, one question | yes | SalesHandy 53M: single soft CTA +78% positive replies (B) [E16]; Lavender 1–3 questions (B) [E9] |
| Free deliverable framing | "mock up… want to see it?" | Loom/teardown offers 4–7% vs meeting asks 2–4% (Salesforge B) [E14]; case studies: self-serve demo links to local owners got clicks and ~0 signups, a conversational free-audit ask got 17/43 replies (IndieHackers, B anecdotes) [E17][E18] |
| Risk reversal | "free, no call" | No test data [uncertain]; kept short so it costs nothing |
| Email 2 = new content | describes the preview, no "bumping" | Gangly: follow-up with new content 8.4% vs "just bumping" 1.8% (B) [E7]; Instantly: step 2 as in-thread reply ≈+30% (B) [E6] |
| Email 3 = price + objection | strongest touch | Belkins 7.5M: step 3 alone = 35.6% of meetings (B) [E19]; price early-vs-late has no A/B data [uncertain] — placed at touch 3 per owner rule |
| Email 4 = two-option breakup | "bad timing or not a fit", "later"/"yes" | Salesforge: "silence means one of… which one?" 4–7%, "dead or delayed?" 4–6% (B) [E14]; guilt lines: Gong "never heard back" −14% (B) [E10] |
| Cadence Day 0/3/7/14 | keep | Woodpecker 20M: 3–4d, then 5–7d, then 7–10d; 3–5 follow-ups 8.3% vs none 4.1% (B) [E20]; Hunter: >3 emails lowers the average — 4 is the cap (B) [E12] |
| Send window 06–11 ET | change from 08–17 | Belkins 7.5M: 5–8am and 8am–12pm best reply *and* 4× the meeting rate of afternoon/evening; 8–11pm worst; Wed/Thu best days (B) [E21] |
| Target segment | owner-operators | Belkins: founders/owners 0.57% vs VPs 0.32%; 0–10 employees 0.72% (A-) [E19] |
| Tone | blunt, plain, phone-first | Plumber field report: 800 sends, 0 replies on a soft generic pitch (C, n=1) [E22]; Lavender: first open 8× more likely on phone (B) [E9] |

### Sources (E-list)
E1 https://belkins.io/blog/b2b-cold-email-subject-line-statistics · E2 https://www.30mpc.com/newsletter/4-data-backed-subject-lines-to-get-your-cold-emails-opened · E3 https://www.lemlist.com/blog/cold-email-subject-line · E4 https://woodpecker.co/blog/cold-email-statistics/ · E5 https://emailbison.com/blogs/cold-email-subject-lines · E6 https://instantly.ai/cold-email-benchmark-report-2026 · E7 https://getgangly.com/blog/cold-email-reply-rate-study · E8 https://warmer.ai/blog/consultant-cold-email-response-rates-study-2025 · E9 https://www.lavender.ai/blog/cold-email-101 + https://lavender.ai/blog/the-cold-email-benchmark-report · E10 https://www.gong.io/blog/does-cold-email-even-work-any-more-heres-what-the-data-says + https://www.gong.io/blog/cold-email-stats · E11 https://thedigitalbloom.com/learn/cold-outbound-reply-rate-benchmarks/ · E12 https://hunter.io/the-state-of-cold-email · E13 https://www.gong.io/blog/this-surprising-cold-email-cta-will-help-you-book-a-lot-more-meetings · E14 https://www.salesforge.ai/blog/cold-email-ctas · E15 https://puzzleinbox.com/blog/cold-email-cta-best-practices/ · E16 https://www.saleshandy.com/blog/cold-email-statistics/ · E17 https://www.indiehackers.com/post/cold-emailing-local-businesses-what-is-working-in-2026-a0e7ceef25 · E18 https://www.indiehackers.com/post/i-sent-43-cold-emails-with-my-own-tool-17-replied-1-paid-here-s-the-unofficial-launch-329774e623 · E19 https://belkins.io/blog/cold-email-response-rates · E20 https://woodpecker.co/blog/cold-email-statistics/ · E21 https://belkins.io/blog/best-time-to-send-email · E22 https://itteba.substack.com/p/i-emailed-800-plumbers-and-got-0

**Not verifiable / not used:** any cold-stage % for Gong's interest CTA (the "15%" circulating is not in Gong's post); GrowLeads "76% breakup reply"; HubSpot "checking in 0.8%"; P.S.-line effects; "you vs I" ratio lifts; price-timing A/Bs; any "free mockup" reply benchmark.
