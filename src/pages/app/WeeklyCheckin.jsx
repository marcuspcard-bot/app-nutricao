import { useState } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import StatusCard from "./components/StatusCard"

function WeeklyCheckin() {
  const navigate = useNavigate()
  const { addWeeklyCheckin, history, peso, savingCheckin } = useOutletContext()
  const [pesoCheckin, setPesoCheckin] = useState(peso || "")
  const [feedback, setFeedback] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function salvarCheckin(event) {
    event.preventDefault()
    setFeedback("")
    setSuccessMessage("")

    const parsedWeight = Number(String(pesoCheckin).replace(",", "."))
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      setFeedback("Informe um peso valido para registrar o check-in.")
      return
    }

    const createdAt = new Date()

    const { error } = await addWeeklyCheckin({
      date: createdAt.toISOString(),
      peso: Number(parsedWeight.toFixed(1)),
    })

    if (error) {
      setFeedback("Nao foi possivel salvar seu check-in agora. Tente novamente em instantes.")
      return
    }

    setSuccessMessage("Check-in salvo com sucesso. Atualizando sua evolucao...")
    setTimeout(() => {
      navigate("/app/evolucao", { state: { checkinSaved: true } })
    }, 500)
  }

  return (
    <section className="meal-block dashboard-checkin-shell">
      <div className="meal-head">
        <div>
          <h2>Check-in semanal</h2>
          <p className="dashboard-section-copy">Acompanhamento rapido para manter a constancia.</p>
        </div>
        <span>{history.length ? `${history.length} semanas` : "Novo"}</span>
      </div>

      <div className="dashboard-tab-panel">
        <div className="quick-checkin-banner">
          <strong>Check-in simples e rapido</strong>
          <p>Registre apenas o peso atual para manter a evolucao sempre em dia.</p>
        </div>

        <form className="quick-checkin-form" onSubmit={salvarCheckin}>
          <label className="checkin-field">
            <span>Seu peso atual</span>
            <input
              type="number"
              step="0.1"
              min="0"
              value={pesoCheckin}
              onChange={(event) => setPesoCheckin(event.target.value)}
              placeholder="Ex: 72.4"
            />
          </label>

          {feedback && (
            <StatusCard
              tone="warning"
              title="Nao foi possivel concluir o check-in"
              description={feedback}
            />
          )}

          {successMessage && (
            <StatusCard
              tone="success"
              title="Check-in registrado"
              description={successMessage}
            />
          )}

          <button className="primary-action" type="submit" disabled={savingCheckin}>
            {savingCheckin ? "Salvando check-in..." : "Salvar check-in"}
          </button>
        </form>
      </div>
    </section>
  )
}

export default WeeklyCheckin
