create extension if not exists pgcrypto;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  caption text not null check (char_length(trim(caption)) > 0),
  body text not null check (char_length(trim(body)) > 0),
  image_url text,
  meal_type text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_posts_created_at_idx
  on public.community_posts (created_at desc);

create index if not exists community_posts_user_id_idx
  on public.community_posts (user_id);

alter table public.community_posts enable row level security;

create policy "community posts are readable by authenticated users"
on public.community_posts
for select
to authenticated
using (true);

create policy "users can insert their own community posts"
on public.community_posts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update their own community posts"
on public.community_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete their own community posts"
on public.community_posts
for delete
to authenticated
using (auth.uid() = user_id);
