import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Peso() {

  const [peso, setPeso] = useState("")
  const navigate = useNavigate()

  function continuar() {

    if (!peso) {
      alert("Digite seu peso")
      return
    }

    navigate("/altura")
  }

  return (
    <div>

      <h1>Qual é o seu peso?</h1>

      <input
        type="number"
        placeholder="Digite seu peso em kg"
        value={peso}
        onChange={(e) => setPeso(e.target.value)}
      />

      <br />
      <br />

      <button onClick={continuar}>
        Continuar
      </button>

    </div>
  )
}

export default Peso