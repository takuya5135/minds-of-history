-- Existing profiles table definition removed to prevent errors.
-- Only run the following new table definitions.

-- ==============================================================================
-- NEW TABLES for Chat History & Wisdom Book
-- ==============================================================================

-- 1. Chats Table: Manages chat sessions between a user and a character
-- 1. Chats Table: Manages chat sessions between a user and a character
create table if not exists chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  character_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table chats enable row level security;

-- Drop policies if they exist to avoid duplication errors (Supabase doesn't support generic CREATE OR REPLACE POLICY easily in raw SQL without helper functions, but we'll use DO blocks or just ignore if it fails, but for clean setup script:)
-- Since policies are attached to tables, if the table existed, policies might too. 
-- For simplicity in this script, we'll try to drop them first or just hope they don't conflict. 
-- A better approach for idempotent scripts:
drop policy if exists "Users can view own chats." on chats;
create policy "Users can view own chats." on chats
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own chats." on chats;
create policy "Users can insert own chats." on chats
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own chats." on chats;
create policy "Users can update own chats." on chats
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own chats." on chats;
create policy "Users can delete own chats." on chats
  for delete using (auth.uid() = user_id);

-- 2. Messages Table: Stores the actual chat log
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages enable row level security;

drop policy if exists "Users can view messages of own chats." on messages;
create policy "Users can view messages of own chats." on messages
  for select using (
    exists ( select 1 from chats where id = messages.chat_id and user_id = auth.uid() )
  );

drop policy if exists "Users can insert messages to own chats." on messages;
create policy "Users can insert messages to own chats." on messages
  for insert with check (
    exists ( select 1 from chats where id = messages.chat_id and user_id = auth.uid() )
  );

drop policy if exists "Users can delete messages of own chats." on messages;
create policy "Users can delete messages of own chats." on messages
  for delete using (
    exists ( select 1 from chats where id = messages.chat_id and user_id = auth.uid() )
  );

-- 3. Wisdoms Table: Stores the summarized wisdom (Wisdom Book)
create table if not exists wisdoms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  character_id text not null,
  title text not null,
  summary text not null, -- Markdown content
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table wisdoms enable row level security;

drop policy if exists "Users can view own wisdoms." on wisdoms;
create policy "Users can view own wisdoms." on wisdoms
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own wisdoms." on wisdoms;
create policy "Users can insert own wisdoms." on wisdoms
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own wisdoms." on wisdoms;
create policy "Users can delete own wisdoms." on wisdoms
  for delete using (auth.uid() = user_id);
