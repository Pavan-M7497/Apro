create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  participant_a uuid references profiles(id) on delete cascade not null,
  participant_b uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(participant_a, participant_b)
);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null check (char_length(content) > 0 and char_length(content) <= 2000),
  read_at timestamptz,
  created_at timestamptz default now()
);

create index on messages(conversation_id, created_at);
create index on conversations(participant_a);
create index on conversations(participant_b);

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "view_own_conversations" on conversations for select using (
  auth.uid() = (select user_id from profiles where id = participant_a)
  or auth.uid() = (select user_id from profiles where id = participant_b)
);
create policy "create_conversations" on conversations for insert with check (
  auth.uid() = (select user_id from profiles where id = participant_a)
);
create policy "view_messages" on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id
    and (auth.uid() = (select user_id from profiles where id = c.participant_a)
    or auth.uid() = (select user_id from profiles where id = c.participant_b)))
);
create policy "send_messages" on messages for insert with check (
  auth.uid() = (select user_id from profiles where id = sender_id)
);
