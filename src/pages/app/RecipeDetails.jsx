import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getRecipeById } from "../../data/mealPlans"
import { getRecipeFromSupabase } from "../../lib/mealPlansService"
import { useUserStore } from "../../store/userStore"
import "./nutritionApp.css"

function RecipeDetailsView({ recipeId }) {
  const navigate = useNavigate()

  const isPremium = useUserStore((state) => state.isPremium)
  const fallbackRecipe = useMemo(() => getRecipeById(recipeId), [recipeId])

  const [receita, setReceita] = useState(fallbackRecipe)
  const [source, setSource] = useState(fallbackRecipe ? "local" : "none")
  const [loading, setLoading] = useState(true)
  const [adTimer, setAdTimer] = useState(isPremium ? 0 : 6)
  const [adLiberado, setAdLiberado] = useState(isPremium)

  useEffect(() => {
    let isMounted = true

    async function loadRecipe() {
      setLoading(true)
      setReceita(fallbackRecipe)
      setSource(fallbackRecipe ? "local" : "none")

      const { recipe } = await getRecipeFromSupabase(recipeId)

      if (!isMounted) return

      if (recipe) {
        setReceita(recipe)
        setSource("supabase")
      }

      setLoading(false)
    }

    loadRecipe()

    return () => {
      isMounted = false
    }
  }, [fallbackRecipe, recipeId])

  useEffect(() => {
    if (loading || isPremium || adLiberado) return undefined

    const interval = setInterval(() => {
      setAdTimer((current) => {
        if (current <= 1) {
          clearInterval(interval)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [adLiberado, isPremium, loading])

  if (loading) {
    return (
      <main className="app-mobile-shell">
        <section className="hero-card">
          <p className="eyebrow">Carregando receita</p>
          <h1>Aguarde...</h1>
        </section>
      </main>
    )
  }

  if (!receita) {
    return (
      <main className="app-mobile-shell">
        <section className="hero-card">
          <h1>Receita nao encontrada</h1>
          <button className="primary-action" onClick={() => navigate("/cardapios")}>Voltar para cardapios</button>
        </section>
      </main>
    )
  }

  if (!isPremium && !adLiberado) {
    return (
      <main className="app-mobile-shell">
        <section className="ad-gate">
          <p className="eyebrow">Modo gratuito</p>
          <h1>Anuncio patrocinado</h1>
          <p className="muted">A receita sera liberada em {adTimer}s.</p>
          <div className="ad-box">
            <strong>Suplemento Nutri+</strong>
            <p>Recupere melhor no pos-treino com formula de aminoacidos.</p>
          </div>
          <button
            className="primary-action"
            disabled={adTimer > 0}
            onClick={() => setAdLiberado(true)}
          >
            {adTimer > 0 ? `Aguarde ${adTimer}s` : "Ver receita"}
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-mobile-shell">
      <section className="hero-card">
        <p className="eyebrow">Receita</p>
        <h1>{receita.titulo}</h1>
        <p className="muted">{receita.calorias} kcal • {receita.proteina} proteina • {receita.tempo}</p>

        <div className="chip-row">
          <span className="chip">Fonte: {source === "supabase" ? "Supabase" : "Fallback local"}</span>
        </div>
      </section>

      <section className="meal-block">
        <h2>Ingredientes</h2>
        <ul className="list-clean">
          {receita.ingredientes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="meal-block">
        <h2>Modo de preparo</h2>
        <ol className="list-clean ordered">
          {receita.preparo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <button className="ghost-action" onClick={() => navigate("/cardapios")}>Voltar aos cardapios</button>
    </main>
  )
}

function RecipeDetails() {
  const { recipeId = "" } = useParams()

  return <RecipeDetailsView key={recipeId} recipeId={recipeId} />
}

export default RecipeDetails
