create extension if not exists pgcrypto;

create table if not exists public.fsae_data_tickets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'resolved', 'rejected')),
  competition text check (char_length(competition) between 1 and 100),
  year smallint check (year between 1980 and 2100),
  team text check (char_length(team) between 1 and 160),
  event_name text check (char_length(event_name) between 1 and 80),
  displayed_value text,
  expected_value text,
  source_reference text,
  description text not null check (char_length(description) between 10 and 3000),
  reporter_email text not null check (char_length(reporter_email) between 3 and 254),
  page_url text,
  ip_hash text,
  email_delivery_status text not null default 'pending'
    check (email_delivery_status in ('pending', 'sent', 'failed', 'not_configured')),
  email_provider_id text,
  email_error text
);

alter table public.fsae_data_tickets enable row level security;

revoke all on table public.fsae_data_tickets from anon, authenticated;

create index if not exists fsae_data_tickets_created_at_idx
  on public.fsae_data_tickets (created_at desc);

create index if not exists fsae_data_tickets_ip_rate_limit_idx
  on public.fsae_data_tickets (ip_hash, created_at desc)
  where ip_hash is not null;

comment on table public.fsae_data_tickets is
  'Publicly submitted FSAE result correction reports. Browser roles have no direct access; the submit-fsae-ticket Edge Function writes through the service role.';
