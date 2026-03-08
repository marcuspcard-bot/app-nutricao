import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "../pages/home/Home"
import Login from "../pages/auth/Login"
import Termos from "../pages/onboarding/Termos"
import Nome from "../pages/onboarding/Nome"
import DadosFisicos from "../pages/onboarding/DadosFisicos"
import Objetivo from "../pages/onboarding/Objetivo"
import Preferencias from "../pages/onboarding/Preferencias"
import Dashboard from "../pages/app/Dashboard"
import Altura from "../pages/onboarding/Altura"
import CalculoMetabolico from "../pages/onboarding/CalculoMetabolico"
import Idade from "../pages/onboarding/Idade"
import Peso from "../pages/onboarding/Peso"
import Sexo from "../pages/onboarding/Sexo"

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/termos" element={<Termos />} />

        <Route path="/nome" element={<Nome />} />

        <Route path="/dados" element={<DadosFisicos />} />

        <Route path="/objetivo" element={<Objetivo />} />

        <Route path="/preferencias" element={<Preferencias />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/altura" element={<Altura />} />

        <Route path="/calculometabolico" element={<CalculoMetabolico />} />

        <Route path="/idade" element={<Idade />} />

        <Route path="/peso" element={<Peso />} />

        <Route path="/sexo" element={<Sexo />} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes