-- Feature 5: Apro Score ranking system
create table if not exists apro_scores (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) unique not null,
  sport text,
  country text,
  score integer default 0 check (score >= 0 and score <= 100),
  breakdown jsonb,
  updated_at timestamptz default now()
);

alter table apro_scores enable row level security;
create policy "apro_scores_read" on apro_scores for select using (true);
create policy "apro_scores_upsert" on apro_scores for insert with check (true);
create policy "apro_scores_update" on apro_scores for update using (true);
