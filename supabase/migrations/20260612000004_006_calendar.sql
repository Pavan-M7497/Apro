-- Feature 8: Competition calendar
create table if not exists competitions (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  sport text not null,
  country text not null,
  city text not null,
  start_date date not null,
  end_date date not null,
  level text not null check (level in ('local','regional','national','continental','world')),
  description text,
  registration_url text,
  stream_url text,
  submitted_by uuid references profiles(id),
  is_verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists competition_participants (
  competition_id uuid references competitions(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (competition_id, profile_id),
  created_at timestamptz default now()
);

alter table competitions enable row level security;
alter table competition_participants enable row level security;

create policy "competitions_read" on competitions for select using (true);
create policy "competitions_insert" on competitions for insert with check (auth.uid() is not null);
create policy "competitions_update" on competitions for update using (
  auth.uid() = (select user_id from profiles where id = submitted_by)
);

create policy "participants_read" on competition_participants for select using (true);
create policy "participants_insert" on competition_participants for insert with check (auth.uid() is not null);
create policy "participants_delete" on competition_participants for delete using (
  auth.uid() = (select user_id from profiles where id = profile_id)
);
