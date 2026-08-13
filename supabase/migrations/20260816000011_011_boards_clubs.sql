-- Age groups, editable rather than hardcoded
create table if not exists age_groups (
  id uuid default gen_random_uuid() primary key,
  discipline text not null,
  label text not null,
  min_age integer not null,
  max_age integer,
  sort_order integer not null default 0
);

-- Diving results
create table if not exists diving_results (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  event text not null,
  total_score numeric(6,2) not null check (total_score >= 0),
  dive_count integer,
  average_dd numeric(4,2),
  meet_name text,
  meet_level text,
  meet_date date,
  is_personal_best boolean default false,
  verified boolean default false,
  created_at timestamptz default now()
);

-- Water polo goalkeeper support
alter table waterpolo_stats add column if not exists goals_conceded integer default 0;
alter table waterpolo_stats add column if not exists is_goalkeeper boolean default false;

-- Clubs
create table if not exists clubs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  short_name text,
  state_code text references indian_states(code),
  city text,
  created_at timestamptz default now()
);
alter table profiles add column if not exists club_id uuid references clubs(id);
alter table profiles add column if not exists gender text check (gender in ('male','female','other'));

-- World Aquatics base times for points calculation
create table if not exists base_times (
  id uuid default gen_random_uuid() primary key,
  event text not null,
  course text not null check (course in ('SCM','LCM')),
  gender text not null check (gender in ('male','female')),
  base_seconds numeric(8,2) not null,
  season_year integer not null,
  unique(event, course, gender, season_year)
);

alter table age_groups enable row level security;
alter table diving_results enable row level security;
alter table clubs enable row level security;
alter table base_times enable row level security;

create policy "ag_read" on age_groups for select using (true);
create policy "bt_read" on base_times for select using (true);
create policy "clubs_read" on clubs for select using (true);
create policy "diving_read" on diving_results for select using (true);
create policy "diving_own" on diving_results for all
  using (auth.uid() = (select user_id from profiles where id = profile_id));

create index on diving_results(event, total_score desc);
create index on profiles(club_id);
create index on base_times(event, course, gender, season_year);
