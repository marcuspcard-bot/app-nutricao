import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { getRecipeById } from "../../data/mealPlans"
import { getRecipeFromSupabase } from "../../lib/mealPlansService"
import { useUserStore } from "../../store/userStore"
import BottomNav from "./components/BottomNav"
import EmptyStateCard from "./components/EmptyStateCard"
import StatusCard from "./components/StatusCard"
import "./nutritionApp.css"

function getRecipeHeroBackground(imageUrl) {
  if (!imageUrl) return undefined

  return {
    backgroundImage: `linear-gradient(180deg, rgba(8, 14, 10, 0.06) 0%, rgba(8, 14, 10, 0.76) 100%), url("${imageUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }
}

function RecipeDetailsView({ recipeId }) {
  const navigate = useNavigate()
  const location = useLocation()

  const isPremium = useUserStore((state) => state.isPremium)
  const fallbackRecipe = useMemo(() => getRecipeById(recipeId), [recipeId])

  const [receita, setReceita] = useState(fallbackRecipe)
  const [source, setSource] = useState(fallbackRecipe ? "local" : "none")
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState("")
  const [adTimer, setAdTimer] = useState(isPremium ? 0 : 6)
  const [adLiberado, setAdLiberado] = useState(isPremium)

  useEffect(() => {
    let isMounted = true

    async function loadRecipe() {
      setLoading(true)
      setReceita(fallbackRecipe)
      setSource(fallbackRecipe ? "local" : "none")
      setFeedback("")

      const { recipe, error } = await getRecipeFromSupabase(recipeId)

      if (!isMounted) return

      if (recipe) {
        setReceita(recipe)
        setSource("supabase")
      } else if (error) {
        setFeedback(`Supabase indisponivel: ${error.message}`)
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
        <StatusCard
          eyebrow="Sincronizando"
          title="Carregando receita"
          description="Estamos preparando os detalhes desta receita para voce."
        />
      </main>
    )
  }

  if (!receita) {
    return (
      <main className="app-mobile-shell">
        <EmptyStateCard
          title="Receita nao encontrada"
          description="Essa receita nao esta mais disponivel ou ainda nao foi sincronizada."
          actionLabel="Voltar para cardapios"
          onAction={() => navigate("/cardapios")}
        />
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
      <section className="hero-card recipe-hero" style={getRecipeHeroBackground(receita.imageUrl)}>
        <div className="recipe-hero-content">
          <p className="eyebrow">Receita selecionada</p>
          <h1>{receita.titulo}</h1>
          <p className="muted">{receita.calorias} kcal • {receita.proteina} de proteina • {receita.tempo}</p>

          <div className="chip-row">
            <span className="chip">Fonte: {source === "supabase" ? "Supabase" : "Fallback local"}</span>
            {loading && <span className="chip chip-free">Atualizando...</span>}
          </div>

          {feedback && (
            <StatusCard
              tone="warning"
              title="Receita exibida com dados locais"
              description={feedback}
            />
          )}
        </div>
      </section>

      <section className="meal-block">
        <h2>Ingredientes da receita</h2>
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

      <button
        className="ghost-action"
        onClick={() => navigate(location.state?.backTo || "/cardapios")}
      >
        {location.state?.backLabel ? `Voltar para ${location.state.backLabel}` : "Voltar aos cardapios"}
      </button>

      <BottomNav />
    </main>
  )
}

function RecipeDetails() {
  const { recipeId = "" } = useParams()

  return <RecipeDetailsView key={recipeId} recipeId={recipeId} />
}

export default RecipeDetails
