import { enrichRecipe, mealLabels } from "../data/mealPlans"
import { hasSupabaseConfig, supabase } from "./supabaseClient"

function getRecipeColumns(options = {}) {
  const columns = ["id", "titulo", "objetivo", "refeicao", "calorias", "proteina_g", "tempo_preparo_min", "is_premium"]

  if (options.includeImageUrl) columns.push("image_url")
  if (options.includeCategorias) columns.push("categorias")

  return columns.join(", ")
}

function shouldRetryWithoutColumn(error, columnName) {
  return Boolean(error?.message?.includes(columnName))
}

function toRecipeSummary(row) {
  return enrichRecipe({
    id: row.id,
    titulo: row.titulo,
    calorias: row.calorias,
    proteina: `${Number(row.proteina_g ?? 0)}g`,
    tempo: `${Number(row.tempo_preparo_min ?? 0)} min`,
    isPremium: Boolean(row.is_premium),
    imageUrl: row.image_url ?? "",
    ingredientes: row.ingredientes ?? [],
    categorias: Array.isArray(row.categorias) ? row.categorias : [],
  })
}

function withAllMeals(plan) {
  const normalized = {}

  for (const mealKey of Object.keys(mealLabels)) {
    normalized[mealKey] = plan[mealKey] ?? []
  }

  return normalized
}

async function fetchMealPlan(objetivo, options = {}) {
  return supabase
    .from("receitas")
    .select(getRecipeColumns(options))
    .eq("objetivo", objetivo)
    .eq("ativo", true)
    .order("refeicao", { ascending: true })
    .order("titulo", { ascending: true })
}

export async function getMealPlanFromSupabase(objetivo) {
  if (!hasSupabaseConfig || !supabase) return { plan: null, error: null }

  let options = { includeImageUrl: true, includeCategorias: true }
  let { data, error } = await fetchMealPlan(objetivo, options)

  if (shouldRetryWithoutColumn(error, "categorias")) {
    options = { ...options, includeCategorias: false }
    const retry = await fetchMealPlan(objetivo, options)
    data = retry.data
    error = retry.error
  }

  if (shouldRetryWithoutColumn(error, "image_url")) {
    options = { ...options, includeImageUrl: false }
    const retry = await fetchMealPlan(objetivo, options)
    data = retry.data
    error = retry.error
  }

  if (error) return { plan: null, error }

  if (!data || data.length === 0) return { plan: null, error: null }

  const recipeIds = data.map((item) => item.id)
  const { data: ingredientRows, error: ingredientError } = await supabase
    .from("receita_ingredientes")
    .select("receita_id, descricao, ordem")
    .in("receita_id", recipeIds)
    .order("ordem", { ascending: true })

  if (ingredientError) return { plan: null, error: ingredientError }

  const ingredientsByRecipeId = (ingredientRows ?? []).reduce((acc, row) => {
    if (!acc[row.receita_id]) acc[row.receita_id] = []
    acc[row.receita_id].push(row.descricao)
    return acc
  }, {})

  const grouped = data.reduce((acc, row) => {
    const mealKey = row.refeicao
    if (!acc[mealKey]) acc[mealKey] = []
    acc[mealKey].push(
      toRecipeSummary({
        ...row,
        ingredientes: ingredientsByRecipeId[row.id] ?? [],
      }),
    )
    return acc
  }, {})

  return { plan: withAllMeals(grouped), error: null }
}

export async function getRecipeFromSupabase(recipeId) {
  if (!hasSupabaseConfig || !supabase) return { recipe: null, error: null }

  let columns = "id, titulo, calorias, proteina_g, tempo_preparo_min, is_premium, image_url, categorias"
  let { data: receita, error: receitaError } = await supabase
    .from("receitas")
    .select(columns)
    .eq("id", recipeId)
    .eq("ativo", true)
    .maybeSingle()

  if (shouldRetryWithoutColumn(receitaError, "categorias")) {
    columns = "id, titulo, calorias, proteina_g, tempo_preparo_min, is_premium, image_url"
    const retry = await supabase
      .from("receitas")
      .select(columns)
      .eq("id", recipeId)
      .eq("ativo", true)
      .maybeSingle()

    receita = retry.data
    receitaError = retry.error
  }

  if (shouldRetryWithoutColumn(receitaError, "image_url")) {
    columns = "id, titulo, calorias, proteina_g, tempo_preparo_min, is_premium"
    const retry = await supabase
      .from("receitas")
      .select(columns)
      .eq("id", recipeId)
      .eq("ativo", true)
      .maybeSingle()

    receita = retry.data
    receitaError = retry.error
  }

  if (receitaError) return { recipe: null, error: receitaError }

  if (!receita) return { recipe: null, error: null }

  const [ingredientesResult, preparoResult] = await Promise.all([
    supabase
      .from("receita_ingredientes")
      .select("descricao, ordem")
      .eq("receita_id", recipeId)
      .order("ordem", { ascending: true }),
    supabase
      .from("receita_preparo")
      .select("passo, ordem")
      .eq("receita_id", recipeId)
      .order("ordem", { ascending: true }),
  ])

  if (ingredientesResult.error) return { recipe: null, error: ingredientesResult.error }
  if (preparoResult.error) return { recipe: null, error: preparoResult.error }

  return {
    recipe: enrichRecipe({
      id: receita.id,
      titulo: receita.titulo,
      calorias: receita.calorias,
      proteina: `${Number(receita.proteina_g ?? 0)}g`,
      tempo: `${Number(receita.tempo_preparo_min ?? 0)} min`,
      isPremium: Boolean(receita.is_premium),
      imageUrl: receita.image_url ?? "",
      categorias: Array.isArray(receita.categorias) ? receita.categorias : [],
      ingredientes: (ingredientesResult.data ?? []).map((item) => item.descricao),
      preparo: (preparoResult.data ?? []).map((item) => item.passo),
    }),
    error: null,
  }
}
