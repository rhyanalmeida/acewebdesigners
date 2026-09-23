-- 0011_prospect_auto_reply.sql
-- Fully automated reply → build → send-link loop for the outbound funnel (owner
-- decision 2026-09-22: "I want it to send the design if they say yes").
--
-- The poller (scripts/instantly-poll.mjs) forwards each reply WITH its text; the
-- instantly-webhook fn classifies it (scripts/lib/reply-classifier.mjs mirrored in
-- _shared/replyClassifier.ts), stores it here, and on a clear "yes" fires the one
-- demo build. When generate-site marks the row deployed, the next poll tick sends
-- the /demo/<token> link as an in-thread reply from the same inbox and stamps
-- demo_link_sent_at, so the link is sent exactly once.

alter table public.prospects
  add column if not exists last_reply        text,
  add column if not exists last_reply_at     timestamptz,
  add column if not exists reply_sentiment   text check (reply_sentiment in ('yes', 'no', 'unknown')),
  add column if not exists reply_email_id    text,        -- Instantly email uuid to reply to (reply_to_uuid)
  add column if not exists reply_eaccount    text,        -- the inbox that received it (must send the reply)
  add column if not exists reply_subject     text,
  add column if not exists auto_send         boolean not null default false,
  add column if not exists demo_link_sent_at timestamptz;

create index if not exists prospects_auto_send_idx
  on public.prospects (auto_send) where auto_send and demo_link_sent_at is null;
