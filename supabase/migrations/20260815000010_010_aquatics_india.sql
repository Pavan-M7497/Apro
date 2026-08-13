-- Indian states and union territories
create table if not exists indian_states (
  code text primary key,
  name text not null,
  type text not null check (type in ('state','ut'))
);

insert into indian_states (code, name, type) values
('AP','Andhra Pradesh','state'),('AR','Arunachal Pradesh','state'),('AS','Assam','state'),
('BR','Bihar','state'),('CT','Chhattisgarh','state'),('GA','Goa','state'),
('GJ','Gujarat','state'),('HR','Haryana','state'),('HP','Himachal Pradesh','state'),
('JH','Jharkhand','state'),('KA','Karnataka','state'),('KL','Kerala','state'),
('MP','Madhya Pradesh','state'),('MH','Maharashtra','state'),('MN','Manipur','state'),
('ML','Meghalaya','state'),('MZ','Mizoram','state'),('NL','Nagaland','state'),
('OR','Odisha','state'),('PB','Punjab','state'),('RJ','Rajasthan','state'),
('SK','Sikkim','state'),('TN','Tamil Nadu','state'),('TG','Telangana','state'),
('TR','Tripura','state'),('UP','Uttar Pradesh','state'),('UT','Uttarakhand','state'),
('WB','West Bengal','state'),
('AN','Andaman and Nicobar Islands','ut'),('CH','Chandigarh','ut'),
('DH','Dadra and Nagar Haveli and Daman and Diu','ut'),('DL','Delhi','ut'),
('JK','Jammu and Kashmir','ut'),('LA','Ladakh','ut'),('LD','Lakshadweep','ut'),
('PY','Puducherry','ut')
on conflict (code) do nothing;

-- Add state to profiles, keep country fixed as India
alter table profiles add column if not exists state_code text references indian_states(code);
alter table profiles add column if not exists city text;

-- Swimming/diving times and scores need their own shape
create table if not exists performance_records (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  discipline text not null,
  event text not null,
  course text check (course in ('SCM','LCM','NA')),
  result_seconds numeric(8,2),
  result_points numeric(7,2),
  meet_name text,
  meet_level text check (meet_level in ('school','district','state','zonal','national','khelo_india','international')),
  meet_date date,
  is_personal_best boolean default false,
  verified boolean default false,
  created_at timestamptz default now()
);

-- Water polo season stats
create table if not exists waterpolo_stats (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  season text not null,
  competition text,
  matches integer default 0,
  goals integer default 0,
  assists integer default 0,
  saves integer default 0,
  exclusions_drawn integer default 0,
  created_at timestamptz default now()
);

alter table indian_states enable row level security;
alter table performance_records enable row level security;
alter table waterpolo_stats enable row level security;

create policy "states_public_read" on indian_states for select using (true);
create policy "perf_public_read" on performance_records for select using (true);
create policy "perf_own_write" on performance_records for all
  using (auth.uid() = (select user_id from profiles where id = profile_id));
create policy "wp_public_read" on waterpolo_stats for select using (true);
create policy "wp_own_write" on waterpolo_stats for all
  using (auth.uid() = (select user_id from profiles where id = profile_id));

create index on performance_records(profile_id, discipline);
create index on performance_records(event, result_seconds);
