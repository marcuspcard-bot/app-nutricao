import { useNavigate } from "react-router-dom"

function Termos() {

  const navigate = useNavigate()

  function aceitarTermos() {
    navigate("/nome")
  }

  return (
    <div>

      <h1>Termos de Uso</h1>

      <p>
        Ao utilizar este aplicativo você concorda com os termos
        e com a política de privacidade.
      </p>

      <button onClick={aceitarTermos}>
        Aceitar e continuar
      </button>

    </div>
  )
}

export default Termos