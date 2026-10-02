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

-- 2) Learning progress mirrored per account (guest → account migration).
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
