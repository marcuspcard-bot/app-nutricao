import { formatShortDate } from "../appDataUtils"
import EmptyStateCard from "./EmptyStateCard"
import StatusCard from "./StatusCard"

function RecentHistory({ history, checkinsLoading, limit = 6 }) {
  return (
    <section className="meal-block dashboard-day-panel evolution-history">
      <div className="dashboard-tab-panel">
        <div className="meal-head">
          <h2>Historico recente</h2>
          <span>Ultimos registros</span>
        </div>

        <div className="history-list">
          {history.length ? (
            [...history].slice(-limit).reverse().map((item) => (
              <article key={item.id} className="history-item">
                <div>
                  <strong>{item.label}</strong>
                  <p>Registro semanal salvo no Supabase.</p>
                </div>
                <div className="history-metrics">
                  <span>{item.peso} kg</span>
                  <small>{formatShortDate(item.date)}</small>
                </div>
              </article>
            ))
          ) : checkinsLoading ? (
            <StatusCard
              eyebrow="Sincronizando"
              title="Carregando registros recentes"
              description="Seus check-ins estao sendo organizados para exibir a linha do tempo."
            />
          ) : (
            <EmptyStateCard
              title="Nenhum check-in registrado ainda"
              description="Quando o primeiro check-in for salvo, os ultimos registros aparecerao aqui com data e peso."
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default RecentHistory
