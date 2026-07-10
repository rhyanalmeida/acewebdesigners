-- Harden double-booking prevention: replace the exact-start unique index with a
-- true range-overlap exclusion constraint.
--
-- Before: `appointments_slot_uniq` was UNIQUE (calendar, start_ts) — it only
-- blocked two bookings with the SAME start. A booking with a different start but
-- an overlapping range (e.g. a client-supplied 10:00–11:00 over a 30-min grid,
-- or a future mix of slot lengths) slipped through. `book` already recomputes
-- end_ts server-side now, but this is the hard DB-level backstop against races
-- and bad input.
--
-- After: no two non-cancelled appointments on the same calendar may have
-- overlapping [start_ts, end_ts) ranges. tstzrange defaults to '[)' (inclusive
-- start, exclusive end), so adjacent slots (9:00–9:30 and 9:30–10:00) do NOT
-- count as overlapping — exactly the booking semantics we want.
--
-- NOTE: an exclusion-constraint violation raises SQLSTATE 23P01 (not 23505).
-- `book` catches both and returns 409.

-- gist indexes over a scalar equality (calendar) + a range (&&) need btree_gist.
create extension if not exists btree_gist;

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    calendar with =,
    tstzrange(start_ts, end_ts) with &&
  ) where (status <> 'cancelled');

-- The old exact-start guard is now subsumed by the overlap constraint.
drop index if exists public.appointments_slot_uniq;
