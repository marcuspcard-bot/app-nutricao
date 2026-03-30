import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"
import EntryShell from "../../components/EntryShell"

function Nome() {
  const [nome, setNomeInput] = useState("")
  const [erro, setErro] = useState("")
  const setNome = useUserStore((state) => state.setNome)

  const navigate = useNavigate()

  function continuar() {
    if (!nome.trim()) {
      setErro("Informe seu nome para continuar.")
      return
    }

    setErro("")
    setNome(nome.trim())
    navigate("/idade")
  }

  return (
    <EntryShell
      step={1}
      totalSteps={7}
      title="Como voce gostaria de se identificar?"
      description="Esse nome sera usado para personalizar o painel e deixar sua jornada mais clara."
    >
      <label className="entry-field">
        <span>Nome</span>
        <input
          type="text"
          placeholder="Digite o nome"
          value={nome}
          onChange={(e) => setNomeInput(e.target.value)}
        />
      </label>

      {erro && <p className="entry-feedback entry-feedback-error">{erro}</p>}

      <button className="entry-primary" onClick={continuar}>
        Continuar
      </button>
    </EntryShell>
  )
}

export default Nome
