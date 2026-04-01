import { hasSupabaseConfig, supabase } from "./supabaseClient"

function normalizeMealImageKey(key) {
  if (key === "cafe_da_manha") return "cafe"
  if (key === "lanche_manha" || key === "lanche_tarde") return "lanche"
  return key
}

export function getMealImageUrl(imagesByKey, mealKey) {
  const normalizedKey = normalizeMealImageKey(mealKey)
  return imagesByKey?.[normalizedKey] ?? ""
}

export async function getMealCardImages() {
  if (!hasSupabaseConfig || !supabase) return { imagesByKey: {}, error: null }

  const { data, error } = await supabase
    .from("meal_card_images")
    .select("key, image_url")
    .eq("active", true)

  if (error) return { imagesByKey: {}, error }

  return {
    imagesByKey: (data ?? []).reduce((acc, item) => {
      acc[item.key] = item.image_url
      return acc
    }, {}),
    error: null,
  }
}
