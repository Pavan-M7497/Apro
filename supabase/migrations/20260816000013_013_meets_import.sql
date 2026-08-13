create table if not exists meets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  level text not null,
  state_code text references indian_states(code),
  city text,
  start_date date,
  end_date date,
  course text check (course in ('SCM','LCM','NA')),
  source_note text,
  imported_at timestamptz default now()
);

-- Placeholder athletes created from results, not yet claimed
alter table profiles add column if not exists is_claimed boolean default true;
alter table profiles add column if not exists claim_token text;

create table if not exists import_batches (
  id uuid default gen_random_uuid() primary key,
  meet_id uuid references meets(id) on delete cascade,
  row_count integer default 0,
  matched_count integer default 0,
  created_count integer default 0,
  ambiguous_count integer default 0,
  status text default 'draft' check (status in ('draft','review','committed')),
  created_at timestamptz default now()
);

create table if not exists import_rows (
  id uuid default gen_random_uuid() primary key,
  batch_id uuid references import_batches(id) on delete cascade,
  raw_name text not null,
  raw_club text,
  raw_dob text,
  event text,
  course text,
  result_seconds numeric(8,2),
  total_score numeric(6,2),
  discipline text,
  matched_profile_id uuid references profiles(id),
  match_confidence numeric(4,3),
  action text default 'pending' check (action in ('pending','match','create','skip')),
  created_at timestamptz default now()
);

alter table meets enable row level security;
create policy "meets_read" on meets for select using (true);
alter table import_batches enable row level security;
alter table import_rows enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- Required for the import flow to function. Without the changes below the
-- feature cannot work at all:
--   1. profiles.user_id is NOT NULL and references auth.users, so a
--      placeholder athlete with no account cannot be inserted.
--   2. import_batches / import_rows have RLS on but no policies, which
--      denies every read and write.
--   3. The existing profiles/athlete_profiles/results policies all require
--      auth.uid() = the row owner, which blocks both writing placeholder
--      rows and claiming them later.
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Placeholder profiles have no auth user until they are claimed.
alter table profiles alter column user_id drop not null;

-- 2. Import staging is operator-only working data.
create policy "import_batches_rw" on import_batches for all
  to authenticated using (true) with check (true);
create policy "import_rows_rw" on import_rows for all
  to authenticated using (true) with check (true);
create policy "meets_write" on meets for all
  to authenticated using (true) with check (true);

-- 3a. Allow inserting unclaimed placeholder athletes.
create policy "profiles_insert_unclaimed" on profiles for insert
  to authenticated
  with check (user_id is null and is_claimed = false);

-- 3b. Allow an athlete to claim an unclaimed profile by taking ownership.
create policy "profiles_claim_unclaimed" on profiles for update
  to authenticated
  using (user_id is null and is_claimed = false)
  with check (auth.uid() = user_id);

-- 3c. Placeholder athlete rows and their imported results.
create policy "athlete_profiles_insert_unclaimed" on athlete_profiles for insert
  to authenticated
  with check (
    exists (select 1 from profiles p where p.id = profile_id and p.is_claimed = false)
  );

create policy "perf_insert_import" on performance_records for insert
  to authenticated
  with check (
    exists (select 1 from profiles p where p.id = profile_id and p.is_claimed = false)
  );

create policy "diving_insert_import" on diving_results for insert
  to authenticated
  with check (
    exists (select 1 from profiles p where p.id = profile_id and p.is_claimed = false)
  );

create index if not exists import_rows_batch_idx on import_rows(batch_id);
create index if not exists profiles_unclaimed_idx on profiles(is_claimed) where is_claimed = false;
create index if not exists meets_listing_idx on meets(start_date desc, state_code, level);
