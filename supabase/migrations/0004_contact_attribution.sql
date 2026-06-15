-- Durable attribution on the lead record.
--
-- Until now fbc/fbp/fbclid lived on contacts, but ip/ua/url/utm lived ONLY on
-- appointments (the 0002 snapshot). The funnel now fires `Lead` at the gate-form
-- step — BEFORE an appointment exists — so attribution must persist on the
-- contact itself, or a lead who never books loses it. These columns make the
-- contact the durable attribution record; appointments keep their own snapshot
-- for per-booking point-in-time. The `utm` jsonb also carries the Facebook
-- ad/adset/campaign ids (fb_ad_id / fb_adset_id / fb_campaign_id) when the ad's
-- URL parameters are configured in Ads Manager.

alter table public.contacts
  add column if not exists client_ip          text,
  add column if not exists client_user_agent  text,
  add column if not exists landing_url         text,
  add column if not exists utm                 jsonb;
