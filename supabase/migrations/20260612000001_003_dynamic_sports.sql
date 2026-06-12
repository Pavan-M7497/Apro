-- Feature 4: Dynamic sports list
create table if not exists sports_list (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  is_official boolean default false,
  usage_count integer default 1,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists positions_list (
  id uuid default gen_random_uuid() primary key,
  sport_name text not null,
  name text not null,
  is_official boolean default false,
  usage_count integer default 1,
  unique(sport_name, name)
);

-- Trigger: promote sport to official when usage_count >= 10
create or replace function promote_sport_to_official()
returns trigger language plpgsql as $$
begin
  if new.usage_count >= 10 and not new.is_official then
    new.is_official := true;
  end if;
  return new;
end;
$$;

create trigger sports_list_auto_official
  before update on sports_list
  for each row execute function promote_sport_to_official();

create or replace function promote_position_to_official()
returns trigger language plpgsql as $$
begin
  if new.usage_count >= 10 and not new.is_official then
    new.is_official := true;
  end if;
  return new;
end;
$$;

create trigger positions_list_auto_official
  before update on positions_list
  for each row execute function promote_position_to_official();

-- RLS
alter table sports_list enable row level security;
alter table positions_list enable row level security;

create policy "sports_list_read" on sports_list for select using (true);
create policy "sports_list_insert" on sports_list for insert with check (auth.uid() is not null);
create policy "sports_list_update_usage" on sports_list for update using (true);

create policy "positions_list_read" on positions_list for select using (true);
create policy "positions_list_insert" on positions_list for insert with check (auth.uid() is not null);
create policy "positions_list_update_usage" on positions_list for update using (true);

-- Seed official sports
insert into sports_list (name, is_official, usage_count) values
  ('Football', true, 100),
  ('Basketball', true, 100),
  ('Tennis', true, 100),
  ('Athletics', true, 100),
  ('Swimming', true, 100),
  ('Cricket', true, 100),
  ('Rugby', true, 100),
  ('Boxing', true, 100),
  ('MMA', true, 100),
  ('Volleyball', true, 100),
  ('Handball', true, 100),
  ('Cycling', true, 100),
  ('Golf', true, 100),
  ('Baseball', true, 100),
  ('Hockey', true, 100),
  ('Water Polo', true, 100)
on conflict (name) do nothing;

-- Seed official positions
insert into positions_list (sport_name, name, is_official, usage_count) values
  ('Football', 'Goalkeeper', true, 100),
  ('Football', 'Defender', true, 100),
  ('Football', 'Midfielder', true, 100),
  ('Football', 'Striker', true, 100),
  ('Football', 'Winger', true, 100),
  ('Basketball', 'Point Guard', true, 100),
  ('Basketball', 'Shooting Guard', true, 100),
  ('Basketball', 'Small Forward', true, 100),
  ('Basketball', 'Power Forward', true, 100),
  ('Basketball', 'Center', true, 100),
  ('Tennis', 'Singles', true, 100),
  ('Tennis', 'Doubles', true, 100),
  ('Athletics', 'Sprinter', true, 100),
  ('Athletics', 'Marathon', true, 100),
  ('Athletics', 'Jumper', true, 100),
  ('Athletics', 'Thrower', true, 100),
  ('Athletics', 'Hurdler', true, 100),
  ('Swimming', 'Freestyle', true, 100),
  ('Swimming', 'Backstroke', true, 100),
  ('Swimming', 'Breaststroke', true, 100),
  ('Swimming', 'Butterfly', true, 100),
  ('Swimming', 'Medley', true, 100),
  ('Cricket', 'Batsman', true, 100),
  ('Cricket', 'Bowler', true, 100),
  ('Cricket', 'All-rounder', true, 100),
  ('Cricket', 'Wicketkeeper', true, 100),
  ('Rugby', 'Forward', true, 100),
  ('Rugby', 'Back', true, 100),
  ('Rugby', 'Halfback', true, 100),
  ('Rugby', 'Center', true, 100),
  ('Rugby', 'Wing', true, 100),
  ('Boxing', 'Heavyweight', true, 100),
  ('Boxing', 'Middleweight', true, 100),
  ('Boxing', 'Welterweight', true, 100),
  ('Boxing', 'Lightweight', true, 100),
  ('MMA', 'Striker', true, 100),
  ('MMA', 'Grappler', true, 100),
  ('MMA', 'All-rounder', true, 100),
  ('Volleyball', 'Setter', true, 100),
  ('Volleyball', 'Outside Hitter', true, 100),
  ('Volleyball', 'Middle Blocker', true, 100),
  ('Volleyball', 'Opposite', true, 100),
  ('Volleyball', 'Libero', true, 100),
  ('Handball', 'Goalkeeper', true, 100),
  ('Handball', 'Left Wing', true, 100),
  ('Handball', 'Right Wing', true, 100),
  ('Handball', 'Center Back', true, 100),
  ('Handball', 'Pivot', true, 100),
  ('Cycling', 'Sprinter', true, 100),
  ('Cycling', 'Climber', true, 100),
  ('Cycling', 'Time Trialist', true, 100),
  ('Cycling', 'All-rounder', true, 100),
  ('Golf', 'Professional', true, 100),
  ('Golf', 'Amateur', true, 100),
  ('Baseball', 'Pitcher', true, 100),
  ('Baseball', 'Catcher', true, 100),
  ('Baseball', 'Infielder', true, 100),
  ('Baseball', 'Outfielder', true, 100),
  ('Hockey', 'Goalkeeper', true, 100),
  ('Hockey', 'Defender', true, 100),
  ('Hockey', 'Midfielder', true, 100),
  ('Hockey', 'Forward', true, 100),
  ('Water Polo', 'Goalkeeper', true, 100),
  ('Water Polo', 'Centre Forward', true, 100),
  ('Water Polo', 'Driver', true, 100),
  ('Water Polo', 'Hole Set', true, 100),
  ('Water Polo', 'Wing', true, 100),
  ('Water Polo', 'Point', true, 100)
on conflict (sport_name, name) do nothing;
