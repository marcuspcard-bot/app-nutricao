import { useCallback, useEffect, useState } from "react"
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient"
import { getPerfil, upsertPerfil } from "../lib/profileService"
import { getWeeklyCheckins } from "../lib/weeklyCheckinsService"

const missingSupabaseConfigMessage = "Supabase nao configurado. Algumas funcoes online estao desativadas."
const SESSION_BOOTSTRAP_TIMEOUT_MS = 7000

export function useSessionData(setPerfil) {
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [initialHistory, setInitialHistory] = useState([])
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [checkinsLoading, setCheckinsLoading] = useState(false)
  const [sessionError, setSessionError] = useState(hasSupabaseConfig ? "" : missingSupabaseConfigMessage)
  const [profileError, setProfileError] = useState("")
  const [checkinsError, setCheckinsError] = useState("")
  const [profileSyncing, setProfileSyncing] = useState(false)

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return undefined
    }

    let isMounted = true

    function stopLoadingState() {
      if (!isMounted) return
      setCheckinsLoading(false)
      setSessionLoading(false)
      setProfileLoaded(true)
    }

    async function loadSessionData() {
      setSessionLoading(true)
      setProfileLoaded(false)
      setSessionError("")
      setProfileError("")
      setCheckinsError("")

      try {
        const sessionPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("session-timeout")), SESSION_BOOTSTRAP_TIMEOUT_MS)
        })
        const { data, error: userError } = await Promise.race([sessionPromise, timeoutPromise])
        const nextUserId = data.user?.id ?? ""

        if (!isMounted) return

        if (userError) {
          setSessionError("Nao foi possivel carregar a sessao atual.")
          stopLoadingState()
          return
        }

        setEmail(data.user?.email ?? "")
        setUserId(nextUserId)

        if (!nextUserId) {
          setInitialHistory([])
          stopLoadingState()
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
        stopLoadingState()
      } catch {
        if (!isMounted) return
        setSessionError("Nao foi possivel conectar ao Supabase agora.")
        setInitialHistory([])
        stopLoadingState()
      }
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
    profileLoaded,
    sessionLoading,
    checkinsLoading,
    sessionError,
    profileError,
    checkinsError,
    profileSyncing,
    syncPerfil,
  }
}
