import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"
import EntryShell from "../../components/EntryShell"

function Peso() {
  const [pesoInput, setPesoInput] = useState("")
  const [erro, setErro] = useState("")
  const setPeso = useUserStore((state) => state.setPeso)

  const navigate = useNavigate()

  function continuar() {
    if (!pesoInput) {
      setErro("Informe o peso atual para continuar.")
      return
    }
    setErro("")
    setPeso(pesoInput)
    navigate("/altura")
  }

  return (
    <EntryShell
      step={3}
      totalSteps={7}
      title="Qual é o peso atual?"
      description="Esse dado ajuda a compor a base metabolica e sera o primeiro marco da evolucao."
    >
      <label className="entry-field">
        <span>Peso em kg</span>
        <input
          type="number"
          placeholder="Ex: 72.4"
          value={pesoInput}
          onChange={(e) => setPesoInput(e.target.value)}
        />
      </label>

      {erro && <p className="entry-feedback entry-feedback-error">{erro}</p>}

      <button className="entry-primary" onClick={continuar}>
        Continuar
      </button>
    </EntryShell>
  )
}

export default Peso
