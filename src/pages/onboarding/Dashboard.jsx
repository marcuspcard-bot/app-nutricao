import { useUserStore } from "../../store/userStore"

function Dashboard() {

  const nome = useUserStore((state) => state.nome)
  const objetivo = useUserStore((state) => state.objetivo)
  const peso = useUserStore((state) => state.peso)
  const altura = useUserStore((state) => state.altura)
  const idade = useUserStore((state) => state.idade)
  const atividade = useUserStore((state) => state.atividade)

  return (

    <div>

      <h1>Dashboard</h1>

      <h2>Bem-vindo, {nome}</h2>

      <p>Idade: {idade}</p>
      <p>Peso: {peso} kg</p>
      <p>Altura: {altura} cm</p>

      <p>Nível de atividade: {atividade}</p>

      <p>Objetivo: {objetivo}</p>

    </div>

  )
}

export default Dashboard