import { Link } from "react-router-dom"
import EntryShell from "../../components/EntryShell"

function Home() {
  return (
    <EntryShell
      eyebrow="Nutrição inteligente"
      title="Painel nutricional com presenca e clareza"
      description="Organize sua alimentacao, acompanhe sua evolucao e monte suas refeicoes em uma experiencia mais clara e segura."
      footer="Escolha como deseja começar e siga com uma jornada mais organizada desde o primeiro acesso."
      highlights={[
        { title: "Check-ins semanais", description: "Peso e historico reunidos em um acompanhamento simples." },
        { title: "Cardapios por refeicao", description: "Receitas distribuidas por momento do dia e objetivo." },
      ]}
    >
      <div className="entry-actions">
        <Link to="/termos">
          <button className="entry-primary">Iniciar novo acompanhamento</button>
        </Link>

        <Link to="/login">
          <button className="entry-secondary">Acessar minha conta</button>
        </Link>
      </div>
    </EntryShell>
  )
}

export default Home
