-- 0015_outbound_replies.sql
-- Reply desk for the outbound funnel (owner, 2026-11-02: "if they are interested or need a
-- reply an AI should email back; if it needs me, message me").
--
-- Every inbound reply and every outbound answer is a row in outbound_replies. Outbound rows
-- are written as 'ready' with a release_after in the future (human-looking hold, business
-- hours in the lead's time zone) and sent by the `reply-desk` fn on a pg_cron tick —
-- same hold-then-release pattern as site_edits.

-- prospects: wider intent set + reply-desk bookkeeping
alter table public.prospects drop constraint if exists prospects_reply_sentiment_check;
alter table public.prospects
  add constraint prospects_reply_sentiment_check check (reply_sentiment in (
    'yes', 'question', 'objection_price', 'objection_timing', 'later',
    'no', 'remove', 'hostile', 'ooo_auto', 'unknown'
  ));

alter table public.prospects
  add column if not exists ai_turns          int not null default 0,  -- outbound answers sent by the desk
  add column if not exists handoff_at        timestamptz,             -- set when a human is needed; AI silent until cleared
  add column if not exists followup_at       timestamptz,             -- "later" → one re-touch due at this time
  add column if not exists followup_sent_at  timestamptz,
  add column if not exists nudge_count       int not null default 0;  -- viewed-but-silent nudges sent (max 2)

create table if not exists public.outbound_replies (
  id                 uuid primary key default gen_random_uuid(),
  prospect_id        uuid not null references public.prospects(id) on delete cascade,
  direction          text not null check (direction in ('in', 'out')),
  kind               text not null default 'reply'
                     check (kind in ('reply', 'demo_link', 'followup', 'nudge')),
  instantly_email_id text unique,            -- inbound: Instantly email uuid (idempotency key)
  reply_to_email_id  text,                   -- outbound: the Instantly uuid this answers (reply_to_uuid)
  eaccount           text,                   -- the inbox that received it / must send the answer
  subject            text,
  body               text not null,
  intent             text,
  confidence         numeric,
  needs_human        boolean not null default false,
  reason             text,
  raw                jsonb,                  -- full classifier output for audit
  status             text not null check (status in (
                       'queued', 'ready', 'sending', 'sent', 'needs_human',
                       'suppressed', 'cancelled', 'failed', 'answered', 'ignored'
                     )),
  release_after      timestamptz,
  sent_at            timestamptz,
  error              text,
  created_at         timestamptz not null default now()
);

-- one live outbound answer per inbound message
create unique index if not exists outbound_replies_one_out_idx
  on public.outbound_replies (reply_to_email_id)
  where direction = 'out' and status not in ('cancelled', 'failed');

create index if not exists outbound_replies_release_idx
  on public.outbound_replies (release_after) where status = 'ready';

create index if not exists outbound_replies_prospect_idx
  on public.outbound_replies (prospect_id, created_at desc);

alter table public.outbound_replies enable row level security;
-- service role only (admin-data reads it with the service key); no anon policies.
