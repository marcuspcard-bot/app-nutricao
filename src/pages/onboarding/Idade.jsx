import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"

function Idade() {

  const [idadeInput, setIdadeInput] = useState("")
  const setIdade = useUserStore((state) => state.setIdade)

  const navigate = useNavigate()

  function continuar() {

    if (!idadeInput) {
      alert("Digite sua idade")
      return
    }

    setIdade(idadeInput)

    navigate("/peso")
  }

  return (
    <div>

      <h1>Qual é sua idade?</h1>

      <input
        type="number"
        placeholder="Digite sua idade"
        value={idadeInput}
        onChange={(e) => setIdadeInput(e.target.value)}
      />

      <br /><br />

      <button onClick={continuar}>
        Continuar
      </button>

    </div>
  )
}

export default Idade