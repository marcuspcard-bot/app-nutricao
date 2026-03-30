import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { getPerfil, upsertPerfil } from "../../lib/profileService"
import { useUserStore } from "../../store/userStore"
import EntryShell from "../../components/EntryShell"

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
        "Conexao com o Supabase nao configurada. Revise as variaveis de ambiente para continuar.",
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
      setErro("Nao foi possivel entrar com esse email e senha. Revise os dados e tente novamente.")
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
        "Conexao com o Supabase nao configurada. Revise as variaveis de ambiente para continuar.",
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
      setErro("Nao foi possivel iniciar o login com Google agora.")
    }
  }

  return (
    <EntryShell
      eyebrow="Acesso"
      title="Acesse seu painel"
      description="Retome seu acompanhamento com historico, cardapios e dados pessoais sincronizados em um unico lugar."
      footer="Se este for seu primeiro acesso, crie uma conta para salvar sua evolucao e organizar sua rotina."
      highlights={[
        { title: "Historico sincronizado", description: "Check-ins e dados da sua jornada reunidos com seguranca." },
        { title: "Entrada flexivel", description: "Acesse com email e senha ou continue com Google." },
      ]}
    >
      <form className="entry-actions" onSubmit={entrar}>
        <label className="entry-field">
          <span>Email</span>
          <input
            type="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="entry-field">
          <span>Senha</span>
          <input
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </label>

        {erro && <p className="entry-feedback entry-feedback-error">{erro}</p>}

        <button className="entry-primary" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="entry-actions">
        <button className="entry-secondary" onClick={entrarComGoogle}>Continuar com Google</button>
        <button className="entry-secondary" onClick={() => navigate("/criar-conta")}>Criar nova conta</button>
      </div>
    </EntryShell>
  )
}

export default Login
