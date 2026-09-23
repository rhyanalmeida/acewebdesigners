# Outbound cold sequence — v4 (evidence-optimized, redesign angle, reply-gated) — APPROVED to launch 2026-09-22

**Status:** owner said "let's start the email campaign" 2026-09-22 → v4 is the live copy. Pushed to
campaign `46657029-fdd6-4567-b5fe-2165bb298367` via `scripts/instantly-create-campaign.mjs --update`.
This doc is the single source of copy: edit here, then `--update <id>` to re-push. The full
per-line evidence table (22 sources) is in `docs/OUTBOUND_COLD_SEQUENCE_v4_DRAFT_2026-09-22.md`;
the research behind it is `docs/MASTER_PLAN_OUTBOUND_REDESIGN_2026-09-22.md`.

**v4 vs v3 (all research-driven):** subject cut to 2–4 words with the company name and no selling
word ("free"/"offer") or number (Belkins 5.5M-email subject study; Gong); the "I run a small web
design studio… " pitch line shortened (Gong 28M: pitching in the body −57% replies); CTA is an
interest question about their own asset — "Want to see it? Reply yes" (Gong 304k; Salesforge 1M+);
Email 2 carries NEW content instead of a bump (Gangly: 8.4% vs 1.8%); Email 4 is a two-option
breakup with no guilt line; bodies 56–74 words at a ~grade-5 reading level (Lavender 231k:
+67% replies); send window moved to **06:00–11:00 ET** (Belkins 7.5M: ~4x the meeting rate of
afternoon sends). Cadence Day 0/3/7/14 unchanged.

**Parser notes:** `## Email N — Day D` headings + a `**Subject:**` line per email; a subject that
starts with `Re:` is sent with an EMPTY subject so Instantly threads it natively (Emails 2–3);
Email 4's fresh subject breaks the thread on purpose. Bodies are written on long single lines on
purpose — `unwrapSoftBreaks` would otherwise turn a wrap before a capital/digit into a hard break.

## Rules honored (locked owner rules + CAN-SPAM)
- No invented stats, review counts, or social proof. (The one figure ever considered — BrightLocal's
  47% / 20-reviews line — lives only in the optional wave-1 variant 1B in the v4 draft doc and is NOT
  in this live copy.)
- Truthful preview framing: nothing is built until the prospect says yes ("I'd like to mock up" /
  "I'll start"), never "we already built your site".
- Email 1's opener assumes a REDESIGN list (every prospect has a live website — check the batch's
  `website` column before sending). The v2 no-website opener is in git history.
- **No link in any email** (reply-gated demo): the CTA is a "yes" reply. The `/demo/<token>` link
  goes out only in a personal reply after the build.
- Instantly's unsubscribe link (`{{unsubscribe}}`) + the office postal address (30 North Main St,
  Leominster, MA 01453 — a street address per 16 CFR 316.2) in every footer.
- Plain text only.

Merge fields (from `scripts/export-instantly.mjs`): `{{email}} {{first_name}} {{company_name}}
{{city}} {{state}} {{demo_url}}` — fallbacks `there` / `your area` are baked into the export.
`{{demo_url}}` is exported but deliberately unused in the copy.

Cadence: **Day 0 → Day 3 → Day 7 → Day 14.** Stop on reply (Instantly default); replies flow to
the `outbound-lead` GHL staff alert via `scripts/instantly-poll.mjs`.

---

## Email 1 — Day 0 (hook — reply-gated, no link, no price)

**Subject:** {{company_name}} homepage?

Hi {{first_name}},

I came across {{company_name}}'s site while looking at contractors in {{city}}.

I design websites for contractors. I'd like to mock up a new homepage for {{company_name}} — a real preview built around your work, not a template. It's free, and there's no call.

Want to see it? Reply "yes" and I'll have it to you in a day.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 2 — Day 3 (new value, threaded — no price)

**Subject:** Re: {{company_name}} homepage?

Hi {{first_name}},

Adding to my last note. The preview I'd build for {{company_name}} is a homepage that loads fast on a phone, puts a tap-to-call button up top, and shows your best jobs first — built for someone looking you up from their driveway.

Want me to put it together? A one-word reply is enough.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 3 — Day 7 (objection pre-handle, threaded — price lands here, once)

**Subject:** Re: {{company_name}} homepage?

Hi {{first_name}},

In case cost is the hold-up: the preview is free. If you like it and want it live, it's $49 a month — your own .com, hosting, and changes when you need them. Cancel anytime. If you don't like it, you're out nothing.

Still want to see it? Reply "yes" and I'll start.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 4 — Day 14 (breakup, fresh subject — no price, no guilt)

**Subject:** {{company_name}} — bad timing?

Hi {{first_name}},

Last one from me. No reply usually means one of two things — bad timing, or not a fit. Either is fine.

If it's timing, reply "later" and I'll check back in a couple of months. If you'd like the preview after all, reply "yes".

Good luck out there.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Hand replies (from the same Instantly inbox, in-thread)

- **"yes":** `On it — you'll have the preview from me within a day. One quick one so it's accurate: which service do you want front and center?` → build from /admin Outbound (or open `/demo/<token>` and click Build; no Anthropic credits = build by hand) → reply with the `/demo/<token>` link + a 15-minute call offer with two concrete times.
- **"later":** `Got it. I'll check back in [month]. Good luck with the season.` → GHL task; do not re-enter the sequence.
- **"no":** `Understood — thanks for replying. You're off my list.` → mark unsubscribed in Instantly so the poll suppresses the row.

## Launch record
- [x] v4 copy approved by owner ("let's start") 2026-09-22.
- [x] Pushed to campaign 46657029-fdd6-4567-b5fe-2165bb298367 (`--update`).
- [x] Wave 1 (100 rows) exported + uploaded via `scripts/instantly-upload-leads.mjs` (100/100, 0 dup).
- [x] **Launched 2026-09-22** via API (`POST /campaigns/{id}/activate`, status 1 read back); the scripts still never activate on their own.
