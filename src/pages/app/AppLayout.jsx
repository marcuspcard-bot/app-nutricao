import { useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { useUserStore } from "../../store/userStore"
import { appSections } from "./appSections"
import { useAppData } from "./useAppData"
import DashboardGoalRing from "./components/DashboardGoalRing"
import BottomNav from "./components/BottomNav"
import "./nutritionApp.css"

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const resetOnboarding = useUserStore((state) => state.resetOnboarding)
  const appData = useAppData()
  const [menuOpen, setMenuOpen] = useState(false)
  const isDashboardHome = location.pathname === "/app"
  const currentSection = appSections.find((section) => section.to === location.pathname)
  const compactTitle = currentSection?.label ?? "Seu painel"
  const compactHelper = currentSection?.helper ?? appData.objetivoLabel

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
      {menuOpen && (
        <button
          type="button"
          className="dashboard-drawer-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`dashboard-drawer ${menuOpen ? "is-open" : ""}`}>
        <div className="dashboard-drawer-head">
          <div>
            <p className="eyebrow">Navegacao</p>
            <h2>Seu painel</h2>
          </div>
          <button
            type="button"
            className="dashboard-icon-button dashboard-close-button"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          >
            <span />
            <span />
          </button>
        </div>

        <nav className="dashboard-drawer-nav">
          {appSections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              end={section.to === "/app"}
              className={({ isActive }) => `dashboard-drawer-link ${isActive ? "is-active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              <strong>{section.label}</strong>
              <small>{section.helper}</small>
            </NavLink>
          ))}
          <button
            type="button"
            className="dashboard-drawer-link"
            onClick={() => {
              navigate("/cardapios")
              setMenuOpen(false)
            }}
          >
            <strong>Cardapios completos</strong>
            <small>Abrir pagina dedicada</small>
          </button>
        </nav>
      </aside>

      {isDashboardHome ? (
        <section className="hero-card hero-dash hero-dashboard-classic">
          <p className="eyebrow eyebrow-soft hero-dashboard-title">Nutrition plan</p>

          <div className="dashboard-topbar">
            <div className="dashboard-topbar-main">
              <button
                type="button"
                className="dashboard-icon-button dashboard-menu-button"
                aria-label="Abrir menu"
                onClick={() => setMenuOpen(true)}
              >
                <span />
                <span />
                <span />
              </button>

              <div className="hero-dashboard-greeting">
                <h1>{appData.saudacao}</h1>
                <p className="muted muted-soft">{appData.email || appData.objetivoLabel}</p>
              </div>
            </div>

            <span className={`dashboard-badge ${appData.isPremium ? "dashboard-badge-premium" : ""}`}>
              {appData.isPremium ? "Premium" : "Free"}
            </span>
          </div>

          <DashboardGoalRing
            tmb={appData.tmb}
            tdee={appData.tdee}
            caloriasObjetivo={appData.caloriasObjetivo}
            balanceScore={appData.balanceScore}
            variant="hero"
          />

          <div className="dashboard-hero-metrics">
            <article className="dashboard-hero-metric">
              <strong>{appData.latestCheckin ? `${appData.latestCheckin.peso} kg` : appData.peso ? `${appData.peso} kg` : "-"}</strong>
              <span>peso atual</span>
            </article>
            <article className="dashboard-hero-metric">
              <strong>{appData.proteinaMeta ? `${appData.proteinaMeta} g` : "-"}</strong>
              <span>proteina alvo</span>
            </article>
          </div>

          <div className="dashboard-hero-footer">
            <div>
              <p>{appData.objetivoLabel}</p>
              <small>{appData.hoje}</small>
            </div>
            <small>{appData.caloriasRestantes ? `${appData.caloriasRestantes} kcal livres` : "Plano calibrado"}</small>
          </div>

          {(appData.dataLoading || appData.dataError || appData.profileSyncing) && (
            <div className="dashboard-status-row">
              {appData.dataLoading && <span className="chip chip-free">Sincronizando dados...</span>}
              {appData.profileSyncing && <span className="chip chip-free">Salvando perfil...</span>}
              {appData.dataError && <span className="chip chip-error">{appData.dataError}</span>}
            </div>
          )}
        </section>
      ) : (
        <section className="meal-block dashboard-subpage-topbar">
          <div className="dashboard-topbar dashboard-topbar-compact">
            <div className="dashboard-topbar-main">
              <button
                type="button"
                className="dashboard-icon-button dashboard-menu-button dashboard-menu-button-compact"
                aria-label="Abrir menu"
                onClick={() => setMenuOpen(true)}
              >
                <span />
                <span />
                <span />
              </button>

              <div className="dashboard-subpage-heading">
                <h1>{compactTitle}</h1>
                <p>{compactHelper}</p>
              </div>
            </div>

            <span className={`dashboard-badge dashboard-badge-compact ${appData.isPremium ? "dashboard-badge-premium" : ""}`}>
              {appData.isPremium ? "Premium" : "Free"}
            </span>
          </div>

          {(appData.dataLoading || appData.dataError || appData.profileSyncing) && (
            <div className="dashboard-status-row">
              {appData.dataLoading && <span className="chip chip-free">Sincronizando dados...</span>}
              {appData.profileSyncing && <span className="chip chip-free">Salvando perfil...</span>}
              {appData.dataError && <span className="chip chip-error">{appData.dataError}</span>}
            </div>
          )}
        </section>
      )}

      <Outlet context={{ ...appData, sair, recomecarOnboarding }} />

      <section className="inline-actions">
        <button className="ghost-action" onClick={() => appData.setPremium(!appData.isPremium)}>
          {appData.isPremium ? "Trocar para gratuito" : "Simular premium"}
        </button>
        <button className="ghost-action" onClick={recomecarOnboarding}>Refazer onboarding</button>
        <button className="ghost-action danger" onClick={sair}>Sair</button>
      </section>

      <BottomNav />
    </main>
  )
}

export default AppLayout
