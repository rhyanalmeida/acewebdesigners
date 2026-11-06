-- Per-prospect personalization written by scripts/enrich-haiku.mjs (Claude Haiku reads the prospect's own
-- website) and imported by import-prospects.mjs; export-instantly.mjs sends them to Instantly as custom
-- variables so the cold-email copy can open with a line only someone who read THEIR site could write
-- ({{first_line}}, {{hook}}, {{cuisine}}). Owner, 2026-11-05: "this is all for generating the emails for
-- the outbound email outreach". Every value is page-grounded or NULL — never guessed.
alter table public.prospects
  add column if not exists cuisine         text,   -- as their site describes it ("Neapolitan pizza")
  add column if not exists dishes          text,   -- up to 3 dish names, verbatim, " | "-joined
  add column if not exists hook            text,   -- ≤12-word phrase about something specific on their site
  add column if not exists first_line      text,   -- the one-sentence email opener Haiku wrote for them
  add column if not exists owner_evidence  text;   -- verbatim quote proving first_name is the owner
