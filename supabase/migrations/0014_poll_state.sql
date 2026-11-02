-- 0014_poll_state.sql
-- Server-side state for the `instantly-poll` Edge Function (replaces the Windows task
-- "Instantly Poll" + %LOCALAPPDATA%\instantly-poll.json so replies flow with the PC off).
-- One row per poller: value = { replies_since, seen[] } exactly as the local file held it.

create table if not exists public.poll_state (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.poll_state enable row level security; -- service role only

-- Seed from the PC's last state (2026-11-02 ~02:00 ET) so nothing is re-forwarded.
insert into public.poll_state (key, value) values (
  'instantly',
  '{"replies_since":"2026-10-08T11:13:13.000Z","seen":["reply:01a0f265-1108-7fa6-9b95-6457d57c9b10","reply:01a11afc-9aba-7d72-b489-8509073481b5","reply:01a11b37-9db2-7670-ac80-ddff38a080ff","bounce:info@evergreenyourhome.com"]}'::jsonb
) on conflict (key) do nothing;
