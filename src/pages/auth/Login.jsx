import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { getPerfil, upsertPerfil } from "../../lib/profileService"
import { useUserStore } from "../../store/userStore"

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  async function entrar(e) {
    e.preventDefault()

    if (!hasSupabaseConfig || !supabase) {
      setErro(
        "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY).",
      )
      return
    }

    setLoading(true)
    setErro("")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    setLoading(false)

    if (error) {
      setErro(error.message)
      return
    }

    const userId = data.user?.id
    if (userId) {
      await upsertPerfil(userId, useUserStore.getState())

      const { perfil } = await getPerfil(userId)
      if (perfil) {
        useUserStore.getState().setPerfil(perfil)
      }
    }

    navigate("/dashboard")
  }

  async function entrarComGoogle() {
    if (!hasSupabaseConfig || !supabase) {
      setErro(
        "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY).",
      )
      return
    }

    setErro("")

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setErro(error.message)
    }
  }

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={entrar}>
        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <br />
        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <br />

      <button onClick={entrarComGoogle}>Entrar com Google</button>

      <br />
      <br />

      <button onClick={() => navigate("/criar-conta")}>Criar conta</button>

      {erro && <p style={{ color: "crimson" }}>{erro}</p>}
    </div>
  )
}

export default Login
