function DashboardGoalRing({ tmb, tdee, caloriasObjetivo, balanceScore, variant = "surface", className = "" }) {
  const isHero = variant === "hero"
  const sectionClassName = [
    isHero ? "dashboard-ring-shell" : "meal-block dashboard-overview-panel",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  const zoneClassName = `dashboard-ring-zone ${isHero ? "dashboard-ring-zone-hero" : "dashboard-ring-zone-surface"}`
  const sideMetricClassName = `dashboard-side-metric ${isHero ? "" : "dashboard-side-metric-surface"}`
  const ringClassName = `dashboard-goal-ring ${isHero ? "" : "dashboard-goal-ring-surface"}`
  const innerClassName = `dashboard-goal-inner ${isHero ? "" : "dashboard-goal-inner-surface"}`

  return (
    <section className={sectionClassName}>
      <div className={zoneClassName}>
        <article className={sideMetricClassName}>
          <strong>{tmb || "-"}</strong>
          <span>tmb</span>
        </article>

        <div
          className={ringClassName}
          style={{ "--goal-fill": `${balanceScore}%` }}
        >
          <div className={innerClassName}>
            <span>meta diaria</span>
            <strong>{caloriasObjetivo || "-"}</strong>
            <small>kcal</small>
          </div>
        </div>

        <article className={sideMetricClassName}>
          <strong>{tdee || "-"}</strong>
          <span>gasto</span>
        </article>
      </div>
    </section>
  )
}

export default DashboardGoalRing
