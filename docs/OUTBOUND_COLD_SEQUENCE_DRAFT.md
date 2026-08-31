# Outbound cold sequence — DRAFT for owner approval (2026-08-31)

**Status: DRAFT — nothing loads into Instantly until Rhyan approves this file.**

Rules honored (locked owner rules + CAN-SPAM):
- No invented stats, review counts, or social proof of any kind.
- Truthful preview framing: the demo is built on the prospect's **first click**, so the copy says
  we "set up a preview page" — never "we already built your site".
- `{{demo_url}}` is the **only** CTA link in every email.
- Instantly's unsubscribe link (`{{unsubscribe}}`) in every email.
- Footer carries a `[OWNER: physical postal address]` placeholder — **owner must supply the real
  postal address before launch** (CAN-SPAM requires it).
- Plain text only, no images/attachments (deliverability + honesty).

Merge fields (from `scripts/export-instantly.mjs` — the only ones that exist):
`{{email}} {{first_name}} {{company_name}} {{city}} {{state}} {{demo_url}}`.
`first_name` can be blank in the scraped data — in Instantly, set a fallback of `there` on the
variable (Instantly supports per-variable fallbacks in the template editor) or leave greetings
name-free as written below.

Cadence suggestion: Day 0 → Day 3 → Day 7. Stop on reply (Instantly default) — replies flow to
the `outbound-lead` GHL staff alert; the webhook suppresses bounces/unsubs automatically.

---

## Email 1 — Day 0

**Subject:** a homepage for {{company_name}}

Hi {{first_name}},

I run a small web design studio. I came across {{company_name}} and noticed you don't have
much of a website presence, so I set up a preview page for your business.

Open it and click the button, and it puts together a homepage design based on your company —
takes about a minute, nothing to install, no payment info asked:

{{demo_url}}

If you like what you see, it's $49/month for us to put it live on your own .com and keep it
running. If not, no harm done — the preview is free either way.

Rhyan
Ace Web Designers

{{unsubscribe}}
[OWNER: physical postal address]

---

## Email 2 — Day 3

**Subject:** re: a homepage for {{company_name}}

Hi {{first_name}},

Quick follow-up — the preview page I set up for {{company_name}} is still there if you want to
take a look:

{{demo_url}}

One click and it generates a homepage design for your business. Free to look at; $49/month only
if you decide you want it live on your own domain.

Rhyan
Ace Web Designers

{{unsubscribe}}
[OWNER: physical postal address]

---

## Email 3 — Day 7 (final)

**Subject:** last one from me

Hi {{first_name}},

I'll keep this short — this is the last email I'll send you.

The preview page for {{company_name}} stays up here if you ever want to see what a homepage
for your business could look like:

{{demo_url}}

If a website isn't a priority right now, totally understood. Good luck with the season.

Rhyan
Ace Web Designers

{{unsubscribe}}
[OWNER: physical postal address]

---

## Owner review checklist (before loading into Instantly)
- [ ] Supply the real physical postal address (replaces every `[OWNER: ...]` placeholder).
- [ ] Confirm tone/wording of all three touches (edit freely — resend for re-check if claims change).
- [ ] Confirm the $49/month price is stated the way you want it (it's named in emails 1–2).
- [ ] Confirm cadence (Day 0 / 3 / 7) or adjust in the Instantly campaign settings.
