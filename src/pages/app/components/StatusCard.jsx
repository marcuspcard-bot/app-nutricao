function StatusCard({ eyebrow, title, description, tone = "neutral" }) {
  return (
    <section className={`meal-block status-card status-card-${tone}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className="muted">{description}</p>}
    </section>
  )
}

export default StatusCard
