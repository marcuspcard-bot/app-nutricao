import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getPlanByObjective, mealLabels, objetivoLabels } from "../../data/mealPlans"
import { getMealPlanFromSupabase } from "../../lib/mealPlansService"
import { useUserStore } from "../../store/userStore"
import "./nutritionApp.css"

function MealPlans() {
  const navigate = useNavigate()

  const objetivo = useUserStore((state) => state.objetivo)
  const caloriasObjetivo = useUserStore((state) => state.caloriasObjetivo)

  const fallbackPlan = useMemo(() => getPlanByObjective(objetivo), [objetivo])
  const [plano, setPlano] = useState(fallbackPlan)
  const [source, setSource] = useState("local")
  const [loading, setLoading] = useState(true)

  const objetivoLabel = objetivoLabels[objetivo] ?? objetivoLabels.manter

  useEffect(() => {
    let isMounted = true

    async function loadPlan() {
      setLoading(true)
      setPlano(fallbackPlan)
      setSource("local")

      const { plan } = await getMealPlanFromSupabase(objetivo)

      if (!isMounted) return

      if (plan) {
        setPlano(plan)
        setSource("supabase")
      }

      setLoading(false)
    }

    loadPlan()

    return () => {
      isMounted = false
    }
  }, [fallbackPlan, objetivo])

  const mealEntries = Object.entries(plano)

  return (
    <main className="app-mobile-shell">
      <section className="hero-card">
        <p className="eyebrow">Seu plano diario</p>
        <h1>Cardapios para {objetivoLabel}</h1>
        <p className="muted">Meta calorica: {caloriasObjetivo ? `${caloriasObjetivo} kcal` : "nao definida"}</p>

        <div className="chip-row">
          <span className="chip">Fonte: {source === "supabase" ? "Supabase" : "Fallback local"}</span>
          {loading && <span className="chip chip-free">Atualizando...</span>}
        </div>
      </section>

      {mealEntries.map(([mealKey, receitas]) => (
        <section className="meal-block" key={mealKey}>
          <div className="meal-head">
            <h2>{mealLabels[mealKey]}</h2>
            <span>{receitas.length} opcoes</span>
          </div>

          <div className="recipe-grid">
            {receitas.length === 0 && <p className="muted">Sem receitas nesta refeicao.</p>}
            {receitas.map((receita) => (
              <button
                className="recipe-card"
                key={receita.id}
                onClick={() => navigate(`/receitas/${receita.id}`)}
              >
                <h3>{receita.titulo}</h3>
                <p>{receita.calorias} kcal</p>
                <small>{receita.proteina} proteina • {receita.tempo}</small>
              </button>
            ))}
          </div>
        </section>
      ))}

      <button className="ghost-action" onClick={() => navigate("/dashboard")}>Voltar ao dashboard</button>
    </main>
  )
}

export default MealPlans
