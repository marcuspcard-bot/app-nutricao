import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "../pages/home/Home"
import Login from "../pages/auth/Login"
import Termos from "../pages/onboarding/Termos"
import Nome from "../pages/onboarding/Nome"
import Dashboard from "../pages/app/Dashboard"
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
          path="/cardapios"
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
