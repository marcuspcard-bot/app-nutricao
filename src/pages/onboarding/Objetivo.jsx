import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"
import EntryShell from "../../components/EntryShell"

function Objetivo() {
  const setObjetivo = useUserStore((state) => state.setObjetivo)
  const navigate = useNavigate()

  function selecionar(objetivo) {
    setObjetivo(objetivo)
    navigate("/calculometabolico")
  }

  return (
    <EntryShell
      step={7}
      totalSteps={7}
      title="Qual é o objetivo principal?"
      description="Defina a direcao principal do plano para gerar uma estrategia inicial mais coerente."
    >
      <div className="entry-actions">
        <button className="entry-option" onClick={() => selecionar("emagrecer")}>
          <strong>Emagrecimento</strong>
          <small>Foco em reducao de gordura com controle calorico e saciedade.</small>
        </button>
        <button className="entry-option" onClick={() => selecionar("manter")}>
          <strong>Manutencao</strong>
          <small>Equilibrio para manter peso e rotina alimentar consistentes.</small>
        </button>
        <button className="entry-option" onClick={() => selecionar("ganhar_massa")}>
          <strong>Ganho de massa</strong>
          <small>Maior suporte calorico e proteico para evolucao muscular.</small>
        </button>
      </div>
    </EntryShell>
  )
}

export default Objetivo
