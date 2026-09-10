-- Core schema for dynamic QR codes, scan analytics, and the developer API.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan_tier text not null default 'free',
  created_at timestamptz not null default now()
);

create table qr_codes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  short_id text not null unique,
  destination_url text not null,
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index qr_codes_owner_id_idx on qr_codes (owner_id);
create index qr_codes_short_id_idx on qr_codes (short_id);

create table scans (
  id bigint generated always as identity primary key,
  qr_code_id uuid not null references qr_codes(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  user_agent text,
  device_type text,
  browser text,
  referrer text,
  country text,
  ip_hash text
);
create index scans_qr_code_id_scanned_at_idx on scans (qr_code_id, scanned_at desc);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text,
  key_hash text not null unique,
  key_prefix text not null,
  is_active boolean not null default true,
  rate_limit_per_minute int not null default 60,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index api_keys_key_hash_idx on api_keys (key_hash);

create table api_usage (
  id bigint generated always as identity primary key,
  api_key_id uuid not null references api_keys(id) on delete cascade,
  endpoint text not null,
  occurred_at timestamptz not null default now(),
  status_code int
);
create index api_usage_api_key_id_occurred_at_idx on api_usage (api_key_id, occurred_at desc);

-- Row Level Security

alter table profiles enable row level security;
alter table qr_codes enable row level security;
alter table scans enable row level security;
alter table api_keys enable row level security;
alter table api_usage enable row level security;

create policy "profiles are self-readable" on profiles
  for select using (auth.uid() = id);
create policy "profiles are self-updatable" on profiles
  for update using (auth.uid() = id);

create policy "qr_codes are owner-readable" on qr_codes
  for select using (auth.uid() = owner_id);
create policy "qr_codes are owner-insertable" on qr_codes
  for insert with check (auth.uid() = owner_id);
create policy "qr_codes are owner-updatable" on qr_codes
  for update using (auth.uid() = owner_id);
create policy "qr_codes are owner-deletable" on qr_codes
  for delete using (auth.uid() = owner_id);

-- scans are never written by client roles: only the redirect Edge Function
-- (service role, which bypasses RLS) inserts rows. Owners can only read.
create policy "scans are owner-readable via qr_codes" on scans
  for select using (
    exists (
      select 1 from qr_codes
      where qr_codes.id = scans.qr_code_id
      and qr_codes.owner_id = auth.uid()
    )
  );

create policy "api_keys are owner-readable" on api_keys
  for select using (auth.uid() = owner_id);
create policy "api_keys are owner-insertable" on api_keys
  for insert with check (auth.uid() = owner_id);
create policy "api_keys are owner-updatable" on api_keys
  for update using (auth.uid() = owner_id);
create policy "api_keys are owner-deletable" on api_keys
  for delete using (auth.uid() = owner_id);

create policy "api_usage is owner-readable via api_keys" on api_usage
  for select using (
    exists (
      select 1 from api_keys
      where api_keys.id = api_usage.api_key_id
      and api_keys.owner_id = auth.uid()
    )
  );

-- Auto-create a profile row when a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
