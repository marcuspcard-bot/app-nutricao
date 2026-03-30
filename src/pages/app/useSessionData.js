import { useCallback, useEffect, useState } from "react"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { getPerfil, upsertPerfil } from "../../lib/profileService"
import { getWeeklyCheckins } from "../../lib/weeklyCheckinsService"

export function useSessionData(setPerfil) {
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [initialHistory, setInitialHistory] = useState([])
  const [sessionLoading, setSessionLoading] = useState(false)
  const [checkinsLoading, setCheckinsLoading] = useState(false)
  const [sessionError, setSessionError] = useState("")
  const [profileError, setProfileError] = useState("")
  const [checkinsError, setCheckinsError] = useState("")
  const [profileSyncing, setProfileSyncing] = useState(false)

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setSessionError("Supabase nao configurado. Algumas funcoes online estao desativadas.")
      return undefined
    }

    let isMounted = true

    async function loadSessionData() {
      setSessionLoading(true)
      setSessionError("")
      setProfileError("")
      setCheckinsError("")

      const { data, error: userError } = await supabase.auth.getUser()
      const nextUserId = data.user?.id ?? ""

      if (!isMounted) return

      if (userError) {
        setSessionError("Nao foi possivel carregar a sessao atual.")
        setSessionLoading(false)
        return
      }

      setEmail(data.user?.email ?? "")
      setUserId(nextUserId)

      if (!nextUserId) {
        setInitialHistory([])
        setSessionLoading(false)
        return
      }

      setCheckinsLoading(true)

      const [{ perfil, error: perfilErrorResult }, { checkins, error: checkinsErrorResult }] = await Promise.all([
        getPerfil(nextUserId),
        getWeeklyCheckins(nextUserId),
      ])

      if (!isMounted) return

      if (perfil) {
        setPerfil(perfil)
      }

      if (perfilErrorResult) {
        setProfileError("Nao foi possivel carregar seu perfil agora.")
      }

      if (checkinsErrorResult) {
        setCheckinsError("Nao foi possivel carregar o historico de check-ins.")
      }

      setInitialHistory(checkins)
      setCheckinsLoading(false)
      setSessionLoading(false)
    }

    loadSessionData()

    return () => {
      isMounted = false
    }
  }, [setPerfil])

  const syncPerfil = useCallback(async (userIdValue, state) => {
    if (!userIdValue) return { error: null }

    setProfileSyncing(true)
    setProfileError("")
    const { error } = await upsertPerfil(userIdValue, state)
    if (error) {
      setProfileError("Nao foi possivel sincronizar o perfil com o Supabase.")
    }
    setProfileSyncing(false)
    return { error }
  }, [])

  return {
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
  }
}
