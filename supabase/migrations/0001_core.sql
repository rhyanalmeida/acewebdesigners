-- acewebdesigners core schema
-- Owns what GHL used to: leads (contacts), bookings (appointments), bookable
-- windows (availability), and a server-side Conversions API audit/dedup log
-- (capi_events). All tables are RLS-locked to the service role; the browser
-- only ever talks to Edge Functions, never to these tables directly.

-- gen_random_uuid()
create extension if not exists pgcrypto;

-- ── contacts ──────────────────────────────────────────────────────────────────
-- One row per lead. fbc/fbp/fbclid are the Meta click identifiers captured by
-- the booking form (same-origin cookies now — no GHL iframe), used by CAPI.
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  email       text unique,
  phone       text,
  first_name  text,
  last_name   text,
  city        text,
  state       text,
  zip         text,
  country     text default 'US',
  fbc         text,
  fbp         text,
  fbclid      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── appointments ──────────────────────────────────────────────────────────────
-- One row per booking. `event_id` is shared with the browser pixel Lead so Meta
-- dedupes the client + server Lead. gcal_event_id / ghl_* link to the external
-- sinks (Google Calendar event; GHL contact+appointment that fires messaging).
create table if not exists public.appointments (
  id                 uuid primary key default gen_random_uuid(),
  contact_id         uuid not null references public.contacts(id) on delete cascade,
  calendar           text not null check (calendar in ('main','contractor')),
  start_ts           timestamptz not null,
  end_ts             timestamptz not null,
  tz                 text not null,
  status             text not null default 'booked'
                       check (status in ('booked','showed','no_show','cancelled')),
  event_id           text not null,          -- CAPI Lead event_id (== browser pixel)
  gcal_event_id      text,
  ghl_contact_id     text,
  ghl_appointment_id text,
  value              numeric(10,2),
  currency           text default 'USD',
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (end_ts > start_ts)
);

create index if not exists appointments_start_idx  on public.appointments (start_ts);
create index if not exists appointments_status_idx on public.appointments (status);
-- Prevent double-booking the same calendar+slot (cancelled rows don't block).
create unique index if not exists appointments_slot_uniq
  on public.appointments (calendar, start_ts)
  where status <> 'cancelled';

-- ── availability ──────────────────────────────────────────────────────────────
-- Weekly bookable windows per calendar. Minutes are minutes-from-midnight in
-- `tz`. Open slots = these windows, sliced into slot_minutes, minus booked
-- appointments, minus Google Calendar busy times (queried live by `slots`).
create table if not exists public.availability (
  id            uuid primary key default gen_random_uuid(),
  calendar      text not null check (calendar in ('main','contractor')),
  weekday       smallint not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_minute  smallint not null check (start_minute between 0 and 1440),
  end_minute    smallint not null check (end_minute between 0 and 1440),
  slot_minutes  smallint not null default 30 check (slot_minutes between 5 and 480),
  tz            text not null default 'America/New_York',
  active        boolean not null default true,
  check (end_minute > start_minute)
);

-- ── capi_events ───────────────────────────────────────────────────────────────
-- Audit + dedup log for every server->Meta Conversions API send. event_id is
-- the PK so retried webhooks (e.g. Stripe) can't double-fire the same event.
create table if not exists public.capi_events (
  event_id       text primary key,
  event_name     text not null,             -- Lead | CompleteRegistration | Purchase
  action_source  text,
  contact_id     uuid references public.contacts(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  value          numeric(10,2),
  status         text,                       -- sent | error
  meta_response  jsonb,
  sent_at        timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Enable RLS with NO policies => only the service_role key (used inside Edge
-- Functions) can read/write. anon/auth users get nothing direct.
alter table public.contacts     enable row level security;
alter table public.appointments enable row level security;
alter table public.availability enable row level security;
alter table public.capi_events  enable row level security;

-- ── keep updated_at fresh ─────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists contacts_touch on public.contacts;
create trigger contacts_touch before update on public.contacts
  for each row execute function public.touch_updated_at();

drop trigger if exists appointments_touch on public.appointments;
create trigger appointments_touch before update on public.appointments
  for each row execute function public.touch_updated_at();

-- ── seed default availability (Mon–Fri 09:00–17:00 ET) ────────────────────────
-- Only seeds when the table is empty so re-running the migration is safe.
insert into public.availability (calendar, weekday, start_minute, end_minute, slot_minutes, tz)
select c.calendar, d.weekday, 540, 1020, 30, 'America/New_York'
from (values ('main'), ('contractor')) as c(calendar)
cross join (values (1), (2), (3), (4), (5)) as d(weekday)
where not exists (select 1 from public.availability);
