# Meta Ads — Pixel + CAPI Reference

> **The contents of this document were removed on 2026-07-20 because they were actively misleading.**
>
> It described an architecture that no longer exists: browser pixel for audience signals only, with
> all conversions sent by GHL's native "Meta Conversion API" workflow action, no `event_id`, no
> browser/server dedup. It also instructed the reader to delete `META_CAPI_TOKEN` as unused.
>
> None of that is true today. We own the CAPI path end to end, GHL is messaging-only, and every
> website conversion is dual-fired and deduped on a shared `event_id`. Diagnosing from the old text
> would send you looking for a GHL-side CAPI action that must never be re-enabled, and could get a
> live secret deleted.

## Where the current truth lives

| What you need | Where |
|---|---|
| Architecture, funnel/dedup model, pixel IDs, campaign state | `CLAUDE.md` |
| The CAPI engine itself (hashing, dedup, action_source, test mode) | `supabase/functions/_shared/meta.ts` — the header comment is authoritative |
| Most recent performance diagnosis and action plan | `docs/FUNNEL_AUDIT_2026-07-20.md` |

## The two rules most easily got wrong

1. **Never add a CAPI action to a GHL workflow.** CAPI is ours; a GHL-side action double-fires. The
   old "contractor appointment workflow" did exactly this and stays disabled.
2. **`META_TEST_EVENT_CODE` is read only by explicit test paths.** `meta.ts` must never fall back to
   it for live events — that would route every real conversion into Test Events and exclude it from
   ad optimization.
