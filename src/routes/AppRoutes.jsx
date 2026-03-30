import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "../pages/home/Home"
import Login from "../pages/auth/Login"
import Termos from "../pages/onboarding/Termos"
import Nome from "../pages/onboarding/Nome"
import Dashboard from "../pages/app/Dashboard"
import AppLayout from "../pages/app/AppLayout"
import AppHome from "../pages/app/AppHome"
import WeeklyCheckin from "../pages/app/WeeklyCheckin"
import Evolution from "../pages/app/Evolution"
import MealsOverview from "../pages/app/MealsOverview"
import ComingSoon from "../pages/app/ComingSoon"
import MealPlans from "../pages/app/MealPlans"
import RecipeDetails from "../pages/app/RecipeDetails"
import Altura from "../pages/onboarding/Altura"
import CalculoMetabolico from "../pages/onboarding/CalculoMetabolico"
import Idade from "../pages/onboarding/Idade"
import Peso from "../pages/onboarding/Peso"
import Sexo from "../pages/onboarding/Sexo"
import NivelAtividade from "../pages/onboarding/NivelAtividade"
import Objetivo from "../pages/onboarding/Objetivo"
import CriarConta from "../pages/auth/CriarConta"
import ProtectedRoute from "./ProtectedRoute"

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/termos" element={<Termos />} />

        <Route path="/nome" element={<Nome />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AppHome />} />
          <Route
            path="comunidade"
            element={
              <ComingSoon
                title="Comunidade"
                description="Espaco pensado para troca de experiencias, motivacao e interacao entre pessoas que usam o app."
                bullets={["Feed da comunidade", "Publicacoes e comentarios", "Trocas sobre rotina e resultados"]}
              />
            }
          />
          <Route path="checkin" element={<WeeklyCheckin />} />
          <Route path="evolucao" element={<Evolution />} />
          <Route path="refeicoes" element={<MealsOverview />} />
          <Route
            path="premium"
            element={
              <ComingSoon
                title="Premium"
                description="Area reservada para assinatura do aplicativo, comparativo de planos e beneficios extras."
                bullets={["Planos e assinatura", "Beneficios premium", "Gestao do acesso"]}
              />
            }
          />
          <Route
            path="metas"
            element={
              <ComingSoon
                title="Metas"
                description="Espaco reservado para metas pessoais, marcos e proximos objetivos."
                bullets={["Metas de peso", "Objetivos por fase", "Marcos da sua jornada"]}
              />
            }
          />
          <Route
            path="suplementacao"
            element={
              <ComingSoon
                title="Suplementacao"
                description="Area reservada para protocolos, horarios e observacoes."
                bullets={["Protocolos ativos", "Horarios e lembretes", "Ajustes por objetivo"]}
              />
            }
          />
          <Route
            path="agenda"
            element={
              <ComingSoon
                title="Rotina"
                description="Espaco para organizar sua semana, seus lembretes e seus compromissos."
                bullets={["Planejamento da semana", "Lembretes pessoais", "Organizacao do dia"]}
              />
            }
          />
          <Route
            path="configuracoes"
            element={
              <ComingSoon
                title="Configuracoes"
                description="Area pronta para preferências, planos e personalizacao futura."
                bullets={["Preferencias da conta", "Assinatura e plano", "Ajustes do sistema"]}
              />
            }
          />
        </Route>

        <Route
          path="/cardapios"
          element={
            <ProtectedRoute>
              <MealPlans />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cardapios/:mealKey"
          element={
            <ProtectedRoute>
              <MealPlans />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receitas/:recipeId"
          element={
            <ProtectedRoute>
              <RecipeDetails />
            </ProtectedRoute>
          }
        />

        <Route path="/altura" element={<Altura />} />

        <Route path="/calculometabolico" element={<CalculoMetabolico />} />

        <Route path="/idade" element={<Idade />} />

        <Route path="/peso" element={<Peso />} />

        <Route path="/sexo" element={<Sexo />} />

        <Route path="/objetivo" element={<Objetivo />} />

        <Route path="/atividade" element={<NivelAtividade />} />

        <Route path="/criar-conta" element={<CriarConta />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
