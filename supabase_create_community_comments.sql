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
