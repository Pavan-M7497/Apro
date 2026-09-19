/*
# 016 — Private contact details and account deletion

1. `profiles.phone` — account recovery only, never public.
2. `profiles` stops being readable column-by-column by anyone. It has been
   `FOR SELECT USING (true)` since 001, so a bare `select('*')` hands out every
   column — which now includes a phone number, a guardian's email, and the
   claim token that protects an unclaimed child's profile.
3. Account deletion, which is a right under the DPDP Act, not a feature.
*/

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Phone number
-- ─────────────────────────────────────────────────────────────────────────

alter table profiles add column if not exists phone text;

comment on column profiles.phone is
  'Account recovery only. Never rendered on any profile, and not readable by other users — see the column grant below.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Only the public columns of `profiles` are public
--
-- Excluded, and why:
--   phone            - contact detail, recovery only
--   parent_name      - a third party's name (a child's guardian)
--   parent_email     - a third party's email
--   consent_given_at - reveals that an account belongs to a minor
--   claim_token      - the secret that lets someone claim an unclaimed profile
--   sfi_id           - half of the claim check; see claim_matches() below
--
-- As in 015, a column-level REVOKE is a no-op while the role holds table-level
-- SELECT, so the table grant goes and the readable columns are named.
-- service_role and postgres are untouched.
-- ─────────────────────────────────────────────────────────────────────────

revoke select on profiles from anon, authenticated;
grant select (
  id, user_id, username, full_name, avatar_url, cover_url, bio,
  country, state_code, city, club_id, gender, role,
  state_assoc_id, verification_tier, verified_at, is_claimed,
  profile_visibility, allow_messages_from,
  created_at, updated_at
) on profiles to anon, authenticated;

-- Owners read their own withheld fields back for the profile editor.
create or replace function my_contact()
returns table (phone text, sfi_id text, parent_name text, parent_email text)
language sql
security definer
set search_path = public
as $$
  select p.phone, p.sfi_id, p.parent_name, p.parent_email
  from profiles p
  where p.user_id = auth.uid();
$$;

revoke all on function my_contact() from public, anon;
grant execute on function my_contact() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. The claim check moves fully server-side
--
-- 015 stopped the browser downloading the target's date of birth, but the claim
-- flow also compared `sfi_id` client-side, so the other half of the gate was
-- still readable and the whole check bypassable. Both halves are compared here
-- now and only a boolean comes back. Replaces claim_dob_matches().
-- ─────────────────────────────────────────────────────────────────────────

create or replace function claim_matches(
  target_profile uuid,
  candidate_dob  date,
  candidate_sfi  text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles p
    left join athlete_profiles ap on ap.profile_id = p.id
    where p.id = target_profile
      and p.is_claimed = false
      and (
        (candidate_dob is not null and ap.date_of_birth is not null
          and ap.date_of_birth = candidate_dob)
        or
        (candidate_sfi is not null and btrim(candidate_sfi) <> '' and p.sfi_id is not null
          and lower(btrim(candidate_sfi)) = lower(btrim(p.sfi_id)))
      )
  );
$$;

-- Does this profile have anything to check a claim against? Without this the
-- client cannot tell "wrong answer" from "nothing on file", and the latter has
-- to go to manual review rather than be refused.
create or replace function claim_is_checkable(target_profile uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles p
    left join athlete_profiles ap on ap.profile_id = p.id
    where p.id = target_profile
      and (ap.date_of_birth is not null or p.sfi_id is not null)
  );
$$;

revoke all on function claim_matches(uuid, date, text) from public, anon;
revoke all on function claim_is_checkable(uuid)        from public, anon;
grant execute on function claim_matches(uuid, date, text) to authenticated;
grant execute on function claim_is_checkable(uuid)        to authenticated;

drop function if exists claim_dob_matches(uuid, date);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Make deletion actually possible
--
-- Four foreign keys point at profiles with no delete action, so any attempt to
-- delete an account raises a constraint violation. Their rows are either the
-- user's own data (cascade) or content that outlives the account (set null).
-- ─────────────────────────────────────────────────────────────────────────

do $$ begin
  if to_regclass('public.apro_scores') is not null then
    alter table apro_scores drop constraint if exists apro_scores_profile_id_fkey;
    alter table apro_scores add constraint apro_scores_profile_id_fkey
      foreign key (profile_id) references profiles(id) on delete cascade;
  end if;
end $$;

do $$ begin
  if to_regclass('public.sports_list') is not null then
    alter table sports_list drop constraint if exists sports_list_created_by_fkey;
    alter table sports_list add constraint sports_list_created_by_fkey
      foreign key (created_by) references profiles(id) on delete set null;
  end if;
end $$;

do $$ begin
  if to_regclass('public.competitions') is not null then
    alter table competitions drop constraint if exists competitions_submitted_by_fkey;
    alter table competitions add constraint competitions_submitted_by_fkey
      foreign key (submitted_by) references profiles(id) on delete set null;
  end if;
end $$;

do $$ begin
  if to_regclass('public.import_rows') is not null then
    alter table import_rows drop constraint if exists import_rows_matched_profile_id_fkey;
    alter table import_rows add constraint import_rows_matched_profile_id_fkey
      foreign key (matched_profile_id) references profiles(id) on delete set null;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Delete my account
--
-- Deleting the auth.users row cascades to profiles, and profiles cascades to
-- athlete_profiles, highlights, achievements, results, training, conversations,
-- messages, follows, blocks and reports. Uploaded files live in storage, which
-- no foreign key reaches, so they are removed explicitly first:
--   avatars/covers  are keyed by profile id
--   highlights      are keyed by auth user id
-- ─────────────────────────────────────────────────────────────────────────

create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me         uuid := auth.uid();
  my_profile uuid;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  select id into my_profile from profiles where user_id = me;

  delete from storage.objects
   where bucket_id in ('avatars', 'covers')
     and my_profile is not null
     and name like my_profile::text || '/%';

  delete from storage.objects
   where bucket_id = 'highlights'
     and name like me::text || '/%';

  -- Cascades through profiles and everything hanging off it.
  delete from auth.users where id = me;
end;
$$;

revoke all on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;
