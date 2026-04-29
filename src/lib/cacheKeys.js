export const cacheKeys = {
  profile: (userId) => `profile:${userId}`,
  checkins: (userId) => `checkins:${userId}`,
  mealPlan: (objetivo) => `meal-plan:${objetivo}`,
  mealCardImages: "meal-card-images",
  recipe: (recipeId) => `recipe:${recipeId}`,
  communityFeedFirstPage: "community:feed:first-page",
}
