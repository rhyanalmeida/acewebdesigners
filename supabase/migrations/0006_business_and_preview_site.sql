-- Business identity on contacts (captured at the gate form) + the auto-generated
-- preview website per booking (Opus 4.8 → Netlify; see functions/generate-site).

alter table public.contacts
  add column if not exists business_name text,
  add column if not exists business_type text;

alter table public.appointments
  add column if not exists preview_url       text,
  add column if not exists netlify_site_id   text,
  add column if not exists site_status       text
    check (site_status in ('queued','generating','deployed','failed','deleted')),
  add column if not exists site_error        text,
  add column if not exists site_generated_at timestamptz;
