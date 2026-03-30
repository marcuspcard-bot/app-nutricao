import { useLocation, useOutletContext } from "react-router-dom"
import EvolutionChart from "./components/EvolutionChart"
import PatientSummary from "./components/PatientSummary"
import RecentHistory from "./components/RecentHistory"
import StatusCard from "./components/StatusCard"

function Evolution() {
  const location = useLocation()
  const {
    chartPoints,
    history,
    latestCheckin,
    peso,
    previousCheckin,
    weightDelta,
    objetivoLabel,
    idade,
    altura,
    atividade,
    sexo,
    tmb,
    tdee,
    caloriasObjetivo,
    checkinsLoading,
  } = useOutletContext()

  return (
    <>
      {location.state?.checkinSaved && (
        <StatusCard
          tone="success"
          eyebrow="Check-in atualizado"
          title="Evolucao sincronizada com sucesso"
          description="O peso salvo ja faz parte do seu historico e do grafico de evolucao."
        />
      )}

      <section className="meal-block dashboard-checkin-shell">
        <div className="meal-head">
          <div>
            <h2>Evolucao recente</h2>
            <p className="dashboard-section-copy">Visualize seu progresso com mais clareza e contexto.</p>
          </div>
          <span>{history.length ? `${history.length} registros` : "Sem registros"}</span>
        </div>

        <div className="dashboard-tab-panel">
          <div className="evolution-highlight-grid">
            <article>
              <span>Peso atual</span>
              <strong>{latestCheckin ? `${latestCheckin.peso} kg` : peso ? `${peso} kg` : "-"}</strong>
            </article>
            <article>
              <span>Variacao</span>
              <strong>{previousCheckin ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg` : "-"}</strong>
            </article>
            <article>
              <span>Check-ins</span>
              <strong>
                {history.length || "-"}
              </strong>
            </article>
          </div>

          <EvolutionChart chartPoints={chartPoints} history={history} checkinsLoading={checkinsLoading} />
        </div>
      </section>

      <PatientSummary
        objetivoLabel={objetivoLabel}
        idade={idade}
        sexo={sexo}
        peso={peso}
        altura={altura}
        atividade={atividade}
        tmb={tmb}
        tdee={tdee}
        caloriasObjetivo={caloriasObjetivo}
        latestCheckin={latestCheckin}
      />

      <RecentHistory history={history} checkinsLoading={checkinsLoading} />
    </>
  )
}

export default Evolution
