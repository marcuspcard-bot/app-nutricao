import { NavLink, useLocation } from "react-router-dom"

const bottomNavItems = [
  { to: "/app/comunidade", label: "Comunidade", icon: "C", match: ["/app/comunidade"] },
  { to: "/app", label: "Inicio", icon: "I", match: ["/app"], exact: true },
  { to: "/cardapios", label: "Refeicoes", icon: "R", match: ["/cardapios", "/receitas"] },
  { to: "/app/evolucao", label: "Evolucao", icon: "E", match: ["/app/evolucao"] },
  { to: "/app/premium", label: "Premium", icon: "P", match: ["/app/premium"] },
]

function BottomNav() {
  const location = useLocation()

  return (
    <nav className="dashboard-bottom-nav" aria-label="Navegacao principal">
      {bottomNavItems.map((item) => {
        const isActive = item.match.some((path) =>
          item.exact
            ? location.pathname === path
            : location.pathname === path || location.pathname.startsWith(`${path}/`),
        )

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`dashboard-bottom-link ${isActive ? "is-active" : ""}`}
          >
            <span className="dashboard-bottom-icon" aria-hidden="true">{item.icon}</span>
            <small>{item.label}</small>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomNav
