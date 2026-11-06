# GHL outbound alerts — one specific text per event

**Status 2026-11-05 late: ALL LIVE.** Code deployed (go-live-alerts.mjs), custom fields + secret set, and the three
workflows below were built by duplicating "Outbound — Needs a Person" (re-entry ON inherited) via
`scripts/ghl-edit-alert.mjs` (Playwright over CDP, `scripts/browser-launch.mjs` profile) and PUBLISHED.
"Outbound — Interested Lead" set to draft so each event sends exactly one text.

Owner, 2026-11-05: *"I need the text messages to be more specific — like the customer replied, or if they
opened the link, or they want to check out our purchase — not just interested."*

The code now fires one GHL tag per event, **removed then re-added** so the workflow's SMS fires every time,
with the specifics in contact custom fields. Three workflows have to be clicked together in the GHL UI
(the API cannot create workflows), each with **re-entry ON** and no customer-facing step. The existing
"Outbound — Interested Lead" (`outbound-lead`) stays as the generic catch-all until these three are live,
then **disable it** so each event sends exactly one text.

## 0. One-time: custom fields
```
node scripts/ghl-setup-custom-fields.mjs          # idempotent; adds Last Event, Reply Sentiment, Demo View Count, Checkout Domain
npx supabase secrets set GHL_CUSTOM_FIELD_IDS='<json printed by the script>'   # single key, never --env-file; NOT mid-build
npx supabase db push                               # migration 0018 (prospect personalization columns)
npx supabase functions deploy demo-site reply-desk create-subscription
```
Merge tags in the SMS editor: `{{contact.company_name}}` `{{contact.last_event}}` `{{contact.last_reply_text}}`
`{{contact.reply_sentiment}}` `{{contact.demo_view_count}}` `{{contact.checkout_domain}}` `{{contact.demo_preview_url}}`
(custom-field merge names = the field name slugified). Editor gotcha: select-all + unlink before saving
(it autolinks `.name`-style tokens). Publish toggle is a *pending* change — click Save after it.

## 1. "Outbound — Replied" · trigger: tag added `outbound-replied` · re-entry ON
Fires from `reply-desk` on every classified reply (yes / question / price / later / no / remove / hostile), with
`reply_sentiment`, `last_reply_text`, `last_reply_intent`. (Hand-offs ALSO fire `outbound-needs-human` → the
existing "Needs a Person" text; that one keeps the /admin link.)

SMS → +1 774-329-3117 and +1 508-308-2714:
```
💬 {{contact.company_name}} replied ({{contact.reply_sentiment}}):
"{{contact.last_reply_text}}"
Demo: {{contact.demo_preview_url}}
```

## 2. "Outbound — Opened the demo" · trigger: tag added `outbound-viewed` · re-entry ON
Fires from `demo-site` on the FIRST open of `/demo/<token>` (the click in the email). Later opens only bump
`demo_view_count`; a repeat-viewer nudge is the reply desk's job, not a text.

SMS:
```
👀 {{contact.company_name}} just opened their demo for the first time.
{{contact.demo_preview_url}}
```

## 3. "Outbound — Started checkout" · trigger: tag added `outbound-checkout` · re-entry ON
Fires from `create-subscription` the moment a Stripe Checkout session is created for the demo plan, with
`checkout_domain` (the .com they picked, or their own domain). If they complete, the existing
"Outbound — Purchased (Onboarding)" text follows within a minute; if no purchase text arrives, they bailed at
the card — worth a same-day human reply.

SMS:
```
💳 {{contact.company_name}} is at checkout — domain {{contact.checkout_domain}}.
If no "purchased" text follows, they stopped at the card. Demo: {{contact.demo_preview_url}}
```

## 4. Already live, unchanged
- **Purchased** → `outbound-purchased` → staff SMS with the domain + customer onboarding email.
- **Needs a person** → `outbound-needs-human` → staff SMS with the reply + /admin link.
- **Automated replies** → the reply desk (`REPLY_DESK_ENABLED=true`) answers yes / question / price / later
  in-thread from the same inbox; remove / hostile / no are suppressed silently.

## Verify
Reply "yes" from the seed inbox → expect two texts (Replied + Needs-a-person only if it hands off) → open the
demo link → "Opened" text → click Take it live and pick a domain → "At checkout" text → pay (or not).
`select business_name, last_reply, reply_sentiment, demo_view_count, ghl_contact_id from prospects where
replied_at is not null order by replied_at desc limit 10` shows the same events.
