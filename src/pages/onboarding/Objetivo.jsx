import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"

function Objetivo() {

  const setObjetivo = useUserStore((state) => state.setObjetivo)

  const navigate = useNavigate()

  function selecionar(objetivo) {

    setObjetivo(objetivo)

    navigate("/calculometabolico")
  }

  return (
    <div>

      <h1>Qual é seu objetivo?</h1>

      <button onClick={() => selecionar("emagrecer")}>
        🔥 Emagrecer
      </button>

      <br /><br />

      <button onClick={() => selecionar("manter")}>
        ⚖️ Manter peso
      </button>

      <br /><br />

      <button onClick={() => selecionar("ganhar_massa")}>
        💪 Ganhar massa
      </button>

    </div>
  )
}

export default Objetivo