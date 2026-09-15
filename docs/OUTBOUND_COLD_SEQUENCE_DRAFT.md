# Outbound cold sequence — DRAFT v2 for owner approval (2026-09-01)

**Status: APPROVED by owner 2026-09-14 (copy as-is) and loaded into Instantly campaign
`46657029-fdd6-4567-b5fe-2165bb298367` via `scripts/instantly-create-campaign.mjs`. Edit here,
then `--update <id>` to re-push — the doc is the single source of copy.**

Revised 2026-09-01 per owner request ("no pricing on day 0; let the research decide the
structure"). Changes vs v1: price removed from Emails 1–2 and named exactly once (Email 3, the
objection-handling touch); sequence extended 3 → 4 touches (Day 0/3/7/14); "Re:" threading on
follow-ups 2–3 with a fresh subject on the breakup; `{{city}}` used for personalization.

## Why this structure (research, multiple sources, 2026)
- **No price in the first email.** Sources uniformly favor a short (<80-word), problem-focused
  first touch with one low-friction ask; hard offers/pricing up front depress replies. Emails
  that open on a concrete verifiable gap ("no website") report 15–20% replies vs 1–3% generic.
  Price still appears in the sequence (Email 3) because hiding it entirely until checkout
  conflicts with our truthful-framing rule — and it pre-qualifies before a demo build is spent.
- **4 touches, widening gaps (Day 0/3/7/14).** 3–4 emails is the SMB sweet spot: ~40–55% of
  replies come from follow-ups, but spam-complaint risk roughly triples from the 4th follow-up
  onward and each email past the third loses ~30% effectiveness. On a scraped list, 4 is the cap.
- **One job per touch:** hook → value-add → objection pre-handle (price lands here) → clean
  breakup with no guilt language (guilt CTAs trigger spam reports).
- **Subjects:** Emails 2–3 thread as "Re:" (context + opens); Email 4 breaks the thread with a
  fresh subject in case the earlier thread went unseen.
- Skipped as not applicable: multichannel steps (this funnel is Instantly email-only) and
  social-proof touches (owner rule: no invented stats; we have no citable proof yet — the free
  demo itself is the value-add).

Sources: Instantly Cold Email Benchmark Report 2026; Autobound Cold Email Guide 2026; Allegrow
Cold Email Sequences knowledge base; B2BLeadFinder web-design agency templates (2026); lemlist,
MailReach, Whali & imisofts follow-up-count studies; Breakcold reply-rate guide; Woodpecker
20M-email statistics.

## Rules honored (locked owner rules + CAN-SPAM)
- No invented stats, review counts, or social proof of any kind.
- Truthful preview framing: the demo is built on the prospect's **first click**, so the copy says
  we "set up a preview page" — never "we already built your site".
- ⚠️ Email 1's opener ("couldn't find much of a website") depends on the LIST: it's true for the
  no-/weak-website contractor targeting we scrape for. If a future batch includes businesses
  with decent sites, that opener must change before sending to them.
- `{{demo_url}}` is the **only** CTA link in every email.
- Instantly's unsubscribe link (`{{unsubscribe}}`) in every email.
- Footer carries the CAN-SPAM postal address (owner-supplied 2026-09-14: 30 North Main St,
  Leominster, MA 01453 — the office; a street address is one of the three forms 16 CFR 316.2
  accepts).
- Plain text only, no images/attachments (deliverability + honesty).

Merge fields (from `scripts/export-instantly.mjs` — the only ones that exist):
`{{email}} {{first_name}} {{company_name}} {{city}} {{state}} {{demo_url}}`.
`first_name` can be blank in the scraped data — in Instantly, set a fallback of `there` on the
variable; set a fallback of `your area` on `city` (Instantly supports per-variable fallbacks in
the template editor).

Cadence: **Day 0 → Day 3 → Day 7 → Day 14.** Stop on reply (Instantly default) — replies flow
to the `outbound-lead` GHL staff alert; the webhook suppresses bounces/unsubs automatically.

---

## Email 1 — Day 0 (hook — no price)

**Subject:** quick question about {{company_name}}

Hi {{first_name}},

I looked for {{company_name}} online and couldn't find much of a website — which usually
means customers in {{city}} can't either.

I run a small web design studio, so I set up a preview page for your business. One click and
it puts together a homepage design based on your company — takes about a minute, nothing to
install, no payment info asked:

{{demo_url}}

Worth a look?

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 2 — Day 3 (value-add, threaded — no price)

**Subject:** Re: quick question about {{company_name}}

Hi {{first_name}},

In case the last note got buried — the preview page for {{company_name}} is still live:

{{demo_url}}

It's free to generate and takes about a minute. Even if you never hire anyone, it'll show
you what a modern homepage for your business could look like — useful either way.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 3 — Day 7 (objection pre-handle, threaded — price lands here, once)

**Subject:** Re: quick question about {{company_name}}

Hi {{first_name}},

Guessing the hesitation is time or cost, so to answer both up front: the preview takes one
click and is free. If you like it and want it live, it's $49/month — that covers your own
.com domain, hosting, and us keeping it running. Cancel anytime. If not, the preview cost
you nothing.

{{demo_url}}

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Email 4 — Day 14 (breakup, fresh subject — no price, no guilt)

**Subject:** closing the file on {{company_name}}

Hi {{first_name}},

Last email from me — I won't keep filling your inbox.

The preview page for {{company_name}} stays up if you ever want to see what a homepage for
your business could look like:

{{demo_url}}

If a website isn't a priority right now, completely understood. Good luck out there.

Rhyan
Ace Web Designers

{{unsubscribe}}
Ace Web Designers · 30 North Main St, Leominster, MA 01453

---

## Owner review checklist (before loading into Instantly)
- [x] Supply the real physical postal address (done 2026-09-14 — in all four footers).
- [ ] Confirm tone/wording of all four touches (edit freely — resend for re-check if claims change).
- [ ] Confirm the $49/month placement (named once, Email 3 only) and its wording.
- [ ] Confirm cadence (Day 0 / 3 / 7 / 14) or adjust in the Instantly campaign settings.
- [ ] When setting up in Instantly: fallbacks `there` (first_name) and `your area` (city);
      thread Emails 2–3 as replies; Email 4 as a new thread.
