alter table profiles add column if not exists sfi_id text;
alter table profiles add column if not exists state_assoc_id text;
alter table profiles add column if not exists verification_tier integer default 0
  check (verification_tier between 0 and 4);
alter table profiles add column if not exists verified_at timestamptz;

create table if not exists verification_requests (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  requested_tier integer not null,
  sfi_id text,
  document_url text,
  note text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  reviewer_note text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table verification_requests enable row level security;

create policy "vr_own_read" on verification_requests for select
  using (auth.uid() = (select user_id from profiles where id = profile_id));
create policy "vr_own_insert" on verification_requests for insert
  with check (auth.uid() = (select user_id from profiles where id = profile_id));

create index if not exists verification_requests_profile_idx
  on verification_requests(profile_id, created_at desc);

-- ── Tier 3 auto-promotion ────────────────────────────────────────────────
-- A result marked verified by an official import proves the athlete's
-- identity against a real meet, which is strictly stronger evidence than a
-- self-declared ID (tier 2). Tier 4 is set by hand, so never downgrade it.
-- SECURITY DEFINER: the importer updating results is not the profile owner,
-- and RLS on profiles would otherwise block the promotion.
create or replace function promote_verified_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
     set verification_tier = 3,
         verified_at = coalesce(verified_at, now())
   where id = new.profile_id
     and coalesce(verification_tier, 0) < 3;
  return new;
end;
$$;

drop trigger if exists perf_verified_promote on performance_records;
create trigger perf_verified_promote
  after insert or update of verified on performance_records
  for each row
  when (new.verified = true)
  execute function promote_verified_tier();

drop trigger if exists diving_verified_promote on diving_results;
create trigger diving_verified_promote
  after insert or update of verified on diving_results
  for each row
  when (new.verified = true)
  execute function promote_verified_tier();
