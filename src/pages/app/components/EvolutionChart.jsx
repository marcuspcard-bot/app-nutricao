import { formatShortDate, getChartPointPosition } from "../appDataUtils"
import EmptyStateCard from "./EmptyStateCard"
import StatusCard from "./StatusCard"

function EvolutionChart({ chartPoints, history, checkinsLoading }) {
  return (
    <div className="evolution-chart-card">
      <div className="meal-head">
        <h3>Grafico de evolucao</h3>
        <span>{history.length ? "Peso semanal" : "Sem dados"}</span>
      </div>

      {history.length ? (
        <div className="evolution-chart">
          <svg viewBox="0 0 280 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 112 H280" className="chart-axis" />
            <polyline points={chartPoints} className="chart-line" />
            {history.map((item, index) => {
              const { cx, cy } = getChartPointPosition(history, index)
              return <circle key={item.id} cx={cx} cy={cy} r="4" className="chart-point" />
            })}
          </svg>
          <div className="chart-label-row">
            {history.map((item) => (
              <span key={item.id}>{formatShortDate(item.date)}</span>
            ))}
          </div>
        </div>
      ) : checkinsLoading ? (
        <StatusCard
          eyebrow="Sincronizando"
          title="Carregando historico de evolucao"
          description="Estamos buscando os registros mais recentes no Supabase."
        />
      ) : (
        <EmptyStateCard
          title="Seu grafico ainda nao tem registros"
          description="Assim que o primeiro check-in for salvo, a evolucao do peso aparecera aqui automaticamente."
        />
      )}
    </div>
  )
}

export default EvolutionChart
