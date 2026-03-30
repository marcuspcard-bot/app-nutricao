create extension if not exists pgcrypto;

create table if not exists public.checkins_semanais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data_checkin timestamptz not null default timezone('utc', now()),
  peso numeric(6,2) not null check (peso > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_checkins_semanais_user_data
  on public.checkins_semanais (user_id, data_checkin desc);

alter table public.checkins_semanais enable row level security;

drop policy if exists "Usuarios podem visualizar seus checkins" on public.checkins_semanais;
create policy "Usuarios podem visualizar seus checkins"
  on public.checkins_semanais
  for select
  using (auth.uid() = user_id);

drop policy if exists "Usuarios podem inserir seus checkins" on public.checkins_semanais;
create policy "Usuarios podem inserir seus checkins"
  on public.checkins_semanais
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios podem atualizar seus checkins" on public.checkins_semanais;
create policy "Usuarios podem atualizar seus checkins"
  on public.checkins_semanais
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios podem remover seus checkins" on public.checkins_semanais;
create policy "Usuarios podem remover seus checkins"
  on public.checkins_semanais
  for delete
  using (auth.uid() = user_id);
