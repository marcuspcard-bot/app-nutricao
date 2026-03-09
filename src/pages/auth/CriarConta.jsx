import { useState } from "react"
import { useNavigate } from "react-router-dom"

function CriarConta() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")

  function criarConta(e) {
    e.preventDefault()

    console.log("Email:", email)
    console.log("Senha:", senha)

    navigate("/dashboard")
  }

  function entrarComGoogle() {
    console.log("Login com Google")
  }

  return (

    <div>

      <h1>Crie sua conta</h1>

      <form onSubmit={criarConta}>

        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <br /><br />

        <button type="submit">
          Criar conta
        </button>

      </form>

      <br />

      <button onClick={entrarComGoogle}>
        Entrar com Google
      </button>

    </div>

  )
}

export default CriarConta