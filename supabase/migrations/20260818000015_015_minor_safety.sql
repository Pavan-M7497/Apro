/*
# 015 — Minor safety

Most Apro athletes are 10–17. This migration makes the platform safe-by-default
for them and moves the enforcement OUT of the UI and into the database, because
anyone holding the anon key can call PostgREST directly — a client-side check is
a suggestion, not a protection.

1. Guardian consent + privacy columns on `profiles`.
2. `reports` and `blocks` tables.
3. Exact dates of birth stop being world-readable (they are today).
4. Messaging is gated in RLS, not just in the client.
5. `handle_new_user` persists the fields registration already sends.
*/

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Guardian consent + privacy
-- ─────────────────────────────────────────────────────────────────────────

alter table profiles
  add column if not exists parent_name         text,
  add column if not exists parent_email        text,
  add column if not exists consent_given_at    timestamptz,
  add column if not exists profile_visibility  text not null default 'public',
  add column if not exists allow_messages_from text not null default 'anyone';

do $$ begin
  alter table profiles add constraint profiles_visibility_check
    check (profile_visibility in ('public', 'limited'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table profiles add constraint profiles_allow_messages_check
    check (allow_messages_from in ('anyone', 'verified', 'nobody'));
exception when duplicate_object then null; end $$;

comment on column profiles.profile_visibility is
  'limited = city, contact details and exact DOB are withheld from public view. Forced on for under-18 accounts.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Reports and blocks
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid references profiles(id) on delete set null,
  reported_id     uuid not null references profiles(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  reason          text not null check (reason in ('impersonation', 'inappropriate_messages', 'fake_results', 'other')),
  detail          text check (char_length(detail) <= 2000),
  status          text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at      timestamptz default now()
);

create table if not exists blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references profiles(id) on delete cascade,
  blocked_id  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists reports_reported_idx on reports(reported_id, status);
create index if not exists blocks_blocker_idx   on blocks(blocker_id);
create index if not exists blocks_blocked_idx   on blocks(blocked_id);

alter table reports enable row level security;
alter table blocks  enable row level security;

-- A reporter may file a report and read their own. Nobody else can read reports:
-- the reported party must not learn who reported them, and no user should be
-- able to enumerate who has been reported. Moderators read via the service role,
-- which bypasses RLS.
drop policy if exists "file_report" on reports;
create policy "file_report" on reports for insert to authenticated with check (
  auth.uid() = (select user_id from profiles where id = reporter_id)
);

drop policy if exists "read_own_reports" on reports;
create policy "read_own_reports" on reports for select to authenticated using (
  auth.uid() = (select user_id from profiles where id = reporter_id)
);

-- Blocks are readable only by the person who created them. The blocked user is
-- deliberately NOT told they were blocked — revealing it invites retaliation,
-- which matters more when the blocker is a child. The "blocked in either
-- direction" check that messaging needs runs inside is_blocked() below, which is
-- SECURITY DEFINER and so sees both sides without exposing either.
drop policy if exists "manage_own_blocks" on blocks;
create policy "manage_own_blocks" on blocks for all to authenticated
  using (auth.uid() = (select user_id from profiles where id = blocker_id))
  with check (auth.uid() = (select user_id from profiles where id = blocker_id));

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Exact dates of birth are no longer world-readable
--
-- athlete_profiles has had `FOR SELECT USING (true)` since 001, so the exact
-- birth date of every child on the platform has been downloadable by anyone with
-- the anon key. Postgres RLS is row-level, so the fix is a column privilege:
-- revoke SELECT on the column and publish only the birth year, which is all the
-- age-group and leaderboard code actually needs.
-- ─────────────────────────────────────────────────────────────────────────

alter table athlete_profiles
  add column if not exists birth_year integer
  generated always as (extract(year from date_of_birth)::integer) stored;

-- A column-level REVOKE is a no-op while the role still holds table-level
-- SELECT (Postgres just warns), so drop the table grant and re-grant the
-- readable columns explicitly. service_role and postgres are untouched and keep
-- full access for moderation and imports.
revoke select on athlete_profiles from anon, authenticated;
grant select (id, profile_id, sport, position, birth_year, availability)
  on athlete_profiles to anon, authenticated;

-- Owners still need their own date back for the profile editor.
create or replace function my_athlete_dob()
returns date
language sql
security definer
set search_path = public
as $$
  select ap.date_of_birth
  from athlete_profiles ap
  join profiles p on p.id = ap.profile_id
  where p.user_id = auth.uid();
$$;

-- The claim flow used to download the target's real DOB and compare it in the
-- browser, which handed an attacker the exact answer needed to claim a child's
-- profile. Compare server-side instead and return only a boolean.
create or replace function claim_dob_matches(target_profile uuid, candidate date)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from athlete_profiles ap
    join profiles p on p.id = ap.profile_id
    where ap.profile_id = target_profile
      and p.is_claimed = false
      and ap.date_of_birth is not null
      and ap.date_of_birth = candidate
  );
$$;

revoke all on function my_athlete_dob()              from public, anon;
revoke all on function claim_dob_matches(uuid, date) from public, anon;
grant execute on function my_athlete_dob()              to authenticated;
grant execute on function claim_dob_matches(uuid, date) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Messaging gate — enforced in RLS, not in the client
-- ─────────────────────────────────────────────────────────────────────────

create or replace function is_blocked(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

/*
  May `sender` open a conversation with `recipient`?

  - never, if either has blocked the other
  - 'nobody'   -> no unsolicited contact at all
  - 'verified' -> the sender must be result-verified (tier >= 3) or share a club
  - 'anyone'   -> allowed

  The recipient can always reply inside a thread that already exists; the gate is
  on reaching someone, not on answering them.
*/
create or replace function can_message(sender uuid, recipient uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  pref        text;
  sender_tier int;
  same_club   boolean;
begin
  if sender = recipient then return false; end if;
  if is_blocked(sender, recipient) then return false; end if;

  select allow_messages_from into pref from profiles where id = recipient;
  if pref is null    then return false; end if;
  if pref = 'nobody' then return false; end if;
  if pref = 'anyone' then return true;  end if;

  select coalesce(verification_tier, 0) into sender_tier from profiles where id = sender;

  select (s.club_id is not null and s.club_id = r.club_id)
    into same_club
    from profiles s, profiles r
   where s.id = sender and r.id = recipient;

  return sender_tier >= 3 or coalesce(same_club, false);
end;
$$;

revoke all on function can_message(uuid, uuid) from public, anon;
revoke all on function is_blocked(uuid, uuid)  from public, anon;
grant execute on function can_message(uuid, uuid) to authenticated;
grant execute on function is_blocked(uuid, uuid)  to authenticated;

-- Opening a conversation must clear the recipient's gate.
drop policy if exists "create_conversations" on conversations;
create policy "create_conversations" on conversations for insert to authenticated with check (
  auth.uid() = (select user_id from profiles where id = participant_a)
  and can_message(participant_a, participant_b)
);

-- Sending must clear a block in either direction, at any point in the thread.
drop policy if exists "send_messages" on messages;
create policy "send_messages" on messages for insert to authenticated with check (
  auth.uid() = (select user_id from profiles where id = sender_id)
  and exists (
    select 1 from conversations c
    where c.id = conversation_id
      and messages.sender_id in (c.participant_a, c.participant_b)
      and not is_blocked(c.participant_a, c.participant_b)
      -- (conversation_id below is the new message row's column)
  )
);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Signup carries consent through
--
-- handle_new_user has been dropping state_code and gender since 010 added them
-- to the registration form. It has to be replaced anyway to store consent, so it
-- picks those up at the same time.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger as $$
declare
  new_username   text;
  new_role       text;
  new_full_name  text;
  new_profile_id uuid;
  dob            date;
  minor          boolean;
begin
  new_role      := coalesce(NEW.raw_user_meta_data->>'role', 'athlete');
  new_full_name := coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  new_username  := lower(regexp_replace(new_full_name, '[^a-z0-9]', '', 'g')) || floor(random() * 999)::text;

  while exists (select 1 from profiles where username = new_username) loop
    new_username := lower(regexp_replace(new_full_name, '[^a-z0-9]', '', 'g')) || floor(random() * 9999)::text;
  end loop;

  dob := nullif(NEW.raw_user_meta_data->>'date_of_birth', '')::date;
  -- Age is computed here, from the stored date, rather than trusting a flag sent
  -- by the client.
  minor := dob is not null and dob > (current_date - interval '18 years');

  insert into profiles (
    user_id, username, full_name, country, role, state_code, gender,
    parent_name, parent_email, consent_given_at,
    profile_visibility, allow_messages_from
  )
  values (
    NEW.id,
    new_username,
    new_full_name,
    coalesce(NEW.raw_user_meta_data->>'country', 'India'),
    new_role,
    nullif(NEW.raw_user_meta_data->>'state_code', ''),
    nullif(NEW.raw_user_meta_data->>'gender', ''),
    case when minor then nullif(NEW.raw_user_meta_data->>'parent_name', '')  end,
    case when minor then nullif(NEW.raw_user_meta_data->>'parent_email', '') end,
    case when minor then now() end,
    case when minor then 'limited'  else 'public' end,
    case when minor then 'verified' else 'anyone' end
  )
  returning id into new_profile_id;

  if new_role = 'athlete' then
    insert into athlete_profiles (profile_id, sport, position, date_of_birth)
    values (
      new_profile_id,
      coalesce(NEW.raw_user_meta_data->>'sport', ''),
      coalesce(NEW.raw_user_meta_data->>'position', ''),
      dob
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. A minor can tighten their privacy but never loosen it
--
-- The UI disables the 'public' option for under-18s; this makes it true even if
-- the update is sent straight to PostgREST.
-- ─────────────────────────────────────────────────────────────────────────

create or replace function enforce_minor_privacy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dob date;
begin
  select date_of_birth into dob from athlete_profiles where profile_id = NEW.id;

  if dob is not null and dob > (current_date - interval '18 years') then
    if NEW.profile_visibility <> 'limited' then
      NEW.profile_visibility := 'limited';
    end if;
    if NEW.allow_messages_from = 'anyone' then
      NEW.allow_messages_from := 'verified';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_minor_privacy_trg on profiles;
create trigger enforce_minor_privacy_trg
  before insert or update of profile_visibility, allow_messages_from on profiles
  for each row execute function enforce_minor_privacy();

-- Back-fill: any existing under-18 account moves to the safe defaults.
update profiles p
   set profile_visibility  = 'limited',
       allow_messages_from = case when p.allow_messages_from = 'anyone' then 'verified' else p.allow_messages_from end
  from athlete_profiles ap
 where ap.profile_id = p.id
   and ap.date_of_birth is not null
   and ap.date_of_birth > (current_date - interval '18 years');
