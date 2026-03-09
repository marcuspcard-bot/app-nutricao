import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"

function Nome() {

  const [nome, setNomeInput] = useState("")
  const setNome = useUserStore((state) => state.setNome)

  const navigate = useNavigate()

  function continuar() {

    if (!nome) {
      alert("Digite seu nome")
      return
    }

    setNome(nome)

    navigate("/idade")
  }

  return (
    <div>

      <h1>Qual é o seu nome?</h1>

      <input
        type="text"
        placeholder="Digite seu nome"
        value={nome}
        onChange={(e) => setNomeInput(e.target.value)}
      />

      <br /><br />

      <button onClick={continuar}>
        Continuar
      </button>

    </div>
  )
}

export default Nome