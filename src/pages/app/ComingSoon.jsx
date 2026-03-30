import { useOutletContext } from "react-router-dom"

function ComingSoon({ title, description, bullets }) {
  const { objetivoLabel } = useOutletContext()

  return (
    <section className="meal-block dashboard-coming-soon">
      <div className="meal-head">
        <div>
          <h2>{title}</h2>
          <p className="dashboard-section-copy">{description}</p>
        </div>
        <span>{objetivoLabel}</span>
      </div>

      <div className="coming-soon-box">
        <strong>Espaco reservado no menu</strong>
        <p>Essa area ja esta pronta na navegacao para voce implementar sem mexer de novo na estrutura principal.</p>
      </div>

      <div className="insight-list">
        {bullets.map((bullet) => (
          <article key={bullet}>
            <strong>{bullet}</strong>
            <p>Quando voce quiser, a gente pode transformar este bloco em uma tela funcional mantendo o mesmo layout do app.</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ComingSoon
