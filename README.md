# App Nutrição

Aplicação web em React para onboarding nutricional com cálculo metabólico e autenticação.

## Stack

- React 19 + Vite
- React Router
- Zustand (com persistência local)
- Supabase Auth (email/senha e Google)

## Funcionalidades já implementadas

- Fluxo de onboarding:
  - Home -> Termos -> Nome -> Idade -> Peso -> Altura -> Sexo -> Atividade -> Objetivo -> Cálculo metabólico
- Armazenamento dos dados do onboarding no Zustand com persistência (`localStorage`)
- Cálculo de:
  - TMB (Mifflin-St Jeor)
  - TDEE (fator de atividade)
  - Calorias alvo por objetivo
- Tela de criar conta integrada com Supabase
- Tela de login integrada com Supabase
- Login com Google via Supabase OAuth
- Dashboard com resumo dos dados e botão para refazer onboarding
- Sincronização do onboarding com a tabela `public.perfis` no Supabase
- Cardapios e receitas buscados do Supabase com fallback local automatico

## Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
# ou
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=SUA_CHAVE_PUBLISHABLE
```

Sem essas variáveis, o app mostra mensagens de configuração nas telas de autenticação.

## Tabela esperada no Supabase

O app salva e lê dados de onboarding em `public.perfis` com `user_id` (uuid) relacionado ao `auth.users.id`.

Para cardapios e receitas, rode no SQL Editor o arquivo:

- `supabase/meal_plans_schema.sql`

Esse script cria:

- `public.receitas`
- `public.receita_ingredientes`
- `public.receita_preparo`
- politicas RLS de leitura para usuarios autenticados

Se o Supabase estiver vazio ou indisponivel, o app usa fallback local de `src/data/mealPlans.js`.

## Como rodar

```bash
npm install
npm run dev
```

## Qualidade

```bash
npm run lint
npm run build
```

## Estrutura principal

- `src/routes/AppRoutes.jsx`: rotas da aplicação
- `src/store/userStore.js`: estado global do onboarding
- `src/pages/onboarding/*`: telas do onboarding
- `src/pages/auth/*`: autenticação
- `src/pages/app/Dashboard.jsx`: painel do usuário
- `src/lib/supabaseClient.js`: cliente Supabase

## Próximos passos sugeridos

- Proteger rota `/dashboard` exigindo sessão ativa
- Salvar onboarding no banco (Supabase) por usuário autenticado
- Evoluir layout/UX (componentização, validação e feedback visual)
