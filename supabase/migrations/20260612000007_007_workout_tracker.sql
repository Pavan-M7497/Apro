create table if not exists training_sessions (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  activity_type text not null check (activity_type in ('running','cycling','swimming','gym','team_sport','general')),
  session_date date not null default current_date,
  duration_minutes integer not null check (duration_minutes > 0),
  intensity_rpe integer check (intensity_rpe >= 1 and intensity_rpe <= 10),
  notes text,
  is_public boolean default true,
  created_at timestamptz default now()
);

create table if not exists run_data (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references training_sessions(id) on delete cascade unique not null,
  distance_km decimal(6,2),
  pace_seconds_per_km integer,
  elevation_m integer
);

create table if not exists swim_data (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references training_sessions(id) on delete cascade unique not null,
  pool_length_m integer default 50,
  laps integer,
  total_distance_m integer,
  stroke_type text
);

create table if not exists strength_sets (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references training_sessions(id) on delete cascade not null,
  exercise_name text not null,
  set_number integer not null,
  reps integer,
  weight_kg decimal(5,2)
);

alter table training_sessions enable row level security;
alter table run_data enable row level security;
alter table swim_data enable row level security;
alter table strength_sets enable row level security;

create policy "training_read_public" on training_sessions for select using (is_public = true or auth.uid() = (select user_id from profiles where id = profile_id));
create policy "training_insert_own" on training_sessions for insert with check (auth.uid() = (select user_id from profiles where id = profile_id));
create policy "training_update_own" on training_sessions for update using (auth.uid() = (select user_id from profiles where id = profile_id));
create policy "training_delete_own" on training_sessions for delete using (auth.uid() = (select user_id from profiles where id = profile_id));

create policy "run_data_all" on run_data for all using (true);
create policy "swim_data_all" on swim_data for all using (true);
create policy "strength_sets_all" on strength_sets for all using (true);

create index on training_sessions(profile_id, session_date desc);
create index on strength_sets(session_id);
