import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { getPerfil, upsertPerfil } from "../../lib/profileService"
import { useUserStore } from "../../store/userStore"
import { objetivoLabels } from "../../data/mealPlans"
import "./nutritionApp.css"

function Dashboard() {
  const navigate = useNavigate()

  const nome = useUserStore((state) => state.nome)
  const idade = useUserStore((state) => state.idade)
  const peso = useUserStore((state) => state.peso)
  const altura = useUserStore((state) => state.altura)
  const atividade = useUserStore((state) => state.atividade)
  const objetivo = useUserStore((state) => state.objetivo)
  const tmb = useUserStore((state) => state.tmb)
  const tdee = useUserStore((state) => state.tdee)
  const caloriasObjetivo = useUserStore((state) => state.caloriasObjetivo)
  const isPremium = useUserStore((state) => state.isPremium)
  const setPremium = useUserStore((state) => state.setPremium)
  const resetOnboarding = useUserStore((state) => state.resetOnboarding)
  const setPerfil = useUserStore((state) => state.setPerfil)

  const [email, setEmail] = useState("")

  const saudacao = useMemo(() => {
    if (!nome) return "Seu painel nutricional"
    return `Ola, ${nome}`
  }, [nome])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined

    let isMounted = true

    async function carregarSessaoEPerfil() {
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id

      if (!isMounted) return
      setEmail(data.user?.email ?? "")

      if (!userId) return

      await upsertPerfil(userId, useUserStore.getState())
      const { perfil } = await getPerfil(userId)

      if (!isMounted || !perfil) return
      setPerfil(perfil)
    }

    carregarSessaoEPerfil()

    return () => {
      isMounted = false
    }
  }, [setPerfil])

  async function sair() {
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut()
    }
    navigate("/")
  }

  function recomecarOnboarding() {
    resetOnboarding()
    navigate("/nome")
  }

  return (
    <main className="app-mobile-shell">
      <section className="hero-card hero-dash">
        <p className="eyebrow">Dashboard</p>
        <h1>{saudacao}</h1>
        <p className="muted">{email || "Conta sem email carregado"}</p>

        <div className="chip-row">
          <span className="chip">Objetivo: {objetivoLabels[objetivo] ?? "Nao definido"}</span>
          <span className={`chip ${isPremium ? "chip-premium" : "chip-free"}`}>
            {isPremium ? "Premium" : "Gratuito"}
          </span>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <p>TMB</p>
          <strong>{tmb ? `${tmb} kcal` : "-"}</strong>
        </article>
        <article className="metric-card">
          <p>TDEE</p>
          <strong>{tdee ? `${tdee} kcal` : "-"}</strong>
        </article>
        <article className="metric-card metric-highlight">
          <p>Meta diaria</p>
          <strong>{caloriasObjetivo ? `${caloriasObjetivo} kcal` : "-"}</strong>
        </article>
      </section>

      <section className="meal-block">
        <div className="meal-head">
          <h2>Seus dados</h2>
          <span>Onboarding</span>
        </div>
        <div className="profile-grid">
          <p><strong>Idade</strong><span>{idade || "-"}</span></p>
          <p><strong>Peso</strong><span>{peso ? `${peso} kg` : "-"}</span></p>
          <p><strong>Altura</strong><span>{altura ? `${altura} cm` : "-"}</span></p>
          <p><strong>Atividade</strong><span>{atividade || "-"}</span></p>
        </div>
      </section>

      <section className="meal-block">
        <div className="meal-head">
          <h2>Plano alimentar</h2>
          <span>Personalizado</span>
        </div>
        <p className="muted">Escolha receitas por refeicao com base na sua meta.</p>
        <button className="primary-action" onClick={() => navigate("/cardapios")}>Ver cardapios</button>
      </section>

      <section className="inline-actions">
        <button className="ghost-action" onClick={() => setPremium(!isPremium)}>
          {isPremium ? "Trocar para gratuito" : "Simular premium"}
        </button>
        <button className="ghost-action" onClick={recomecarOnboarding}>Refazer onboarding</button>
        <button className="ghost-action danger" onClick={sair}>Sair</button>
      </section>
    </main>
  )
}

export default Dashboard
