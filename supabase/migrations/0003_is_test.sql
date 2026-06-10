-- Test-mode flagging: test bookings/events are stored (for end-to-end checks)
-- but excluded from all live admin stats and badged in admin lists.
-- (No backfill: historical test sends aren't identifiable.)

alter table public.appointments
  add column if not exists is_test boolean not null default false;

alter table public.capi_events
  add column if not exists is_test boolean not null default false;
