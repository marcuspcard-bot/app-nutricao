import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"

function Altura() {

  const [alturaInput, setAlturaInput] = useState("")
  const setAltura = useUserStore((state) => state.setAltura)

  const navigate = useNavigate()

  function continuar() {

    if (!alturaInput) {
      alert("Digite sua altura")
      return
    }

    setAltura(alturaInput)

    navigate("/sexo")
  }

  return (
    <div>

      <h1>Qual é sua altura?</h1>

      <input
        type="number"
        placeholder="Altura em cm"
        value={alturaInput}
        onChange={(e) => setAlturaInput(e.target.value)}
      />

      <br /><br />

      <button onClick={continuar}>
        Continuar
      </button>

    </div>
  )
}

export default Altura