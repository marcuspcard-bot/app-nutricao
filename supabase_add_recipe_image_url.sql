alter table public.receitas
add column if not exists image_url text;

comment on column public.receitas.image_url is
'URL publica da imagem usada como fundo do card e da tela de detalhe da receita.';
