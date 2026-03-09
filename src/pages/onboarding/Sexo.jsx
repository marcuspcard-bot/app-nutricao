import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"

function Sexo() {

  const setSexo = useUserStore((state) => state.setSexo)
  const navigate = useNavigate()

  function selecionar(sexo) {

    setSexo(sexo)

    navigate("/atividade")
  }

  return (
    <div>

      <h1>Qual é seu sexo?</h1>

      <button onClick={() => selecionar("masculino")}>
        Masculino
      </button>

      <button onClick={() => selecionar("feminino")}>
        Feminino
      </button>

    </div>
  )
}

export default Sexo