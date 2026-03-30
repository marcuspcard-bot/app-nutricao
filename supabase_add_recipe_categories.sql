alter table public.receitas
add column if not exists categorias text[] not null default '{}';

comment on column public.receitas.categorias is
  'Categorias da receita para filtros como rapido, economico, pre_treino e pos_treino.';

update public.receitas
set categorias = '{}'
where categorias is null;

create index if not exists idx_receitas_categorias_gin
  on public.receitas using gin (categorias);

create index if not exists idx_receitas_filtros_detalhados
  on public.receitas (objetivo, refeicao, ativo, proteina_g, calorias, tempo_preparo_min);
