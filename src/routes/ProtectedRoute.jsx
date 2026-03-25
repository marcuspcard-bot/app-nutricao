import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient"

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(hasSupabaseConfig)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined

    let isMounted = true

    async function verificarSessao() {
      const { data } = await supabase.auth.getSession()

      if (!isMounted) return

      setAuthenticated(Boolean(data.session))
      setLoading(false)
    }

    verificarSessao()

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === "SIGNED_OUT") {
        setAuthenticated(false)
        return
      }

      setAuthenticated(Boolean(session))
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  if (loading) return <p>Carregando sessao...</p>

  if (!authenticated) return <Navigate to="/login" replace />

  return children
}

export default ProtectedRoute
