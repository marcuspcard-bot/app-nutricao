import { Link } from "react-router-dom"

function Home() {
  return (
    <div>

      <h1>App Nutrição</h1>

      <p>Seja bem-vindo!</p>

      <div>

        <Link to="/termos">
          <button>Novo usuário</button>
        </Link>

        <Link to="/login">
          <button>Já tenho conta</button>
        </Link>

      </div>

    </div>
  )
}

export default Home