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

drop policy if exists "community posts are readable by authenticated users" on public.community_posts;
create policy "community posts are readable by authenticated users"
on public.community_posts
for select
to authenticated
using (true);

drop policy if exists "users can insert their own community posts" on public.community_posts;
create policy "users can insert their own community posts"
on public.community_posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update their own community posts" on public.community_posts;
create policy "users can update their own community posts"
on public.community_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete their own community posts" on public.community_posts;
create policy "users can delete their own community posts"
on public.community_posts
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists community_post_comments_post_id_idx
  on public.community_post_comments (post_id, created_at asc);

create index if not exists community_post_comments_user_id_idx
  on public.community_post_comments (user_id);

alter table public.community_post_comments enable row level security;

drop policy if exists "community comments are readable by authenticated users" on public.community_post_comments;
create policy "community comments are readable by authenticated users"
on public.community_post_comments
for select
to authenticated
using (true);

drop policy if exists "users can insert their own community comments" on public.community_post_comments;
create policy "users can insert their own community comments"
on public.community_post_comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update their own community comments" on public.community_post_comments;
create policy "users can update their own community comments"
on public.community_post_comments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete their own community comments" on public.community_post_comments;
create policy "users can delete their own community comments"
on public.community_post_comments
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.community_post_likes (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create index if not exists community_post_likes_user_id_idx
  on public.community_post_likes (user_id);

create index if not exists community_post_likes_post_id_idx
  on public.community_post_likes (post_id);

alter table public.community_post_likes enable row level security;

drop policy if exists "community likes are readable by authenticated users" on public.community_post_likes;
create policy "community likes are readable by authenticated users"
on public.community_post_likes
for select
to authenticated
using (true);

drop policy if exists "users can insert their own likes" on public.community_post_likes;
create policy "users can insert their own likes"
on public.community_post_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can delete their own likes" on public.community_post_likes;
create policy "users can delete their own likes"
on public.community_post_likes
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.community_saved_posts (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create index if not exists community_saved_posts_user_id_idx
  on public.community_saved_posts (user_id);

create index if not exists community_saved_posts_post_id_idx
  on public.community_saved_posts (post_id);

alter table public.community_saved_posts enable row level security;

drop policy if exists "saved posts are readable by owner" on public.community_saved_posts;
create policy "saved posts are readable by owner"
on public.community_saved_posts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert their own saved posts" on public.community_saved_posts;
create policy "users can insert their own saved posts"
on public.community_saved_posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can delete their own saved posts" on public.community_saved_posts;
create policy "users can delete their own saved posts"
on public.community_saved_posts
for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do nothing;

drop policy if exists "community images are publicly readable" on storage.objects;
create policy "community images are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'community-images');

drop policy if exists "authenticated users can upload their own community images" on storage.objects;
create policy "authenticated users can upload their own community images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "authenticated users can update their own community images" on storage.objects;
create policy "authenticated users can update their own community images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'community-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'community-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "authenticated users can delete their own community images" on storage.objects;
create policy "authenticated users can delete their own community images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'community-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
