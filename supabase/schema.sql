-- Ethos schema. Run this once in Supabase: SQL Editor -> New query -> paste -> Run.

-- 1. Profiles (one row per user) ---------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Attempts (every answer a user gives) ------------------------------------
-- scenario_id matches the `id` in data/scenarios.ts (e.g. 'conf-1').
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  scenario_id text not null,
  choice_index int not null check (choice_index >= 0),
  score int not null check (score between 0 and 2),
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_idx on public.attempts (user_id, created_at);

alter table public.attempts enable row level security;

create policy "attempts: read own" on public.attempts
  for select using (auth.uid() = user_id);
create policy "attempts: insert own" on public.attempts
  for insert with check (auth.uid() = user_id);
create policy "attempts: delete own" on public.attempts
  for delete using (auth.uid() = user_id);
