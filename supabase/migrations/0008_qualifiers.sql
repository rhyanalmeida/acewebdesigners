-- Qualifying answers collected on the scheduler's done screen (see functions/qualify).
-- Poor initial qualification is the biggest documented no-show driver; these give the
-- sales call a read on the prospect before it starts.
--
-- Free text, not enums — parity with business_type, and the option wording will change
-- without needing a constraint migration.

alter table public.contacts
  add column if not exists years_in_business text,
  add column if not exists has_website       text;
