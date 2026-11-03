-- Own-domain checkout (2026-11-03). Every emailable prospect already has a website and
-- therefore a domain; forcing a second .com on them was the last human step in the funnel
-- ("email us before you check out"). Now checkout offers "I already have a domain":
--   domain_mode 'register' → Porkbun registers + sets DNS (unchanged path)
--   domain_mode 'own'      → we attach the domain to the Netlify site and wait for the
--                            customer's DNS (status 'awaiting_dns'); hourly recheck → 'live'.
alter table public.prospects
  add column if not exists domain_mode text not null default 'register'
    check (domain_mode in ('register', 'own'));

alter table public.prospects drop constraint if exists prospects_domain_status_check;
alter table public.prospects
  add constraint prospects_domain_status_check
  check (domain_status in ('none', 'registering', 'dns_set', 'attached', 'awaiting_dns',
                           'ssl_pending', 'live', 'failed', 'cancelled'));
