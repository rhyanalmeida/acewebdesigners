-- pg_cron jobs for the outbound funnel (needs pg_cron + pg_net — migration 0013).
-- Run via the Management API SQL endpoint with <KEY> replaced by the deployed
-- CAPI_INTERNAL_SECRET (both functions check it; the cron command embeds it, so this
-- file is NOT a migration). Idempotent: each job is unscheduled first.
--
--   site-edit-release  every 5 min  → deploys change requests whose 30-45 min hold elapsed
--   instantly-poll     every 15 min → replies/bounces/unsubs → webhook; demo-link sends
--
-- After instantly-poll runs green, DISABLE the Windows task "Instantly Poll"
-- (schtasks /change /tn "Instantly Poll" /disable) so replies aren't forwarded twice.

select cron.unschedule(jobname) from cron.job where jobname in ('site-edit-release', 'instantly-poll');

select cron.schedule(
  'site-edit-release',
  '*/5 * * * *',
  $$ select net.http_post(
       url     := 'https://dwsmrruzufqpopdzlszw.supabase.co/functions/v1/site-edit',
       headers := '{"content-type":"application/json","x-release-key":"<KEY>"}'::jsonb,
       body    := '{"action":"release"}'::jsonb,
       timeout_milliseconds := 120000
     ) $$
);

select cron.schedule(
  'instantly-poll',
  '*/15 * * * *',
  $$ select net.http_post(
       url     := 'https://dwsmrruzufqpopdzlszw.supabase.co/functions/v1/instantly-poll',
       headers := '{"content-type":"application/json","x-cron-key":"<KEY>"}'::jsonb,
       body    := '{}'::jsonb,
       timeout_milliseconds := 150000
     ) $$
);
