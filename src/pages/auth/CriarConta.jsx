import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { upsertPerfil } from "../../lib/profileService"
import { useUserStore } from "../../store/userStore"
import EntryShell from "../../components/EntryShell"

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
        "Conexao com o Supabase nao configurada. Revise as variaveis de ambiente para continuar.",
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
      setErro("Nao foi possivel criar sua conta agora. Tente novamente em instantes.")
      return
    }

    const sessionAtiva = Boolean(data.session)

    if (sessionAtiva) {
      await upsertPerfil(data.user?.id, useUserStore.getState())
      navigate("/dashboard")
      return
    }

    setMensagem("Conta criada com sucesso. Verifique seu email para confirmar o cadastro.")
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
      setErro("Nao foi possivel iniciar o cadastro com Google agora.")
    }
  }

  return (
    <EntryShell
      eyebrow="Cadastro"
      title="Crie sua conta profissional"
      description="Finalize seu acesso para salvar seus dados, sua evolucao e seus cardapios com continuidade e seguranca."
      footer="Depois do cadastro, o painel passa a manter sua jornada sincronizada e pronta para acompanhamento."
      highlights={[
        { title: "Perfil salvo", description: "Suas informacoes iniciais ficam conectadas a sua conta." },
        { title: "Continuidade do plano", description: "Retome sua rotina sem perder o progresso registrado." },
      ]}
    >
      <form className="entry-actions" onSubmit={criarConta}>
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
            placeholder="Crie uma senha com pelo menos 6 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {erro && <p className="entry-feedback entry-feedback-error">{erro}</p>}
        {mensagem && <p className="entry-feedback entry-feedback-success">{mensagem}</p>}

        <button className="entry-primary" type="submit" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <div className="entry-actions">
        <button className="entry-secondary" onClick={entrarComGoogle}>Continuar com Google</button>
        <button className="entry-secondary" onClick={() => navigate("/login")}>Voltar para login</button>
      </div>
    </EntryShell>
  )
}

export default CriarConta
