import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { getPlanByObjective, mealLabels, objetivoLabels, recipeCategoryOptions } from "../../data/mealPlans"
import { getMealPlanFromSupabase } from "../../lib/mealPlansService"
import { useUserStore } from "../../store/userStore"
import BottomNav from "./components/BottomNav"
import EmptyStateCard from "./components/EmptyStateCard"
import StatusCard from "./components/StatusCard"
import "./nutritionApp.css"

function getRecipeCardBackground(imageUrl) {
  if (!imageUrl) return undefined

  return {
    backgroundImage: `linear-gradient(180deg, rgba(8, 15, 10, 0.14) 0%, rgba(8, 15, 10, 0.74) 100%), url("${imageUrl}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function MealPlans() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mealKey = "" } = useParams()

  const objetivo = useUserStore((state) => state.objetivo)
  const caloriasObjetivo = useUserStore((state) => state.caloriasObjetivo)

  const fallbackPlan = useMemo(() => getPlanByObjective(objetivo), [objetivo])
  const [plano, setPlano] = useState(fallbackPlan)
  const [source, setSource] = useState("local")
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState("")
  const [fatalError, setFatalError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [proteinFilter, setProteinFilter] = useState("all")
  const [calorieFilter, setCalorieFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const objetivoLabel = objetivoLabels[objetivo] ?? objetivoLabels.manter
  const selectedMealLabel = mealLabels[mealKey] ?? ""

  useEffect(() => {
    let isMounted = true

    async function loadPlan() {
      setLoading(true)
      setPlano(fallbackPlan)
      setSource("local")
      setFeedback("")
      setFatalError("")

      const { plan, error } = await getMealPlanFromSupabase(objetivo)

      if (!isMounted) return

      if (plan) {
        setPlano(plan)
        setSource("supabase")
      } else if (error) {
        setFeedback(`Supabase indisponivel: ${error.message}`)
        if (!fallbackPlan || Object.values(fallbackPlan).every((recipes) => recipes.length === 0)) {
          setFatalError("Nao foi possivel carregar os cardapios agora.")
        }
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
  const normalizedQuery = normalizeText(searchQuery)
  const hasActiveFilters =
    normalizedQuery || proteinFilter !== "all" || calorieFilter !== "all" || timeFilter !== "all" || categoryFilter !== "all"

  const filteredEntries = useMemo(() => {
    return mealEntries
      .filter(([currentMealKey]) => !mealKey || currentMealKey === mealKey)
      .map(([currentMealKey, receitas]) => {
        const filteredRecipes = receitas.filter((receita) => {
          const ingredientMatch = (receita.ingredientes ?? []).some((ingrediente) =>
            normalizeText(ingrediente).includes(normalizedQuery),
          )
          const titleMatch = normalizeText(receita.titulo).includes(normalizedQuery)
          const matchesSearch = !normalizedQuery || ingredientMatch || titleMatch

          const matchesProtein =
            proteinFilter === "all" ||
            (proteinFilter === "high" && receita.proteinaNumero >= 25) ||
            (proteinFilter === "medium" && receita.proteinaNumero >= 15 && receita.proteinaNumero < 25) ||
            (proteinFilter === "light" && receita.proteinaNumero > 0 && receita.proteinaNumero < 15)

          const matchesCalories =
            calorieFilter === "all" ||
            (calorieFilter === "low" && receita.calorias <= 300) ||
            (calorieFilter === "balanced" && receita.calorias > 300 && receita.calorias <= 500) ||
            (calorieFilter === "high" && receita.calorias > 500)

          const matchesTime =
            timeFilter === "all" ||
            (timeFilter === "fast" && receita.tempoMinutos > 0 && receita.tempoMinutos <= 10) ||
            (timeFilter === "mid" && receita.tempoMinutos > 10 && receita.tempoMinutos <= 20) ||
            (timeFilter === "long" && receita.tempoMinutos > 20)

          const matchesCategory =
            categoryFilter === "all" || (receita.categorias ?? []).includes(categoryFilter)

          return matchesSearch && matchesProtein && matchesCalories && matchesTime && matchesCategory
        })

        return [currentMealKey, filteredRecipes]
      })
      .filter(([, receitas]) => receitas.length > 0 || !hasActiveFilters)
  }, [calorieFilter, categoryFilter, hasActiveFilters, mealEntries, mealKey, normalizedQuery, proteinFilter, timeFilter])

  const totalMatches = filteredEntries.reduce((total, [, receitas]) => total + receitas.length, 0)

  function clearFilters() {
    setSearchQuery("")
    setProteinFilter("all")
    setCalorieFilter("all")
    setTimeFilter("all")
    setCategoryFilter("all")
  }

  return (
    <main className="app-mobile-shell">
      <section className="hero-card">
        <p className="eyebrow">Seu plano diario</p>
        <h1>{mealKey ? selectedMealLabel : `Cardapios para ${objetivoLabel}`}</h1>
        <p className="muted">
          {mealKey
            ? `Receitas recomendadas para ${selectedMealLabel.toLowerCase()} dentro do plano de ${objetivoLabel.toLowerCase()}.`
            : `Selecione uma refeicao do dia para visualizar receitas alinhadas ao seu objetivo. Meta calorica: ${caloriasObjetivo ? `${caloriasObjetivo} kcal` : "a definir"}`}
        </p>

        <div className="chip-row">
          <span className="chip">Fonte: {source === "supabase" ? "Supabase" : "Fallback local"}</span>
          {loading && <span className="chip chip-free">Atualizando...</span>}
          {mealKey && hasActiveFilters && <span className="chip">{totalMatches} receitas encontradas</span>}
        </div>

        {feedback && <p className="muted muted-warning">{feedback}</p>}
      </section>

      {loading && (
        <StatusCard
          eyebrow="Sincronizando"
          title="Carregando plano de refeicoes"
          description="Estamos buscando as melhores receitas para o objetivo atual."
        />
      )}

      {fatalError && (
        <StatusCard
          tone="warning"
          eyebrow="Instabilidade"
          title="Nao foi possivel carregar os cardapios"
          description={fatalError}
        />
      )}

      {mealKey && (
        <section className="meal-block">
          <div className="meal-head">
            <h2>Busca inteligente</h2>
            <span>{selectedMealLabel}</span>
          </div>

          <div className="search-ingredient-bar">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Busque por titulo ou ingrediente: ovo, frango, panqueca..."
            />
            {searchQuery && (
              <button type="button" className="ghost-action" onClick={() => setSearchQuery("")}>
                Limpar
              </button>
            )}
          </div>

          <div className="meal-filters-grid">
            <label className="meal-filter-field">
              <span>Proteina</span>
              <select value={proteinFilter} onChange={(event) => setProteinFilter(event.target.value)}>
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="light">Leve</option>
              </select>
            </label>

            <label className="meal-filter-field">
              <span>Calorias</span>
              <select value={calorieFilter} onChange={(event) => setCalorieFilter(event.target.value)}>
                <option value="all">Todas</option>
                <option value="low">Ate 300 kcal</option>
                <option value="balanced">301 a 500 kcal</option>
                <option value="high">Acima de 500 kcal</option>
              </select>
            </label>

            <label className="meal-filter-field">
              <span>Tempo</span>
              <select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)}>
                <option value="all">Todos</option>
                <option value="fast">Ate 10 min</option>
                <option value="mid">11 a 20 min</option>
                <option value="long">Mais de 20 min</option>
              </select>
            </label>
          </div>

          <div className="meal-category-row">
            {recipeCategoryOptions.map((category) => (
              <button
                key={category.key}
                type="button"
                className={`meal-category-chip${categoryFilter === category.key ? " is-active" : ""}`}
                onClick={() => setCategoryFilter((currentValue) => (currentValue === category.key ? "all" : category.key))}
              >
                {category.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button type="button" className="ghost-action meal-open-button" onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
        </section>
      )}

      {!mealKey && !fatalError && (
        <section className="dashboard-meal-nav dashboard-meal-nav-expanded">
          {mealEntries.map(([currentMealKey, receitas]) => (
            <button
              type="button"
              className="dashboard-meal-pill dashboard-meal-pill-action"
              key={currentMealKey}
              onClick={() => navigate(`/cardapios/${currentMealKey}`)}
            >
              <span>{mealLabels[currentMealKey]?.charAt(0) ?? "R"}</span>
              <strong>{mealLabels[currentMealKey]}</strong>
              <small>{receitas.length} receitas</small>
            </button>
          ))}
        </section>
      )}

      {mealKey && !fatalError &&
        filteredEntries.map(([currentMealKey, receitas]) => (
          <section className="meal-block" key={currentMealKey}>
            <div className="meal-head">
              <h2>{mealLabels[currentMealKey]}</h2>
              <span>{receitas.length} opcoes</span>
            </div>

            <div className="recipe-grid">
              {receitas.length === 0 && (
                <EmptyStateCard
                  title={hasActiveFilters ? "Nenhuma receita encontrada" : "Nenhuma receita disponivel"}
                  description={
                    hasActiveFilters
                      ? `Ajuste sua busca ou os filtros para encontrar novas opcoes em ${mealLabels[currentMealKey].toLowerCase()}.`
                      : `Ainda nao existem receitas cadastradas para ${mealLabels[currentMealKey].toLowerCase()}.`
                  }
                />
              )}
              {receitas.map((receita) => (
                <button
                  className="recipe-card recipe-card-visual"
                  key={receita.id}
                  onClick={() =>
                    navigate(`/receitas/${receita.id}`, {
                      state: {
                        backTo: location.pathname,
                        backLabel: selectedMealLabel || "Cardapios",
                      },
                    })
                  }
                  style={getRecipeCardBackground(receita.imageUrl)}
                >
                  <div className="recipe-card-content">
                    <h3>{receita.titulo}</h3>
                    <p>{receita.calorias} kcal</p>
                    <small>{receita.proteina} proteina • {receita.tempo}</small>
                    {(receita.categorias ?? []).length > 0 && (
                      <div className="recipe-card-tags">
                        {receita.categorias.slice(0, 3).map((categoria) => {
                          const categoryLabel =
                            recipeCategoryOptions.find((option) => option.key === categoria)?.label ?? categoria

                          return <span key={`${receita.id}-${categoria}`}>{categoryLabel}</span>
                        })}
                      </div>
                    )}
                    {receita.ingredientes?.length > 0 && (
                      <small className="recipe-card-ingredients">
                        {receita.ingredientes.slice(0, 3).join(" • ")}
                      </small>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}

      {hasActiveFilters && totalMatches === 0 && (
        <EmptyStateCard
          title="Nenhum resultado para esta combinacao"
          description="Tente outro titulo, ingrediente ou ajuste os filtros para visualizar mais receitas desta refeicao."
          actionLabel="Limpar filtros"
          onAction={clearFilters}
        />
      )}

      <button
        className="ghost-action"
        onClick={() => navigate(mealKey ? "/cardapios" : "/app/refeicoes")}
      >
        {mealKey ? "Voltar para as refeicoes" : "Voltar ao painel"}
      </button>

      <BottomNav />
    </main>
  )
}

export default MealPlans
