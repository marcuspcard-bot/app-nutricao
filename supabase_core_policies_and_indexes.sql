create index if not exists idx_perfis_user_id
  on public.perfis (user_id);

alter table public.perfis enable row level security;

drop policy if exists "Usuarios podem visualizar o proprio perfil" on public.perfis;
create policy "Usuarios podem visualizar o proprio perfil"
  on public.perfis
  for select
  using (auth.uid() = user_id);

drop policy if exists "Usuarios podem inserir o proprio perfil" on public.perfis;
create policy "Usuarios podem inserir o proprio perfil"
  on public.perfis
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios podem atualizar o proprio perfil" on public.perfis;
create policy "Usuarios podem atualizar o proprio perfil"
  on public.perfis
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_receitas_objetivo_refeicao_ativo
  on public.receitas (objetivo, refeicao, ativo);

create index if not exists idx_receita_ingredientes_receita_id_ordem
  on public.receita_ingredientes (receita_id, ordem);

create index if not exists idx_receita_preparo_receita_id_ordem
  on public.receita_preparo (receita_id, ordem);

alter table public.receitas enable row level security;
alter table public.receita_ingredientes enable row level security;
alter table public.receita_preparo enable row level security;

drop policy if exists "Receitas ativas visiveis para autenticados" on public.receitas;
create policy "Receitas ativas visiveis para autenticados"
  on public.receitas
  for select
  to authenticated
  using (ativo = true);

drop policy if exists "Ingredientes de receitas ativas visiveis para autenticados" on public.receita_ingredientes;
create policy "Ingredientes de receitas ativas visiveis para autenticados"
  on public.receita_ingredientes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.receitas
      where receitas.id = receita_ingredientes.receita_id
        and receitas.ativo = true
    )
  );

drop policy if exists "Preparo de receitas ativas visivel para autenticados" on public.receita_preparo;
create policy "Preparo de receitas ativas visivel para autenticados"
  on public.receita_preparo
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.receitas
      where receitas.id = receita_preparo.receita_id
        and receitas.ativo = true
    )
  );
