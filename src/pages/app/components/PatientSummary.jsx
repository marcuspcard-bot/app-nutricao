import { formatShortDate } from "../appDataUtils"

function PatientSummary({
  objetivoLabel,
  idade,
  sexo,
  peso,
  altura,
  atividade,
  tmb,
  tdee,
  caloriasObjetivo,
  latestCheckin,
}) {
  return (
    <section className="meal-block dashboard-summary-panel">
      <div className="meal-head">
        <h2>Seu resumo corporal</h2>
        <span>{objetivoLabel}</span>
      </div>
      <div className="profile-grid">
        <p><strong>Idade</strong><span>{idade || "-"}</span></p>
        <p><strong>Sexo</strong><span>{sexo || "-"}</span></p>
        <p><strong>Peso</strong><span>{peso ? `${peso} kg` : "-"}</span></p>
        <p><strong>Altura</strong><span>{altura ? `${altura} cm` : "-"}</span></p>
        <p><strong>Atividade</strong><span>{atividade || "-"}</span></p>
        <p><strong>Objetivo</strong><span>{objetivoLabel}</span></p>
        <p><strong>TMB</strong><span>{tmb || "-"}</span></p>
        <p><strong>Gasto diario</strong><span>{tdee || "-"}</span></p>
        <p><strong>Meta calorica</strong><span>{caloriasObjetivo ? `${caloriasObjetivo} kcal` : "-"}</span></p>
        <p><strong>Ultimo check-in</strong><span>{latestCheckin ? formatShortDate(latestCheckin.date) : "-"}</span></p>
      </div>
    </section>
  )
}

export default PatientSummary
