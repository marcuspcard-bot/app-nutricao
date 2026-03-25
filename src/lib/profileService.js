import { hasSupabaseConfig, supabase } from "./supabaseClient"

function toNullableNumber(value) {
  if (value === "" || value == null) return null

  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function hasOnboardingData(data) {
  return Boolean(
    data.nome ||
      data.idade ||
      data.peso ||
      data.altura ||
      data.sexo ||
      data.atividade ||
      data.objetivo ||
      data.tmb ||
      data.tdee ||
      data.caloriasObjetivo,
  )
}

export async function upsertPerfil(userId, data) {
  if (!hasSupabaseConfig || !supabase || !userId) return { error: null }

  if (!hasOnboardingData(data)) return { error: null }

  const payload = {
    user_id: userId,
    nome: data.nome || null,
    idade: toNullableNumber(data.idade),
    peso: toNullableNumber(data.peso),
    altura: toNullableNumber(data.altura),
    sexo: data.sexo || null,
    atividade: data.atividade || null,
    objetivo: data.objetivo || null,
    tmb: toNullableNumber(data.tmb),
    tdee: toNullableNumber(data.tdee),
    calorias_objetivo: toNullableNumber(data.caloriasObjetivo),
  }

  const { error } = await supabase.from("perfis").upsert(payload, {
    onConflict: "user_id",
  })

  return { error }
}

export async function getPerfil(userId) {
  if (!hasSupabaseConfig || !supabase || !userId) return { perfil: null, error: null }

  const { data, error } = await supabase
    .from("perfis")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  return { perfil: data, error }
}
