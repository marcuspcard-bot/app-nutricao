import { useCallback, useEffect, useRef, useState } from "react"
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient"
import { getPerfil, upsertPerfil } from "../lib/profileService"
import { getWeeklyCheckins } from "../lib/weeklyCheckinsService"
import { fetchCachedResource, runWithRetry } from "../lib/dataClient"
import { readCachedResource, writeCachedResource } from "../lib/cacheClient"
import { cacheKeys } from "../lib/cacheKeys"

const missingSupabaseConfigMessage = "Supabase não configurado. Algumas funções on-line estão desativadas."
const SESSION_BOOTSTRAP_TIMEOUT_MS = 7000
const PROFILE_MAX_AGE_MS = 5 * 60 * 1000
const CHECKINS_MAX_AGE_MS = 2 * 60 * 1000

export function useSessionData(setPerfil) {
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [initialHistory, setInitialHistory] = useState([])
  const [profileLoaded, setProfileLoaded] = useState(!hasSupabaseConfig)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [checkinsLoading, setCheckinsLoading] = useState(false)
  const [profileRefreshing, setProfileRefreshing] = useState(false)
  const [checkinsRefreshing, setCheckinsRefreshing] = useState(false)
  const [sessionError, setSessionError] = useState(hasSupabaseConfig ? "" : missingSupabaseConfigMessage)
  const [profileError, setProfileError] = useState("")
  const [checkinsError, setCheckinsError] = useState("")
  const [profileStale, setProfileStale] = useState(false)
  const [checkinsStale, setCheckinsStale] = useState(false)
  const [profileSyncing, setProfileSyncing] = useState(false)
  const isMountedRef = useRef(true)
  const latestProfileSyncIdRef = useRef(0)

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
      setProfileRefreshing(false)
      setCheckinsRefreshing(false)
    }

    async function loadSessionData() {
      setSessionLoading(true)
      setProfileLoaded(false)
      setCheckinsLoading(false)
      setProfileRefreshing(false)
      setCheckinsRefreshing(false)
      setSessionError("")
      setProfileError("")
      setCheckinsError("")
      setProfileStale(false)
      setCheckinsStale(false)

      try {
        const sessionPromise = runWithRetry(
          () => supabase.auth.getUser(),
          { label: "auth:getUser", retries: 1 },
        )
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("session-timeout")), SESSION_BOOTSTRAP_TIMEOUT_MS)
        })
        const { data, error: userError } = await Promise.race([sessionPromise, timeoutPromise])
        const nextUserId = data.user?.id ?? ""

        if (!isMounted) return

        if (userError) {
          setSessionError("Não foi possível carregar a sessão atual.")
          stopLoadingState()
          return
        }

        setEmail(data.user?.email ?? "")
        setUserId(nextUserId)
        setSessionLoading(false)

        if (!nextUserId) {
          setInitialHistory([])
          stopLoadingState()
          return
        }

        const [cachedProfile, cachedCheckins] = await Promise.all([
          readCachedResource(cacheKeys.profile(nextUserId)),
          readCachedResource(cacheKeys.checkins(nextUserId)),
        ])

        if (!isMounted) return

        if (cachedProfile.exists && cachedProfile.data) {
          setPerfil(cachedProfile.data)
          setProfileLoaded(true)
        }

        const hasCachedCheckins = cachedCheckins.exists && Array.isArray(cachedCheckins.data)

        if (hasCachedCheckins) {
          setInitialHistory(cachedCheckins.data)
          setCheckinsLoading(false)
        } else {
          setCheckinsLoading(true)
        }

        setProfileRefreshing(true)
        setCheckinsRefreshing(true)

        const [profileResult, checkinsResult] = await Promise.all([
          fetchCachedResource({
            cacheKey: cacheKeys.profile(nextUserId),
            label: "profile:load",
            retries: 1,
            maxAgeMs: PROFILE_MAX_AGE_MS,
            requestFn: () => getPerfil(nextUserId),
            getData: (result) => result.perfil,
          }),
          fetchCachedResource({
            cacheKey: cacheKeys.checkins(nextUserId),
            label: "checkins:load",
            retries: 1,
            maxAgeMs: CHECKINS_MAX_AGE_MS,
            requestFn: () => getWeeklyCheckins(nextUserId),
            getData: (result) => result.checkins,
            fallbackData: [],
          }),
        ])

        if (!isMounted) return

        if (profileResult.data) {
          setPerfil(profileResult.data)
        }

        setProfileLoaded(true)
        setProfileRefreshing(false)
        setProfileStale(profileResult.isStale)

        if (profileResult.error && !profileResult.fromCache) {
          setProfileError("Não foi possível carregar seu perfil agora.")
        } else if (profileResult.error && profileResult.fromCache) {
          setProfileError("Sem conexão no momento. Exibindo perfil salvo neste aparelho.")
        }

        setInitialHistory(Array.isArray(checkinsResult.data) ? checkinsResult.data : [])
        setCheckinsLoading(false)
        setCheckinsRefreshing(false)
        setCheckinsStale(checkinsResult.isStale)

        if (checkinsResult.error && !checkinsResult.fromCache) {
          setCheckinsError("Não foi possível carregar o histórico de check-ins.")
        } else if (checkinsResult.error && checkinsResult.fromCache) {
          setCheckinsError("Sem conexão no momento. Exibindo check-ins salvos neste aparelho.")
        }
      } catch {
        if (!isMounted) return
        setSessionError("Não foi possível conectar ao Supabase agora.")
        setInitialHistory([])
        stopLoadingState()
      }
    }

    loadSessionData()

    return () => {
      isMounted = false
    }
  }, [setPerfil])

  useEffect(() => () => {
    isMountedRef.current = false
  }, [])

  const syncPerfil = useCallback(async (userIdValue, state) => {
    if (!userIdValue) return { error: null }

    const syncId = latestProfileSyncIdRef.current + 1
    latestProfileSyncIdRef.current = syncId

    if (isMountedRef.current) {
      setProfileSyncing(true)
      setProfileError("")
    }

    const { error } = await upsertPerfil(userIdValue, state)

    const isLatestSync = latestProfileSyncIdRef.current === syncId
    if (!isMountedRef.current || !isLatestSync) {
      return { error }
    }

    if (error) {
      setProfileError("Não foi possível sincronizar o perfil com o Supabase.")
    } else {
      await writeCachedResource(cacheKeys.profile(userIdValue), state)
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
    profileRefreshing,
    checkinsRefreshing,
    sessionError,
    profileError,
    checkinsError,
    profileStale,
    checkinsStale,
    profileSyncing,
    syncPerfil,
  }
}
