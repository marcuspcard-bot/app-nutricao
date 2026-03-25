import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { upsertPerfil } from "../../lib/profileService"
import { useUserStore } from "../../store/userStore"

function CriarConta() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [mensagem, setMensagem] = useState("")

  async function criarConta(e) {
    e.preventDefault()

    if (!hasSupabaseConfig || !supabase) {
      setErro(
        "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY).",
      )
      return
    }

    setLoading(true)
    setErro("")
    setMensagem("")

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    })

    setLoading(false)

    if (error) {
      setErro(error.message)
      return
    }

    const sessionAtiva = Boolean(data.session)

    if (sessionAtiva) {
      await upsertPerfil(data.user?.id, useUserStore.getState())
      navigate("/dashboard")
      return
    }

    setMensagem("Conta criada. Confira seu email para confirmar cadastro.")
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
      <h1>Crie sua conta</h1>

      <form onSubmit={criarConta}>
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
          minLength={6}
          required
        />

        <br />
        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <br />

      <button onClick={entrarComGoogle}>Entrar com Google</button>

      <br />
      <br />

      <button onClick={() => navigate("/login")}>Já tenho conta</button>

      {erro && <p style={{ color: "crimson" }}>{erro}</p>}
      {mensagem && <p style={{ color: "green" }}>{mensagem}</p>}
    </div>
  )
}

export default CriarConta
