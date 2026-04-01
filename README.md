# App Nutricao

Aplicativo mobile em React Native com Expo para onboarding nutricional, acompanhamento de evolucao e autenticacao com Supabase.

## Stack

- React Native + Expo
- React Navigation
- Zustand com persistencia via AsyncStorage
- Supabase Auth (email/senha e Google)

## Funcionalidades já implementadas

- Fluxo de onboarding:
  - Home -> Termos -> Nome -> Idade -> Peso -> Altura -> Sexo -> Atividade -> Objetivo -> Calculo metabolico
- Armazenamento dos dados do onboarding no Zustand com persistencia em `AsyncStorage`
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

## Variaveis de ambiente

Configure as variaveis para Expo:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
# ou
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=SUA_CHAVE_PUBLISHABLE
```

Sem essas variáveis, o app mostra mensagens de configuração nas telas de autenticação.

## Google OAuth mobile

Para login com Google no Expo + Supabase, libere o callback mobile abaixo no painel do Supabase Auth e tambem na configuracao do cliente Google:

```txt
appnutricao://auth/callback
```

Em ambiente de desenvolvimento com Expo, o app tambem pode gerar uma URL local de callback baseada no host atual. Se o login falhar no retorno, confira a mensagem exibida na tela e adicione o redirect informado ali na allow list do Supabase.

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
npm run start
```

Use tambem:

```bash
npm run android
npm run ios
npm run web
```

## Qualidade

```bash
npm run lint
```

## Estrutura principal

- `src/routes/AppRoutes.jsx`: rotas da aplicação
- `src/store/userStore.js`: estado global do onboarding
- `src/mobile/screens/*`: telas publicas e autenticadas
- `src/mobile/ui.jsx`: primitives visuais em React Native
- `src/mobile/useAppData.js`: agregacao de dados do app autenticado
- `src/lib/supabaseClient.js`: cliente Supabase

## Observacao

O projeto agora esta organizado para rodar pelo fluxo mobile com Expo Go via `App.js` + React Navigation.
