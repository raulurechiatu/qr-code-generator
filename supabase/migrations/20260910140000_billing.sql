-- Stripe billing: one-time lifetime "Pro" upgrade.

alter table profiles add column upgraded_at timestamptz;

-- Records processed Stripe webhook event ids so retried deliveries
-- don't double-apply an upgrade. Only ever touched by the webhook
-- function's service-role client, never by anon/authenticated clients.
create table stripe_events (
  id text primary key,
  processed_at timestamptz not null default now()
);
