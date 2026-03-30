function EmptyStateCard({ title, description, actionLabel, onAction }) {
  return (
    <section className="meal-block empty-state-card">
      <div className="empty-state-icon" aria-hidden="true">+</div>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="ghost-action empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  )
}

export default EmptyStateCard
