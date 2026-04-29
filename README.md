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

## Base de escala - Fase 1

O app agora comeca a usar uma base comum para carregamento de dados em escala:

- `cache local` com `AsyncStorage` para perfil, check-ins, feed inicial da comunidade, cardapios e imagens principais
- `retry basico` para tentativas automaticas em falhas transitórias
- `logs estruturados` para erros e sincronizacoes em `src/lib/appLogger.js`
- `camada comum de dados` em `src/lib/dataClient.js` e `src/lib/cacheClient.js`
- `estados separados` para `initialLoading`, `refreshing` e `stale data`

Com isso, as telas principais conseguem:

- abrir mais rapido quando ja existe dado salvo no aparelho
- continuar funcionando melhor em rede instavel
- mostrar quando estao usando cache local ou atualizando em segundo plano

## Base de escala - Fase 2

O app agora avanca para uma camada mais forte de operacao:

- `retry com backoff exponencial + jitter` em `src/lib/dataClient.js`
- `cache com TTL` para perfil, check-ins, cardapios, receitas, feed e imagens
- `pre-carregamento` do feed da comunidade, do cardapio do objetivo atual e de receitas mais provaveis em `src/lib/preloadService.js`
- `paginacao de comentarios` na comunidade com carregamento sob demanda
- `contagem de comentarios desacoplada` do carregamento completo do feed, reduzindo peso inicial

Com isso, o app passa a:

- abrir a comunidade com menos carga inicial
- carregar comentarios por bloco
- reduzir requisicoes desnecessarias quando o cache ainda esta fresco
- aquecer dados importantes antes do usuario entrar nas telas mais acessadas

## Estrutura principal

- `src/routes/AppRoutes.jsx`: rotas da aplicação
- `src/store/userStore.js`: estado global do onboarding
- `src/mobile/screens/*`: telas publicas e autenticadas
- `src/mobile/ui.jsx`: primitives visuais em React Native
- `src/mobile/useAppData.js`: agregacao de dados do app autenticado
- `src/lib/supabaseClient.js`: cliente Supabase

## Observacao

O projeto agora esta organizado para rodar pelo fluxo mobile com Expo Go via `App.js` + React Navigation.


notificações inteligentes
Lembrar check-in, água, refeições e retorno ao plano. Isso costuma ajudar muito na retenção.

perfil alimentar completo
Restrições, alergias, alimentos que gosta/não gosta, rotina, orçamento e objetivo. Quanto mais personalizado, mais difícil o usuário abandonar.

plano adaptativo
Se o usuário perde peso, ganha peso, falha no plano ou muda objetivo, o app recalcula calorias, refeições e sugestões automaticamente.

busca forte de receitas e alimentos
Busca por ingrediente, tempo de preparo, calorias, proteína, preço, dieta e categoria. Em app grande isso vira uma das funções mais usadas.

favoritos, histórico e listas
Salvar receitas, montar semana, gerar lista de compras e reaproveitar refeições anteriores.

analytics e métricas
Painel para vocês acompanharem retenção, telas mais acessadas, onde o onboarding perde usuário, quantos concluem check-in e quantos voltam por semana.

moderação da comunidade
Denúncia, bloqueio, ocultação automática, revisão de imagens/texto e regras claras. Comunidade cresce rápido e esse ponto vira crítico cedo.

gamificação leve
Sequência de dias, metas semanais, conquistas e evolução visual. Funciona bem se for simples e não infantil.

área profissional no futuro
Nutricionistas ou consultores acompanhando usuários, liberando planos, comentários e ajustes. Isso pode virar um diferencial forte de negócio.

camada de dados centralizada
Hoje vale termos um padrão único para buscar dados, cachear, invalidar, paginar e tratar erro. Em vez de cada tela fazer isso do seu jeito, criamos uma base comum.
Resultado: menos bugs, menos loading inconsistente, menos retrabalho.

cache local
Guardar localmente dados importantes como perfil, cardápios, receitas, feed inicial e histórico recente.
Resultado: app abre mais rápido, funciona melhor com internet ruim e reduz carga no backend.

paginação real
Comunidade, receitas, comentários e listas grandes nunca devem carregar tudo de uma vez.
Resultado: menos consumo de memória, menos travamento e menos custo de rede.

loading por blocos
Em vez de travar a tela inteira sempre, cada seção carrega no seu ritmo quando fizer sentido.
Resultado: experiência mais fluida sem tela “pesada”.

retry + tolerância a falha
Toda chamada importante precisa de:

tentativa novamente automática em falhas transitórias
fallback local quando possível
mensagens claras para o usuário
Resultado: o app parece confiável mesmo quando a rede falha.
logs e monitoramento
Precisamos registrar erro de tela, erro de API, lentidão, tempo de carregamento e pontos de abandono.
Resultado: quando crescer, a gente descobre os gargalos antes de virar caos.

proteção contra telas lentas
Evitar renders desnecessários, listas grandes sem virtualização, imagens pesadas e carregamentos duplicados.
Resultado: o app continua leve em celular simples.

