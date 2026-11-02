-- 0012_site_edits.sql
-- Post-purchase change requests for the outbound demo funnel (owner, 2026-11-02:
-- customers get a page where they "send us" a change + photos; the edit is applied
-- automatically and the copy never says who or what does it).
--
-- `site-edit` fn: {token, action:'request'} inserts a row (photos → storage bucket
-- `site-assets`, public URLs in photo_urls), then applies it to the live Netlify site
-- and stamps applied_at. {token, action:'list'} drives the customer's status list.

create table if not exists public.site_edits (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid not null references public.prospects (id) on delete cascade,
  request       text not null,
  photo_urls    jsonb not null default '[]'::jsonb,
  status        text not null default 'queued' check (status in ('queued', 'applying', 'applied', 'failed')),
  error         text,
  created_at    timestamptz not null default now(),
  applied_at    timestamptz
);

create index if not exists site_edits_prospect_idx on public.site_edits (prospect_id, created_at desc);

alter table public.site_edits enable row level security; -- service role only; no public policies

-- Public-read bucket for customer-supplied photos placed on their site.
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;
