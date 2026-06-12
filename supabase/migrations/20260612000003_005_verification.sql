-- Feature 6: Verification tiers
alter table profiles add column if not exists verification_tier integer default 0;
alter table achievements add column if not exists verified boolean default false;
alter table achievements add column if not exists verification_status text default 'unverified'
  check (verification_status in ('unverified','pending','verified','rejected'));
alter table achievements add column if not exists proof_url text;

create table if not exists achievement_flags (
  id uuid default gen_random_uuid() primary key,
  achievement_id uuid references achievements(id) on delete cascade,
  reporter_id uuid references profiles(id) on delete cascade,
  reason text,
  created_at timestamptz default now(),
  unique(achievement_id, reporter_id)
);

alter table achievement_flags enable row level security;
create policy "flags_read" on achievement_flags for select using (true);
create policy "flags_insert" on achievement_flags for insert with check (auth.uid() is not null);
