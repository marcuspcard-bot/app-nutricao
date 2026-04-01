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
