-- 0013_site_edits_delayed_release.sql
-- Owner (2026-11-02): a change must never look instant — "give it at least 30 mins".
-- `site-edit` now generates right away but parks the finished files on the row
-- (status 'ready', release_after = now() + 30-45 min); a pg_cron job calls the fn's
-- {action:'release'} every 5 minutes, which deploys every ready row whose time has
-- come, in order. The customer sees "received" → "done — live" within the hour.

alter table public.site_edits
  add column if not exists files         jsonb,          -- full site file set to deploy (unchanged ∪ changed)
  add column if not exists release_after timestamptz;

alter table public.site_edits drop constraint if exists site_edits_status_check;
alter table public.site_edits
  add constraint site_edits_status_check
  check (status in ('queued', 'applying', 'ready', 'applied', 'failed'));

create index if not exists site_edits_release_idx
  on public.site_edits (release_after) where status = 'ready';

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

-- The cron job itself is created out-of-band (scripts/site-edit-cron.sql via the
-- Management API) because its command embeds the x-release-key secret.
