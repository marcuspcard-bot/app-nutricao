import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import EntryShell from "../../components/EntryShell"

const termsSections = [
  {
    title: "1. Finalidade do aplicativo",
    paragraphs: [
      "O aplicativo oferece recursos de apoio a organizacao alimentar, acompanhamento pessoal, check-ins, cardapios, receitas e visualizacao de progresso.",
      "O conteudo exibido tem finalidade informativa e de suporte a rotina do usuario, sem substituir avaliacao profissional individual.",
    ],
  },
  {
    title: "2. Receitas, recomendacoes e uso de IA",
    paragraphs: [
      "Parte das receitas, sugestoes, organizacao de cardapios e recomendacoes exibidas pode ser gerada, adaptada, resumida ou organizada com apoio de inteligencia artificial.",
      "Apesar de buscarmos clareza e utilidade, podem existir imprecisoes, inconsistencias, omissoes ou inadequacoes para casos especificos. O usuario deve sempre revisar o conteudo antes de adotar qualquer orientacao alimentar.",
    ],
  },
  {
    title: "3. Nao substitui atendimento profissional",
    paragraphs: [
      "O aplicativo nao realiza diagnostico, nao presta servico medico, nao substitui consulta com nutricionista, medico ou outro profissional habilitado e nao deve ser interpretado como prescricao clinica individual.",
      "Pessoas com alergias, intolerancias, restricoes alimentares, condicoes de saude, uso de medicamentos, gravidez, amamentacao ou qualquer situacao que exija acompanhamento especializado devem buscar orientacao profissional antes de seguir receitas, planos ou sugestoes do aplicativo.",
    ],
  },
  {
    title: "4. Responsabilidade do usuario",
    paragraphs: [
      "Ao utilizar o aplicativo, o usuario declara que fornecera informacoes verdadeiras, atualizadas e completas na medida do possivel.",
      "A decisao de consumir alimentos, adaptar receitas, seguir sugestoes ou utilizar o conteudo do aplicativo e de responsabilidade exclusiva do usuario.",
    ],
  },
  {
    title: "5. Situacoes de urgencia",
    paragraphs: [
      "O aplicativo nao se destina a atendimento de urgencia ou emergencia. Em situacoes que envolvam risco a saude, mal-estar importante, reacoes alergicas, dor intensa ou qualquer intercorrencia, procure atendimento profissional imediatamente.",
    ],
  },
  {
    title: "6. Conta, acesso e seguranca",
    paragraphs: [
      "O usuario e responsavel pela seguranca das credenciais de acesso e pelo uso da propria conta.",
      "Reservamo-nos o direito de suspender ou limitar funcionalidades em caso de uso indevido, fraude, tentativa de violacao da plataforma ou descumprimento destes termos.",
    ],
  },
]

const privacySections = [
  {
    title: "1. Dados que podem ser tratados",
    paragraphs: [
      "Podemos tratar dados cadastrais e dados inseridos pelo proprio usuario na plataforma, como nome, email, idade, peso, altura, objetivo, nivel de atividade, check-ins, historico e preferencias de uso.",
      "Alguns desses dados podem ser considerados sensiveis quando relacionados a saude ou habitos alimentares, e por isso devem receber maior cuidado no tratamento.",
    ],
  },
  {
    title: "2. Finalidade do tratamento",
    paragraphs: [
      "Os dados sao utilizados para criar a conta, permitir acesso ao aplicativo, personalizar a experiencia, organizar receitas e refeicoes, salvar evolucao, sincronizar historico e melhorar o funcionamento da plataforma.",
    ],
  },
  {
    title: "3. Compartilhamento e armazenamento",
    paragraphs: [
      "Os dados podem ser armazenados em provedores de infraestrutura e servicos necessarios para o funcionamento da plataforma, sempre dentro do limite operacional do aplicativo.",
      "Nao utilizamos seus dados para fins diferentes daqueles informados sem base adequada e sem atualizacao desta politica quando aplicavel.",
    ],
  },
  {
    title: "4. Direitos do usuario",
    paragraphs: [
      "O usuario pode solicitar informacoes sobre os dados tratados, correcao de dados incorretos, atualizacao, exclusao quando cabivel e demais direitos previstos na legislacao aplicavel.",
    ],
  },
  {
    title: "5. Retencao e atualizacoes",
    paragraphs: [
      "Os dados podem ser mantidos pelo tempo necessario para operacao da conta, cumprimento de obrigacoes legais, seguranca da plataforma e continuidade da experiencia do usuario.",
      "Estes Termos de Uso e esta Politica de Privacidade podem ser atualizados periodicamente para refletir ajustes do produto, exigencias legais e melhorias operacionais.",
    ],
  },
]

function Termos() {
  const navigate = useNavigate()
  const [showFullTerms, setShowFullTerms] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [erro, setErro] = useState("")

  const canContinue = useMemo(
    () => acceptedTerms && acceptedPrivacy,
    [acceptedPrivacy, acceptedTerms],
  )

  function aceitarTermos() {
    if (!canContinue) {
      setErro("Confirme os Termos de Uso e a Politica de Privacidade para continuar.")
      return
    }

    setErro("")
    navigate("/nome")
  }

  return (
    <EntryShell
      eyebrow="Termos e privacidade"
      title="Leia antes de iniciar"
    >
      <section className="terms-shell">
        <p className="terms-inline-copy">
          Leia o texto completo de Termos de Uso e Politica de Privacidade no botao abaixo.
          Depois, volte para confirmar os aceites e continuar sua configuracao.
        </p>

        <button
          type="button"
          className="entry-secondary terms-open-button"
          onClick={() => setShowFullTerms(true)}
        >
          Abrir termos e privacidade
        </button>

        <div className="terms-checklist">
          <label className="terms-check-item">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>Li e concordo com os Termos de Uso.</span>
          </label>

          <label className="terms-check-item">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(event) => setAcceptedPrivacy(event.target.checked)}
            />
            <span>Li e concordo com a Politica de Privacidade.</span>
          </label>
        </div>

        {erro && <p className="entry-feedback entry-feedback-error">{erro}</p>}

        <div className="entry-actions">
          <button className="entry-primary" onClick={aceitarTermos}>
            Aceitar e continuar
          </button>
        </div>
      </section>

      {showFullTerms && (
        <div className="terms-overlay" role="dialog" aria-modal="true" aria-label="Termos e privacidade">
          <section className="terms-modal">
            <div className="terms-modal-head">
              <div>
                <p className="entry-eyebrow">Leitura completa</p>
                <h2>Termos e privacidade</h2>
              </div>

              <button
                type="button"
                className="terms-close-button"
                aria-label="Fechar termos"
                onClick={() => setShowFullTerms(false)}
              >
                <span />
                <span />
              </button>
            </div>

            <div className="terms-modal-content">
              <div className="terms-section-group">
                <div className="terms-group-head">
                  <h2>Termos de uso</h2>
                  <span>Leitura inicial</span>
                </div>

                {termsSections.map((section) => (
                  <article key={section.title} className="terms-section-card">
                    <h3>{section.title}</h3>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </article>
                ))}
              </div>

              <div className="terms-section-group">
                <div className="terms-group-head">
                  <h2>Politica de privacidade</h2>
                  <span>Dados e direitos</span>
                </div>

                {privacySections.map((section) => (
                  <article key={section.title} className="terms-section-card">
                    <h3>{section.title}</h3>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </article>
                ))}
              </div>

              <article className="terms-section-card terms-section-card-highlight">
                <h3>Aviso sobre receitas, recomendacoes e IA</h3>
                <p>
                  As receitas, sugestoes e organizacoes de cardapio mostradas no aplicativo podem ser geradas,
                  adaptadas ou estruturadas com apoio de inteligencia artificial.
                </p>
                <p>
                  Sempre revise ingredientes, quantidades, alergias, restricoes e adequacao ao seu contexto
                  antes de seguir qualquer conteudo exibido na plataforma.
                </p>
              </article>
            </div>
          </section>
        </div>
      )}
    </EntryShell>
  )
}

export default Termos
