import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { getPerfil, upsertPerfil } from "../../lib/profileService"
import { useUserStore } from "../../store/userStore"
import { objetivoLabels } from "../../data/mealPlans"
import "./nutritionApp.css"

function Dashboard() {
  const navigate = useNavigate()
  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })

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
      <section className="hero-card hero-dash hero-dashboard-classic">
        <div className="hero-dashboard-headerline">
          <div>
            <p className="eyebrow eyebrow-soft">Nutrition plan</p>
            <h1>{saudacao}</h1>
            <p className="muted muted-soft">{email || objetivoLabel}</p>
          </div>
          <span className={`dashboard-badge ${isPremium ? "dashboard-badge-premium" : ""}`}>
            {isPremium ? "Premium" : "Free"}
          </span>
        </div>

        <div className="dashboard-ring-zone">
          <article className="dashboard-side-metric">
            <strong>{tmb || "-"}</strong>
            <span>base</span>
          </article>

          <div
            className="dashboard-goal-ring"
            style={{ "--goal-fill": `${balanceScore}%` }}
          >
            <div className="dashboard-goal-inner">
              <span>meta diaria</span>
              <strong>{caloriasObjetivo || "-"}</strong>
              <small>kcal</small>
            </div>
          </div>

          <article className="dashboard-side-metric">
            <strong>{tdee || "-"}</strong>
            <span>gasto</span>
          </article>
        </div>

        <div className="dashboard-hero-footer">
          <div>
            <p>{objetivoLabel}</p>
            <small>{hoje}</small>
          </div>
          <small>{caloriasRestantes ? `${caloriasRestantes} kcal livres` : "Plano calibrado"}</small>
        </div>

        <div className="dashboard-hero-actions">
          <button className="primary-action primary-action-hero" onClick={() => navigate("/cardapios")}>
            Ver cardapios
          </button>
        </div>
      </section>

      <section className="dashboard-meal-nav">
        {meals.map((meal) => (
          <article className="dashboard-meal-pill" key={meal.key}>
            <span>{meal.icon}</span>
            <strong>{meal.label}</strong>
            <small>{meal.kcal ? `${meal.kcal} kcal` : "-"}</small>
          </article>
        ))}
      </section>

      <section className="meal-block dashboard-intake-panel">
        <div className="meal-head">
          <h2>Distribuicao nutricional</h2>
          <span>Hoje</span>
        </div>
        <div className="intake-rows">
          <article>
            <div className="intake-label-row">
              <strong>Calorias</strong>
              <span>{caloriasObjetivo ? `${caloriasObjetivo} / ${caloriasObjetivo} kcal` : "-"}</span>
            </div>
            <div className="progress-line"><i style={{ width: "100%" }} /></div>
          </article>
          <article>
            <div className="intake-label-row">
              <strong>Carboidratos</strong>
              <span>{carboMeta ? `${carboMeta} g` : "-"}</span>
            </div>
            <div className="progress-line carbs"><i style={{ width: "78%" }} /></div>
          </article>
          <article>
            <div className="intake-label-row">
              <strong>Proteina</strong>
              <span>{proteinaMeta ? `${proteinaMeta} g` : "-"}</span>
            </div>
            <div className="progress-line protein"><i style={{ width: "84%" }} /></div>
          </article>
          <article>
            <div className="intake-label-row">
              <strong>Gorduras</strong>
              <span>{gorduraMeta ? `${gorduraMeta} g` : "-"}</span>
            </div>
            <div className="progress-line fat"><i style={{ width: "64%" }} /></div>
          </article>
        </div>
      </section>

      <section className="meal-block dashboard-overview-panel">
        <div className="meal-head">
          <h2>Resumo metabolico</h2>
          <span>{balanceScore ? `${balanceScore}%` : "n/d"}</span>
        </div>
        <div className="dashboard-overview-grid">
          <article>
            <strong>{caloriasObjetivo || "-"}</strong>
            <span>meta calorica</span>
          </article>
          <article>
            <strong>{tdee || "-"}</strong>
            <span>gasto diario</span>
          </article>
          <article>
            <strong>{proteinaMeta || "-"}</strong>
            <span>proteina alvo</span>
          </article>
        </div>
      </section>

      <section className="meal-block dashboard-summary-panel">
        <div className="meal-head">
          <h2>Resumo corporal</h2>
          <span>{objetivoLabel}</span>
        </div>
        <div className="profile-grid">
          <p><strong>Idade</strong><span>{idade || "-"}</span></p>
          <p><strong>Peso</strong><span>{peso ? `${peso} kg` : "-"}</span></p>
          <p><strong>Altura</strong><span>{altura ? `${altura} cm` : "-"}</span></p>
          <p><strong>Atividade</strong><span>{atividade || "-"}</span></p>
        </div>
      </section>

      <section className="meal-block dashboard-day-panel">
        <div className="meal-head">
          <h2>Plano de refeicoes</h2>
          <span>Organizado</span>
        </div>
        <div className="day-meal-list">
          <article>
            <div>
              <strong>Cafe da manha</strong>
              <p>Primeira refeicao com energia estavel e boa saciedade.</p>
            </div>
            <span>{caloriasCafe ? `${caloriasCafe} kcal` : "-"}</span>
          </article>
          <article>
            <div>
              <strong>Almoco</strong>
              <p>Faixa principal do dia com densidade nutricional maior.</p>
            </div>
            <span>{caloriasAlmoco ? `${caloriasAlmoco} kcal` : "-"}</span>
          </article>
          <article>
            <div>
              <strong>Jantar</strong>
              <p>Fechamento controlado para manter equilibrio da meta.</p>
            </div>
            <span>{caloriasJantar ? `${caloriasJantar} kcal` : "-"}</span>
          </article>
        </div>
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
