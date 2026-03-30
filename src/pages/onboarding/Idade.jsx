import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"
import EntryShell from "../../components/EntryShell"

function Idade() {
  const [idadeInput, setIdadeInput] = useState("")
  const [erro, setErro] = useState("")
  const setIdade = useUserStore((state) => state.setIdade)

  const navigate = useNavigate()

  function continuar() {
    if (!idadeInput) {
      setErro("Informe a idade para continuar.")
      return
    }
    setErro("")
    setIdade(idadeInput)
    navigate("/peso")
  }

  return (
    <EntryShell
      step={2}
      totalSteps={7}
      title="Qual é a sua idade?"
      description="A idade entra na estimativa metabolica e ajuda a calibrar melhor o plano inicial."
    >
      <label className="entry-field">
        <span>Idade</span>
        <input
          type="number"
          placeholder="Ex: 32"
          value={idadeInput}
          onChange={(e) => setIdadeInput(e.target.value)}
        />
      </label>

      {erro && <p className="entry-feedback entry-feedback-error">{erro}</p>}

      <button className="entry-primary" onClick={continuar}>
        Continuar
      </button>
    </EntryShell>
  )
}

export default Idade
