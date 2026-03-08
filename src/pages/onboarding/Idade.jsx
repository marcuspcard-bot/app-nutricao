import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Idade() {

  const [idade, setIdade] = useState("")
  const navigate = useNavigate()

  function continuar() {

    if (!idade) {
      alert("Digite sua idade")
      return
    }

    navigate("/peso")
  }

  return (
    <div>

      <h1>Qual é a sua idade?</h1>

      <input
        type="number"
        placeholder="Digite sua idade"
        value={idade}
        onChange={(e) => setIdade(e.target.value)}
      />

      <br />
      <br />

      <button onClick={continuar}>
        Continuar
      </button>

    </div>
  )
}

export default Idade