import { cacheKeys } from "./cacheKeys"
import { fetchCachedResource } from "./dataClient"
import { getMealPlanFromSupabase, getRecipeFromSupabase } from "./mealPlansService"
import { listCommunityPosts } from "./communityService"
import { hasSupabaseConfig } from "./supabaseClient"

const COMMUNITY_PRELOAD_MAX_AGE_MS = 60 * 1000
const MEAL_PLAN_PRELOAD_MAX_AGE_MS = 30 * 60 * 1000
const RECIPE_PRELOAD_MAX_AGE_MS = 6 * 60 * 60 * 1000

export async function preloadCommunityFeed() {
  if (!hasSupabaseConfig) return

  await fetchCachedResource({
    cacheKey: cacheKeys.communityFeedFirstPage,
    label: "preload:community:first-page",
    retries: 1,
    maxAgeMs: COMMUNITY_PRELOAD_MAX_AGE_MS,
    preferFreshCache: true,
    requestFn: () => listCommunityPosts({ limit: 10, offset: 0 }),
    getData: (response) => ({
      posts: response.posts,
      hasMorePosts: response.hasMore,
      source: "supabase",
    }),
    fallbackData: null,
  })
}

export async function preloadMealPlanResources(objetivo) {
  if (!hasSupabaseConfig || !objetivo) return

  const planResult = await fetchCachedResource({
    cacheKey: cacheKeys.mealPlan(objetivo),
    label: `preload:meal-plan:${objetivo}`,
    retries: 1,
    maxAgeMs: MEAL_PLAN_PRELOAD_MAX_AGE_MS,
    preferFreshCache: true,
    requestFn: () => getMealPlanFromSupabase(objetivo),
    getData: (response) => response.plan,
    fallbackData: null,
  })

  const plan = planResult.data
  if (!plan) return

  const firstRecipeIds = Object.values(plan)
    .flat()
    .slice(0, 6)
    .map((recipe) => recipe.id)
    .filter(Boolean)

  await Promise.all(
    firstRecipeIds.map((recipeId) =>
      fetchCachedResource({
        cacheKey: cacheKeys.recipe(recipeId),
        label: `preload:recipe:${recipeId}`,
        retries: 1,
        maxAgeMs: RECIPE_PRELOAD_MAX_AGE_MS,
        preferFreshCache: true,
        requestFn: () => getRecipeFromSupabase(recipeId),
        getData: (response) => response.recipe,
        fallbackData: null,
      }),
    ),
  )
}
