import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"
import EntryShell from "../../components/EntryShell"

function Sexo() {
  const setSexo = useUserStore((state) => state.setSexo)
  const navigate = useNavigate()

  function selecionar(sexo) {
    setSexo(sexo)
    navigate("/atividade")
  }

  return (
    <EntryShell
      step={5}
      totalSteps={7}
      title="Qual referencia biologica devemos considerar?"
      description="Essa informacao sera usada somente para compor o calculo metabolico basal."
    >
      <div className="entry-actions">
        <button className="entry-option" onClick={() => selecionar("masculino")}>
          <strong>Masculino</strong>
          <small>Usar formula de referencia masculina no calculo.</small>
        </button>

        <button className="entry-option" onClick={() => selecionar("feminino")}>
          <strong>Feminino</strong>
          <small>Usar formula de referencia feminina no calculo.</small>
        </button>
      </div>
    </EntryShell>
  )
}

export default Sexo
