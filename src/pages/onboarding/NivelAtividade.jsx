import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"
import EntryShell from "../../components/EntryShell"

function NivelAtividade() {
  const setAtividade = useUserStore((state) => state.setAtividade)
  const navigate = useNavigate()

  function selecionar(nivel) {
    setAtividade(nivel)
    navigate("/objetivo")
  }

  return (
    <EntryShell
      step={6}
      totalSteps={7}
      title="Qual é o nivel de atividade atual?"
      description="Selecione a rotina que melhor representa seu momento atual."
    >
      <div className="entry-actions">
        <button className="entry-option" onClick={() => selecionar("sedentario")}>
          <strong>Sedentario</strong>
          <small>Rotina com pouca ou nenhuma atividade fisica regular.</small>
        </button>
        <button className="entry-option" onClick={() => selecionar("leve")}>
          <strong>Leve</strong>
          <small>Movimento leve ao longo da semana ou exercicios ocasionais.</small>
        </button>
        <button className="entry-option" onClick={() => selecionar("moderado")}>
          <strong>Moderado</strong>
          <small>Treinos frequentes ou rotina ativa na maior parte da semana.</small>
        </button>
        <button className="entry-option" onClick={() => selecionar("alto")}>
          <strong>Alto</strong>
          <small>Volume de treino elevado ou rotina fisicamente exigente.</small>
        </button>
        <button className="entry-option" onClick={() => selecionar("muito_alto")}>
          <strong>Muito alto</strong>
          <small>Atividade intensa, diaria e com demanda energetica elevada.</small>
        </button>
      </div>
    </EntryShell>
  )
}

export default NivelAtividade
