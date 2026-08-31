-- 0010_prospects.sql
-- Outbound cold-email funnel: scraped businesses → personalized /demo/<token>
-- page → on-click preview-site build → Stripe subscription → automated domain
-- purchase + go-live. Prospects are NOT contacts/appointments: no booking, no
-- Meta CAPI, and the appointments slot constraints make faking one per prospect
-- impossible. Site columns deliberately mirror appointments' names so
-- generate-site's subject adapter stays trivial.

-- gen_random_bytes lives in pgcrypto (gen_random_uuid is core, the bytes fn is not).
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.prospects (
  id                      uuid primary key default gen_random_uuid(),
  -- capability token: the ONLY key the public demo page ever sees/sends.
  token                   text unique not null default encode(extensions.gen_random_bytes(16), 'hex'),
  -- scraped identity
  business_name           text not null,
  business_type           text,               -- trade slug (matches design_systems / niche_playbooks matcher)
  first_name              text,
  last_name               text,
  email                   text,
  phone                   text,
  city                    text,
  state                   text,
  zip                     text,
  website                 text,               -- existing site if any (scrape signal)
  gmaps_place_id          text unique,        -- dedupe key across re-imports
  rating                  numeric,
  review_count            integer,
  source                  text not null default 'csv',
  batch                   text,               -- import batch label
  is_test                 boolean not null default false,
  -- compliance
  suppressed              boolean not null default false,
  suppressed_reason       text,               -- 'unsubscribe' | 'bounce' | 'manual'
  -- demo site (names mirror appointments; 'none' = not yet requested)
  site_status             text not null default 'none'
                          check (site_status in ('none', 'generating', 'deployed', 'failed')),
  site_error              text,
  netlify_site_id         text,
  preview_url             text,
  site_generated_at       timestamptz,
  demo_first_viewed_at    timestamptz,
  demo_view_count         integer not null default 0,
  -- purchase / provisioning
  plan                    text,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,        -- webhook idempotency stamp
  chosen_domain           text,
  domain_status           text not null default 'none'
                          check (domain_status in ('none', 'registering', 'dns_set', 'attached',
                                                   'ssl_pending', 'live', 'failed', 'cancelled')),
  domain_error            text,
  purchased_at            timestamptz,
  cancelled_at            timestamptz,
  ghl_contact_id          text,
  -- instantly (cold-email tool; sends happen there, not in GHL)
  instantly_campaign_id   text,
  emailed_at              timestamptz,
  replied_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists prospects_site_status_idx on public.prospects (site_status);
create index if not exists prospects_email_idx on public.prospects (lower(email));

-- Service-role only (Edge Functions); no client policies — matches existing convention.
alter table public.prospects enable row level security;

-- CAN-SPAM suppression list: source of truth that survives prospect deletion and
-- re-imports. Written by instantly-webhook (unsubscribe/bounce); enforced by
-- scripts/import-prospects.mjs and scripts/export-instantly.mjs.
create table if not exists public.suppressions (
  email       text primary key,
  reason      text not null,                  -- 'unsubscribe' | 'bounce' | 'manual'
  created_at  timestamptz not null default now()
);
alter table public.suppressions enable row level security;
