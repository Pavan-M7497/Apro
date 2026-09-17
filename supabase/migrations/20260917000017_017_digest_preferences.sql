/*
# 017 — Email digest preferences

Web push is unreliable, especially on iOS, so reminders happen two other ways:
the athlete exports a meet to their own calendar (handled client-side, no schema
needed), and we send a weekly email.

Both preferences default to true. That is deliberate for a digest the user can
turn off in one click, but see the note at the bottom about under-18 accounts.
*/

alter table profiles
  add column if not exists digest_weekly boolean not null default true,
  add column if not exists digest_meets  boolean not null default true;

comment on column profiles.digest_weekly is
  'Weekly summary of profile views and new personal bests.';
comment on column profiles.digest_meets is
  'Upcoming meets in the athlete''s state, included in the same weekly email.';

-- Migration 016 replaced the table-level SELECT grant on profiles with an
-- explicit column list, so a new column is unreadable until it is named here.
-- These two are not sensitive: they are the user's own switches, and showing
-- them in the editor requires reading them back.
grant select (digest_weekly, digest_meets) on profiles to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Index for the digest query
--
-- buildWeeklyDigest counts a week of profile views per athlete. Without this,
-- a nightly job over the whole user base is a sequential scan per athlete.
-- ─────────────────────────────────────────────────────────────────────────

create index if not exists profile_views_profile_created_idx
  on profile_views (profile_id, created_at desc);

create index if not exists meets_state_start_idx
  on meets (state_code, start_date);

/*
  NOTE for whoever wires up sending.

  1. Nothing here sends anything, and nothing here records that a send happened.
     Before the first real send you need a `digest_sends` table (profile_id,
     sent_at) or an equivalent, or a retry will mail people twice. The "at most
     once a week" promise in the UI is currently enforced by nothing.

  2. Under-18 accounts. The DPDP Act treats a child's data with more care than
     an adult's, and an emailed digest saying who has been looking at a child's
     profile is exactly the sort of thing a guardian should know about. Consider
     defaulting these to false for minors, or copying the guardian address, or
     both. That is a product decision, so it is flagged rather than assumed.

  3. Sending needs the service role: profile_views is only readable by the
     profile's owner, by design.
*/
