import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"
import EntryShell from "../../components/EntryShell"

function Altura() {
  const [alturaInput, setAlturaInput] = useState("")
  const [erro, setErro] = useState("")
  const setAltura = useUserStore((state) => state.setAltura)

  const navigate = useNavigate()

  function continuar() {
    if (!alturaInput) {
      setErro("Informe a altura para continuar.")
      return
    }
    setErro("")
    setAltura(alturaInput)
    navigate("/sexo")
  }

  return (
    <EntryShell
      step={4}
      totalSteps={7}
      title="Qual é a sua altura?"
      description="Junto com peso e idade, essa medida deixa a estimativa metabolica mais consistente."
    >
      <label className="entry-field">
        <span>Altura em cm</span>
        <input
          type="number"
          placeholder="Ex: 168"
          value={alturaInput}
          onChange={(e) => setAlturaInput(e.target.value)}
        />
      </label>

      {erro && <p className="entry-feedback entry-feedback-error">{erro}</p>}

      <button className="entry-primary" onClick={continuar}>
        Continuar
      </button>
    </EntryShell>
  )
}

export default Altura
