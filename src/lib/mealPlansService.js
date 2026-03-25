import { mealLabels } from "../data/mealPlans"
import { hasSupabaseConfig, supabase } from "./supabaseClient"

function toRecipeSummary(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    calorias: row.calorias,
    proteina: `${Number(row.proteina_g ?? 0)}g`,
    tempo: `${Number(row.tempo_preparo_min ?? 0)} min`,
    isPremium: Boolean(row.is_premium),
    imageUrl: row.image_url ?? "",
  }
}

function withAllMeals(plan) {
  const normalized = {}

  for (const mealKey of Object.keys(mealLabels)) {
    normalized[mealKey] = plan[mealKey] ?? []
  }

  return normalized
}

async function fetchMealPlan(objetivo, includeImageUrl = true) {
  const columns = includeImageUrl
    ? "id, titulo, objetivo, refeicao, calorias, proteina_g, tempo_preparo_min, is_premium, image_url"
    : "id, titulo, objetivo, refeicao, calorias, proteina_g, tempo_preparo_min, is_premium"

  return supabase
    .from("receitas")
    .select(columns)
    .eq("objetivo", objetivo)
    .eq("ativo", true)
    .order("refeicao", { ascending: true })
    .order("titulo", { ascending: true })
}

export async function getMealPlanFromSupabase(objetivo) {
  if (!hasSupabaseConfig || !supabase) return { plan: null, error: null }

  let { data, error } = await fetchMealPlan(objetivo, true)

  if (error?.message?.includes("image_url")) {
    const retry = await fetchMealPlan(objetivo, false)
    data = retry.data
    error = retry.error
  }

  if (error) return { plan: null, error }

  if (!data || data.length === 0) return { plan: null, error: null }

  const grouped = data.reduce((acc, row) => {
    const mealKey = row.refeicao
    if (!acc[mealKey]) acc[mealKey] = []
    acc[mealKey].push(toRecipeSummary(row))
    return acc
  }, {})

  return { plan: withAllMeals(grouped), error: null }
}

export async function getRecipeFromSupabase(recipeId) {
  if (!hasSupabaseConfig || !supabase) return { recipe: null, error: null }

  const { data: receita, error: receitaError } = await supabase
    .from("receitas")
    .select("id, titulo, calorias, proteina_g, tempo_preparo_min, is_premium, image_url")
    .eq("id", recipeId)
    .eq("ativo", true)
    .maybeSingle()

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
    recipe: {
      id: receita.id,
      titulo: receita.titulo,
      calorias: receita.calorias,
      proteina: `${Number(receita.proteina_g ?? 0)}g`,
      tempo: `${Number(receita.tempo_preparo_min ?? 0)} min`,
      isPremium: Boolean(receita.is_premium),
      imageUrl: receita.image_url ?? "",
      ingredientes: (ingredientesResult.data ?? []).map((item) => item.descricao),
      preparo: (preparoResult.data ?? []).map((item) => item.passo),
    },
    error: null,
  }
}
