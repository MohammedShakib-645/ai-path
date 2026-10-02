-- AI-Path schema (run in Supabase SQL editor)
create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text,
  level text default 'Beginner',
  xp integer default 0,
  learning_goal text default 'Learn AI and build real projects',
  created_at timestamp default now()
);
create table if not exists topics (
  id serial primary key,
  title text not null,
  icon text,
  order_index integer,
  category text
);
create table if not exists user_topic_progress (
  id serial primary key,
  user_id uuid references profiles(id),
  topic_id integer references topics(id),
  status text check (status in ('not_started','in_progress','completed')) default 'not_started',
  progress_percent integer default 0,
  updated_at timestamp default now()
);
create table if not exists activity_log (
  id serial primary key,
  user_id uuid references profiles(id),
  action text,
  icon_type text,
  created_at timestamp default now()
);
create table if not exists quizzes (
  id serial primary key,
  topic_id integer references topics(id),
  question text,
  options jsonb,
  correct_index integer
);
create table if not exists quiz_attempts (
  id serial primary key,
  user_id uuid references profiles(id),
  quiz_id integer references quizzes(id),
  is_correct boolean,
  attempted_at timestamp default now()
);
create table if not exists chat_messages (
  id serial primary key,
  user_id uuid references profiles(id),
  role text check (role in ('user','assistant')),
  content text,
  created_at timestamp default now()
);
create table if not exists study_streak (
  id serial primary key,
  user_id uuid references profiles(id),
  date date,
  studied boolean default true
);
-- seed topics
insert into topics (title, order_index, category) values
('Python Basics',1,'Python Basics'),
('Data Types',2,'Python Basics'),
('Control Flow',3,'Python Basics'),
('Functions',4,'Python Basics'),
('Data Structures',5,'Data Structures'),
('Projects',6,'Projects')
on conflict do nothing;

-- AI-PATH auth extras (run AFTER schema.sql in the Supabase SQL editor)

-- 1) Auto-create a profile row when a user signs up (email or OAuth).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Learning progress mirrored per account (guest â†’ account migration).
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- 3) Row Level Security: users can only touch their own row.
alter table public.user_progress enable row level security;

drop policy if exists "own progress read" on public.user_progress;
create policy "own progress read" on public.user_progress
  for select using (auth.uid() = user_id);

drop policy if exists "own progress write" on public.user_progress;
create policy "own progress write" on public.user_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "own progress update" on public.user_progress;
create policy "own progress update" on public.user_progress
  for update using (auth.uid() = user_id);

-- profiles: owners can read their own row
alter table public.profiles enable row level security;
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);

