import { useNavigate, useOutletContext } from "react-router-dom"

function MealsOverview() {
  const navigate = useNavigate()
  const { meals, caloriasObjetivo, carboMeta, proteinaMeta, gorduraMeta } = useOutletContext()

  const caloriasCafe = meals.find((meal) => meal.key === "cafe")?.kcal ?? 0
  const caloriasAlmoco = meals.find((meal) => meal.key === "almoco")?.kcal ?? 0
  const caloriasJantar = meals.find((meal) => meal.key === "jantar")?.kcal ?? 0

  return (
    <>
      <section className="dashboard-meal-nav">
        {meals.map((meal) => (
          <article className="dashboard-meal-pill" key={meal.key}>
            <span>{meal.icon}</span>
            <strong>{meal.label}</strong>
            <small>{meal.kcal ? `${meal.kcal} kcal` : "-"}</small>
          </article>
        ))}
      </section>

      <section className="meal-block dashboard-intake-panel">
        <div className="meal-head">
          <h2>Distribuicao nutricional</h2>
          <span>Hoje</span>
        </div>
        <div className="intake-rows">
          <article>
            <div className="intake-label-row">
              <strong>Calorias</strong>
              <span>{caloriasObjetivo ? `${caloriasObjetivo} / ${caloriasObjetivo} kcal` : "-"}</span>
            </div>
            <div className="progress-line"><i style={{ width: "100%" }} /></div>
          </article>
          <article>
            <div className="intake-label-row">
              <strong>Carboidratos</strong>
              <span>{carboMeta ? `${carboMeta} g` : "-"}</span>
            </div>
            <div className="progress-line carbs"><i style={{ width: "78%" }} /></div>
          </article>
          <article>
            <div className="intake-label-row">
              <strong>Proteina</strong>
              <span>{proteinaMeta ? `${proteinaMeta} g` : "-"}</span>
            </div>
            <div className="progress-line protein"><i style={{ width: "84%" }} /></div>
          </article>
          <article>
            <div className="intake-label-row">
              <strong>Gorduras</strong>
              <span>{gorduraMeta ? `${gorduraMeta} g` : "-"}</span>
            </div>
            <div className="progress-line fat"><i style={{ width: "64%" }} /></div>
          </article>
        </div>
      </section>

      <section className="meal-block dashboard-day-panel">
        <div className="meal-head">
          <h2>Plano de refeicoes</h2>
          <span>Organizado</span>
        </div>
        <div className="day-meal-list">
          <article>
            <div>
              <strong>Cafe da manha</strong>
              <p>Primeira refeicao com energia estavel e boa saciedade.</p>
            </div>
            <span>{caloriasCafe ? `${caloriasCafe} kcal` : "-"}</span>
          </article>
          <article>
            <div>
              <strong>Almoco</strong>
              <p>Faixa principal do dia com densidade nutricional maior.</p>
            </div>
            <span>{caloriasAlmoco ? `${caloriasAlmoco} kcal` : "-"}</span>
          </article>
          <article>
            <div>
              <strong>Jantar</strong>
              <p>Fechamento controlado para manter equilibrio da meta.</p>
            </div>
            <span>{caloriasJantar ? `${caloriasJantar} kcal` : "-"}</span>
          </article>
        </div>

        <button className="primary-action" type="button" onClick={() => navigate("/cardapios")}>
          Abrir cardapios completos
        </button>
      </section>
    </>
  )
}

export default MealsOverview
