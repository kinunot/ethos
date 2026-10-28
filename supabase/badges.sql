create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table public.badges enable row level security;

create policy "badges: read own" on public.badges
  for select using (auth.uid() = user_id);
create policy "badges: insert own" on public.badges
  for insert with check (auth.uid() = user_id);
