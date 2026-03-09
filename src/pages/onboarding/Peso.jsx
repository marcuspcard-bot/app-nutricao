import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"

function Peso() {

  const [pesoInput, setPesoInput] = useState("")
  const setPeso = useUserStore((state) => state.setPeso)

  const navigate = useNavigate()

  function continuar() {

    if (!pesoInput) {
      alert("Digite seu peso")
      return
    }

    setPeso(pesoInput)

    navigate("/altura")
  }

  return (
    <div>

      <h1>Qual é seu peso?</h1>

      <input
        type="number"
        placeholder="Peso em kg"
        value={pesoInput}
        onChange={(e) => setPesoInput(e.target.value)}
      />

      <br /><br />

      <button onClick={continuar}>
        Continuar
      </button>

    </div>
  )
}

export default Peso