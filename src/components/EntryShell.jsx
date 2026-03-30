function EntryShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  step,
  totalSteps,
  highlights = [],
}) {
  const progress = step && totalSteps ? `${Math.round((step / totalSteps) * 100)}%` : "0%"

  return (
    <main className="entry-page">
      <section className="entry-shell">
        <div className="entry-card">
          <div className="entry-hero">
            <div className="entry-hero-copy">
              {step && totalSteps ? (
                <div className="entry-progress">
                  <div className="entry-progress-copy">
                    <span>Etapa {step} de {totalSteps}</span>
                    <small>Jornada inicial</small>
                  </div>
                  <div className="entry-progress-bar">
                    <i style={{ width: progress }} />
                  </div>
                </div>
              ) : eyebrow ? (
                <p className="entry-eyebrow">{eyebrow}</p>
              ) : null}

              <h1 className="entry-title">{title}</h1>
              {description && <p className="entry-description">{description}</p>}
            </div>

            <div className="entry-hero-mark" aria-hidden="true">
              <span />
              <i />
            </div>
          </div>

          {highlights.length > 0 && (
            <div className="entry-highlight-grid">
              {highlights.map((item) => (
                <article key={item.title} className="entry-highlight-card">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </article>
              ))}
            </div>
          )}

          <div className="entry-content">
            {children}
          </div>

          {footer && <div className="entry-footer">{footer}</div>}
        </div>
      </section>
    </main>
  )
}

export default EntryShell
