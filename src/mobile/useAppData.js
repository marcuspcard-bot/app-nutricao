import { useEffect, useMemo, useState } from "react"
import { createWeeklyCheckin } from "../lib/weeklyCheckinsService"
import { objetivoLabels } from "../data/mealPlans"
import { useUserStore } from "../store/userStore"
import { getMealCardImages } from "../lib/mealCardImagesService"
import { buildChartPoints, normalizeHistory } from "./appDataUtils"
import { useSessionData } from "./useSessionData"
import { fetchCachedResource } from "../lib/dataClient"
import { readCachedResource, writeCachedResource } from "../lib/cacheClient"
import { cacheKeys } from "../lib/cacheKeys"
import { preloadCommunityFeed, preloadMealPlanResources } from "../lib/preloadService"

const MEAL_CARD_IMAGES_MAX_AGE_MS = 12 * 60 * 60 * 1000

export function useAppData() {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })

  const nome = useUserStore((state) => state.nome)
  const idade = useUserStore((state) => state.idade)
  const peso = useUserStore((state) => state.peso)
  const altura = useUserStore((state) => state.altura)
  const sexo = useUserStore((state) => state.sexo)
  const atividade = useUserStore((state) => state.atividade)
  const objetivo = useUserStore((state) => state.objetivo)
  const tmb = useUserStore((state) => state.tmb)
  const tdee = useUserStore((state) => state.tdee)
  const caloriasObjetivo = useUserStore((state) => state.caloriasObjetivo)
  const isPremium = useUserStore((state) => state.isPremium)
  const setPremium = useUserStore((state) => state.setPremium)
  const setPerfil = useUserStore((state) => state.setPerfil)
  const setPeso = useUserStore((state) => state.setPeso)

  const [history, setHistory] = useState([])
  const [mealCardImagesByKey, setMealCardImagesByKey] = useState({})
  const [mealCardImagesLoading, setMealCardImagesLoading] = useState(true)
  const [mealCardImagesRefreshing, setMealCardImagesRefreshing] = useState(false)
  const [mealCardImagesStale, setMealCardImagesStale] = useState(false)
  const [savingCheckin, setSavingCheckin] = useState(false)
  const [checkinError, setCheckinError] = useState("")
  const {
    email,
    userId,
    initialHistory,
    profileLoaded,
    sessionLoading,
    checkinsLoading,
    profileRefreshing,
    checkinsRefreshing,
    sessionError,
    profileError,
    checkinsError,
    profileStale,
    checkinsStale,
    profileSyncing,
    syncPerfil,
  } = useSessionData(setPerfil)

  const saudacao = useMemo(() => {
    if (!nome) return "Seu painel de acompanhamento"
    return `Ola, ${nome}`
  }, [nome])

  const objetivoLabel = objetivoLabels[objetivo] ?? "Não definido"
  const caloriasCafe = caloriasObjetivo ? Math.round(caloriasObjetivo * 0.25) : 0
  const caloriasAlmoco = caloriasObjetivo ? Math.round(caloriasObjetivo * 0.35) : 0
  const caloriasJantar = caloriasObjetivo ? Math.round(caloriasObjetivo * 0.25) : 0
  const caloriasLanches = caloriasObjetivo ? Math.round(caloriasObjetivo * 0.15) : 0
  const proteinaMeta = caloriasObjetivo ? Math.round((caloriasObjetivo * 0.3) / 4) : 0
  const carboMeta = caloriasObjetivo ? Math.round((caloriasObjetivo * 0.45) / 4) : 0
  const gorduraMeta = caloriasObjetivo ? Math.round((caloriasObjetivo * 0.25) / 9) : 0
  const balanceScore = caloriasObjetivo && tdee ? Math.min(100, Math.round((caloriasObjetivo / tdee) * 100)) : 0
  const caloriasRestantes = caloriasObjetivo && tdee ? Math.max(0, tdee - caloriasObjetivo) : 0
  const meals = [
    { key: "cafe", label: "Cafe", kcal: caloriasCafe, imageUrl: mealCardImagesByKey.cafe ?? "" },
    { key: "lanche", label: "Lanche", kcal: caloriasLanches, imageUrl: mealCardImagesByKey.lanche ?? "" },
    { key: "almoco", label: "Almoco", kcal: caloriasAlmoco, imageUrl: mealCardImagesByKey.almoco ?? "" },
    { key: "jantar", label: "Jantar", kcal: caloriasJantar, imageUrl: mealCardImagesByKey.jantar ?? "" },
  ]

  const normalizedHistory = useMemo(() => normalizeHistory(history), [history])
  const latestCheckin = normalizedHistory[normalizedHistory.length - 1] ?? null
  const previousCheckin = normalizedHistory[normalizedHistory.length - 2] ?? null
  const weightDelta =
    latestCheckin && previousCheckin
      ? Number((latestCheckin.peso - previousCheckin.peso).toFixed(1))
      : 0
  const chartPoints = useMemo(() => buildChartPoints(normalizedHistory), [normalizedHistory])

  useEffect(() => {
    setHistory(initialHistory)
  }, [initialHistory])

  useEffect(() => {
    let isMounted = true

    async function loadMealCardImages() {
      const cachedImages = await readCachedResource(cacheKeys.mealCardImages)
      if (!isMounted) return

      if (cachedImages.exists && cachedImages.data) {
        setMealCardImagesByKey(cachedImages.data)
        setMealCardImagesLoading(false)
      } else {
        setMealCardImagesLoading(true)
      }

      setMealCardImagesRefreshing(true)
      const result = await fetchCachedResource({
        cacheKey: cacheKeys.mealCardImages,
        label: "meal-images:load",
        retries: 1,
        maxAgeMs: MEAL_CARD_IMAGES_MAX_AGE_MS,
        requestFn: () => getMealCardImages(),
        getData: (response) => response.imagesByKey,
        fallbackData: {},
      })

      if (!isMounted) return

      setMealCardImagesByKey(result.data ?? {})
      setMealCardImagesLoading(false)
      setMealCardImagesRefreshing(false)
      setMealCardImagesStale(result.isStale)
    }

    loadMealCardImages()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!objetivo) return

    preloadMealPlanResources(objetivo)
    preloadCommunityFeed()
  }, [objetivo])

  async function addWeeklyCheckin(checkinInput) {
    if (!userId) {
      return { checkin: null, error: new Error("Usuário não autenticado.") }
    }

    setSavingCheckin(true)
    setCheckinError("")

    const { checkin, error } = await createWeeklyCheckin(userId, {
      date: checkinInput.date,
      peso: checkinInput.peso,
    })

    if (error || !checkin) {
      setSavingCheckin(false)
      setCheckinError("Não foi possível salvar o check-in no Supabase.")
      return { checkin: null, error }
    }

    const nextWeight = String(checkin.peso)
    const nextHistory = [...history, checkin]
    setHistory(nextHistory)
    setPeso(nextWeight)
    await writeCachedResource(cacheKeys.checkins(userId), nextHistory)

    await syncPerfil(userId, {
      ...useUserStore.getState(),
      peso: nextWeight,
    })

    setSavingCheckin(false)
    return { checkin, error: null }
  }

  const initialAppReady = profileLoaded && !sessionLoading && !checkinsLoading && !mealCardImagesLoading
  const dataLoading = sessionLoading || checkinsLoading || mealCardImagesLoading
  const dataRefreshing = profileRefreshing || checkinsRefreshing || mealCardImagesRefreshing
  const dataStale = profileStale || checkinsStale || mealCardImagesStale
  const dataError = [sessionError, profileError, checkinsError, checkinError].find(Boolean) ?? ""

  return {
    hoje,
    nome,
    idade,
    peso,
    altura,
    sexo,
    atividade,
    objetivo,
    tmb,
    tdee,
    caloriasObjetivo,
    proteinaMeta,
    carboMeta,
    gorduraMeta,
    caloriasRestantes,
    balanceScore,
    meals,
    mealCardImagesByKey,
    mealCardImagesLoading,
    mealCardImagesRefreshing,
    mealCardImagesStale,
    email,
    saudacao,
    objetivoLabel,
    isPremium,
    setPremium,
    history: normalizedHistory,
    latestCheckin,
    previousCheckin,
    weightDelta,
    chartPoints,
    addWeeklyCheckin,
    sessionLoading,
    checkinsLoading,
    profileRefreshing,
    checkinsRefreshing,
    savingCheckin,
    sessionError,
    profileError,
    checkinsError,
    checkinError,
    profileSyncing,
    profileStale,
    checkinsStale,
    profileLoaded,
    initialAppReady,
    dataLoading,
    dataRefreshing,
    dataStale,
    dataError,
  }
}
