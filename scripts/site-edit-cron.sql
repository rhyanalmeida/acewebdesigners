-- pg_cron job that releases held site edits (see migration 0013 + supabase/functions/site-edit).
-- Run via the Management API SQL endpoint with <RELEASE_KEY> replaced by the deployed
-- CAPI_INTERNAL_SECRET (the cron command embeds it, so it is NOT in a migration).
-- Idempotent: unschedules the old job first.
select cron.unschedule('site-edit-release') where exists (select 1 from cron.job where jobname = 'site-edit-release');
select cron.schedule(
  'site-edit-release',
  '*/5 * * * *',
  $$ select net.http_post(
       url     := 'https://dwsmrruzufqpopdzlszw.supabase.co/functions/v1/site-edit',
       headers := '{"content-type":"application/json","x-release-key":"<RELEASE_KEY>"}'::jsonb,
       body    := '{"action":"release"}'::jsonb,
       timeout_milliseconds := 120000
     ) $$
);
