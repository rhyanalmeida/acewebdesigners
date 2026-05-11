# B7 — GHL Custom Field ID Static Audit

**Audit date:** 2026-05-10
**Source:** `src/utils/attribution.ts:112-117`
**Scope:** Shape-validity check of the four hardcoded GHL custom-field IDs that
the contractor booking widget uses to stamp `fbc` / `fbp` / `event_id` /
`fbclid` onto the GHL contact for Meta CAPI dedup.

This is a **static** audit. No GHL API call is made — this worker has no
authenticated GHL session. Shape validity does not prove the IDs still resolve
to live custom fields on the contractor location; it only proves they have
not been corrupted in source.

---

## 1. Hardcoded IDs and shape check

| Key        | ID                       | Length | Alphanumeric | Shape OK |
|------------|--------------------------|--------|--------------|----------|
| `fbc`      | `klWCXR25U9P8TkpsEc2t`   | 20     | yes          | yes      |
| `fbp`      | `vSm5ey4ntRn3l1Q9Yx6w`   | 20     | yes          | yes      |
| `event_id` | `FEeWp7qaPpd34Nn57bI4`   | 20     | yes          | yes      |
| `fbclid`   | `J3QRxlV4Ufjchj8VN8MV`   | 20     | yes          | yes      |

All four IDs match the typical GHL custom-field-ID shape: exactly 20 characters,
`^[A-Za-z0-9]+$`. No malformed entries.

## 2. Documentation freshness

- `docs/META_ADS.md` last touched: **2026-05-01 11:53:44 -0400** (9 days ago).
- The doc has a dedicated section `## GHL custom-field-ID rotation runbook`
  (around line 152) that lists the same four IDs and the API endpoint used to
  re-pull them if they rotate.
- Recent commits referencing `src/utils/attribution.ts` in `git log --all`:
  - `b76cba3` chore: codebase hardening + deploy reliability fix
  - `9fca606` feat: move Meta CAPI server-side with event_id dedup for contractor landing

## 3. Verdict

**OK: shape valid, recently documented.**

`docs/META_ADS.md` was last touched 9 days ago (well within the 30-day
freshness window) and the rotation runbook is present. No automated staleness
flag fires.

This does NOT confirm the IDs still resolve in GHL — only the human
verification step in section 5 can do that.

## 4. What this audit does NOT cover

- Whether the four IDs still exist on the contractor location
  (`A2zlaOOL5JLn883XGWWl`) in GHL.
- Whether any of the four custom fields have been renamed, deleted, or
  recreated (recreation rotates the ID silently).
- Whether the field types still accept the string payloads we send.

If GHL ever recreates these fields, the booking widget will silently drop
attribution onto nonexistent fields, breaking Meta CAPI dedup with no error
surfaced. The only defense is the manual verification below.

## 5. Human verification runbook (GHL admin UI)

> Open GHL → Settings → Custom Fields → filter for the four field labels
> (Facebook fbc, Facebook fbp, Facebook event_id, Facebook fbclid) → click
> each, copy the field ID (in URL or detail panel) → compare to
> `attribution.ts`. If different, update the file.

Alternative API pull (from `docs/META_ADS.md`):

```
GET https://backend.leadconnectorhq.com/locations/A2zlaOOL5JLn883XGWWl/customFields/search?documentType=field&model=contact
```

Each row's `id` field is the value to plug into `GHL_CUSTOM_FIELD_IDS` in
`src/utils/attribution.ts:112-117`.

## 6. If a rotation is detected

1. Update `src/utils/attribution.ts:112-117` with the new ID(s).
2. Bump the "Tested YYYY-MM-DD" comment at line 105.
3. Update the example block in `docs/META_ADS.md` (around line 157) so this
   audit's freshness check stays meaningful.
4. Re-run a real test booking and confirm the contact in GHL has the four
   custom fields populated.
