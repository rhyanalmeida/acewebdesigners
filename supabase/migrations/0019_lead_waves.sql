-- 0019_lead_waves.sql
-- Lead-wave automation (scripts/auto-wave.mjs) + the /admin "Lead pipeline" and "Follow-up / call" panels.
--
-- lead_waves: one row per scrape→enrich→verify→import→upload run. A row is born either by the
-- /admin "Scrape a new list" button (status 'requested', requested_by 'admin') or by the local
-- auto-wave runner itself (trigger / manual). The runner on the office PC claims 'requested' rows
-- (the scrape needs a real browser, so it cannot run on Edge), runs the chain and writes counts +
-- cost back. The pipeline state the dashboard shows (MillionVerifier credits, Instantly contacts
-- left this month, Haiku spend, next cities) lives in poll_state under key 'lead-pipeline' and is
-- refreshed by every runner tick — local-only keys never become Edge secrets.
create table if not exists public.lead_waves (
  id            uuid primary key default gen_random_uuid(),
  status        text not null default 'requested'
                check (status in ('requested', 'running', 'done', 'skipped', 'failed', 'cancelled')),
  requested_by  text not null default 'trigger',          -- 'admin' | 'trigger' | 'manual'
  requested_at  timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz,
  search        text,                                     -- "restaurant"
  cities        text[],                                   -- ["Lynn, MA", …]
  batch         text,                                     -- prospects.batch label once imported
  counts        jsonb not null default '{}'::jsonb,       -- scraped / real_sites / emails / verified_ok / catch_all / imported / uploaded / remaining_in_plan
  cost          jsonb not null default '{}'::jsonb,       -- haiku_usd / verify_credits
  note          text,                                     -- why skipped / failed, or the owner's note from the button
  log_tail      text,                                     -- last lines of the runner log
  created_at    timestamptz not null default now()
);
create index if not exists lead_waves_status_idx on public.lead_waves (status, requested_at desc);
alter table public.lead_waves enable row level security; -- service role only

-- Follow-up / call list: a person called or messaged this prospect outside the email sequence.
alter table public.prospects
  add column if not exists called_at  timestamptz,
  add column if not exists call_note  text;
