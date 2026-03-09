
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"

function NivelAtividade() {

  const setAtividade = useUserStore((state) => state.setAtividade)
  const navigate = useNavigate()

  function selecionar(nivel) {

    setAtividade(nivel)

    navigate("/objetivo")
  }

  return (
    <div>

      <h1>Qual é seu nível de atividade?</h1>

      <button onClick={() => selecionar("sedentario")}>
        Sedentário
      </button>

      <button onClick={() => selecionar("leve")}>
        Leve
      </button>

      <button onClick={() => selecionar("moderado")}>
        Moderado
      </button>

      <button onClick={() => selecionar("alto")}>
        Alto
      </button>

      <button onClick={() => selecionar("muito_alto")}>
        Muito alto
      </button>

    </div>
  )
}

export default NivelAtividade