import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getPlanByObjective, mealLabels, objetivoLabels } from "../../data/mealPlans"
import { getMealPlanFromSupabase } from "../../lib/mealPlansService"
import { useUserStore } from "../../store/userStore"
import "./nutritionApp.css"

function getRecipeCardBackground(imageUrl) {
  if (!imageUrl) return undefined

  return {
    backgroundImage: `linear-gradient(180deg, rgba(8, 15, 10, 0.14) 0%, rgba(8, 15, 10, 0.74) 100%), url("${imageUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }
}

function MealPlans() {
  const navigate = useNavigate()

  const objetivo = useUserStore((state) => state.objetivo)
  const caloriasObjetivo = useUserStore((state) => state.caloriasObjetivo)

  const fallbackPlan = useMemo(() => getPlanByObjective(objetivo), [objetivo])
  const [plano, setPlano] = useState(fallbackPlan)
  const [source, setSource] = useState("local")
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState("")

  const objetivoLabel = objetivoLabels[objetivo] ?? objetivoLabels.manter

  useEffect(() => {
    let isMounted = true

    async function loadPlan() {
      setLoading(true)
      setPlano(fallbackPlan)
      setSource("local")
      setFeedback("")

      const { plan, error } = await getMealPlanFromSupabase(objetivo)

      if (!isMounted) return

      if (plan) {
        setPlano(plan)
        setSource("supabase")
      } else if (error) {
        setFeedback(`Supabase indisponivel: ${error.message}`)
      } else {
        setFeedback("Sem receitas cadastradas no Supabase para essa meta. Exibindo fallback local.")
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

        {feedback && <p className="muted muted-warning">{feedback}</p>}
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
                className="recipe-card recipe-card-visual"
                key={receita.id}
                onClick={() => navigate(`/receitas/${receita.id}`)}
                style={getRecipeCardBackground(receita.imageUrl)}
              >
                <div className="recipe-card-content">
                  <h3>{receita.titulo}</h3>
                  <p>{receita.calorias} kcal</p>
                  <small>{receita.proteina} proteina • {receita.tempo}</small>
                </div>
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
