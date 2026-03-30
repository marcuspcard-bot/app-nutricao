import { useEffect, useMemo, useState } from "react"
import { createWeeklyCheckin } from "../../lib/weeklyCheckinsService"
import { objetivoLabels } from "../../data/mealPlans"
import { useUserStore } from "../../store/userStore"
import { buildChartPoints, normalizeHistory } from "./appDataUtils"
import { useSessionData } from "./useSessionData"

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
  const [savingCheckin, setSavingCheckin] = useState(false)
  const [checkinError, setCheckinError] = useState("")
  const {
    email,
    userId,
    initialHistory,
    sessionLoading,
    checkinsLoading,
    sessionError,
    profileError,
    checkinsError,
    profileSyncing,
    syncPerfil,
  } = useSessionData(setPerfil)

  const saudacao = useMemo(() => {
    if (!nome) return "Seu painel de acompanhamento"
    return `Ola, ${nome}`
  }, [nome])

  const objetivoLabel = objetivoLabels[objetivo] ?? "Nao definido"
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
    { key: "cafe", icon: "C", label: "Cafe", kcal: caloriasCafe },
    { key: "lanche", icon: "L", label: "Lanche", kcal: caloriasLanches },
    { key: "almoco", icon: "A", label: "Almoco", kcal: caloriasAlmoco },
    { key: "jantar", icon: "J", label: "Jantar", kcal: caloriasJantar },
  ]

  const normalizedHistory = useMemo(
    () => normalizeHistory(history),
    [history],
  )

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
    if (!userId) return

    syncPerfil(userId, useUserStore.getState())
  }, [
    syncPerfil,
    userId,
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
  ])

  async function addWeeklyCheckin(checkinInput) {
    if (!userId) {
      return { checkin: null, error: new Error("Usuario nao autenticado.") }
    }

    setSavingCheckin(true)
    setCheckinError("")

    const { checkin, error } = await createWeeklyCheckin(userId, {
      date: checkinInput.date,
      peso: checkinInput.peso,
    })

    if (error || !checkin) {
      setSavingCheckin(false)
      setCheckinError("Nao foi possivel salvar o check-in no Supabase.")
      return { checkin: null, error }
    }

    const nextWeight = String(checkin.peso)
    setHistory((current) => [...current, checkin])
    setPeso(nextWeight)

    await syncPerfil(userId, {
      ...useUserStore.getState(),
      peso: nextWeight,
    })

    setSavingCheckin(false)
    return { checkin, error: null }
  }

  const dataLoading = sessionLoading || checkinsLoading
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
    savingCheckin,
    sessionError,
    profileError,
    checkinsError,
    checkinError,
    profileSyncing,
    dataLoading,
    dataError,
  }
}
