-- Results, attribution snapshot, and GHL messaging visibility.
--
-- Adds: (1) an attribution snapshot on each appointment so later events
-- (CompleteRegistration / Purchase) can be sent to Meta with the SAME ip/ua/
-- url/utm/fbc/fbp as the original Lead; (2) result fields (upfront + recurring
-- $, plan, notes) captured by the admin result form; (3) a ghl_messages log so
-- the dashboard can show that GHL's confirmation/reminder messaging is firing.

-- ── appointments: attribution snapshot + result fields ────────────────────────
alter table public.appointments
  add column if not exists client_ip          text,
  add column if not exists client_user_agent  text,
  add column if not exists event_source_url   text,
  add column if not exists utm                jsonb,
  add column if not exists upfront_value      numeric(10,2),
  add column if not exists recurring_value    numeric(10,2),
  add column if not exists recurring_interval text,   -- monthly | annual | one_time
  add column if not exists plan_name          text,
  add column if not exists purchased_at       timestamptz,
  add column if not exists result_notes       text,
  add column if not exists resulted_at        timestamptz,
  add column if not exists resulted_by        text;   -- admin email who resulted it

-- ── ghl_messages: visibility into the kept GHL messaging workflow ──────────────
-- Populated by the `ghl-webhook` Edge Function, which a GHL workflow "Webhook"
-- action POSTs to each time it sends a confirmation/reminder/etc.
create table if not exists public.ghl_messages (
  id             uuid primary key default gen_random_uuid(),
  ghl_contact_id text,
  contact_id     uuid references public.contacts(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  channel        text,   -- email | sms | call | other
  message_type   text,   -- confirmation | reminder | no_show | follow_up | other
  status         text,   -- sent | delivered | failed | ...
  detail         jsonb,
  received_at    timestamptz not null default now()
);
create index if not exists ghl_messages_received_idx on public.ghl_messages (received_at desc);

alter table public.ghl_messages enable row level security;  -- service-role only
