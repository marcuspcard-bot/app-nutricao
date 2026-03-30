import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useUserStore } from "../../store/userStore"
import EntryShell from "../../components/EntryShell"

function CalculoMetabolico() {
  const navigate = useNavigate()
  const [erro, setErro] = useState("")

  const nome = useUserStore((state) => state.nome)
  const idade = useUserStore((state) => state.idade)
  const peso = useUserStore((state) => state.peso)
  const altura = useUserStore((state) => state.altura)
  const sexo = useUserStore((state) => state.sexo)
  const atividade = useUserStore((state) => state.atividade)
  const objetivo = useUserStore((state) => state.objetivo)
  const setCalculoMetabolico = useUserStore((state) => state.setCalculoMetabolico)
  const objetivoTexto =
    objetivo === "emagrecer"
      ? "emagrecimento"
      : objetivo === "ganhar_massa"
        ? "ganho de massa"
        : "manutencao"

  const pesoNum = Number(peso)
  const alturaNum = Number(altura)
  const idadeNum = Number(idade)
  const dadosCompletos = Boolean(peso && altura && idade && sexo)

  let tmb = 0
  if (dadosCompletos) {
    if (sexo === "masculino") {
      tmb = 10 * pesoNum + 6.25 * alturaNum - 5 * idadeNum + 5
    } else {
      tmb = 10 * pesoNum + 6.25 * alturaNum - 5 * idadeNum - 161
    }
  }

  let fatorAtividade = 1.2
  if (atividade === "leve") fatorAtividade = 1.375
  if (atividade === "moderado") fatorAtividade = 1.55
  if (atividade === "alto") fatorAtividade = 1.725
  if (atividade === "muito_alto") fatorAtividade = 1.9

  const tdee = tmb * fatorAtividade

  let caloriasObjetivo = tdee
  if (objetivo === "emagrecer") caloriasObjetivo = tdee - 400
  if (objetivo === "ganhar_massa") caloriasObjetivo = tdee + 400

  function continuar() {
    if (!dadosCompletos) {
      setErro("Complete as etapas anteriores para gerar o resumo metabolico corretamente.")
      navigate("/nome")
      return
    }

    setErro("")
    setCalculoMetabolico({
      tmb: Math.round(tmb),
      tdee: Math.round(tdee),
      caloriasObjetivo: Math.round(caloriasObjetivo),
    })

    navigate("/criar-conta")
  }

  return (
    <EntryShell
      eyebrow="Resumo metabolico"
      title={`Base inicial de ${nome || "voce"}`}
      description={`Com os dados preenchidos, ja temos uma estimativa inicial para orientar o plano de ${objetivoTexto}.`}
      footer="No proximo passo, voce cria a conta para salvar sua base inicial e seguir com o painel completo."
      highlights={[
        { title: "TMB estimada", description: "Uma referencia inicial para entender o metabolismo basal." },
        { title: "Direcao do plano", description: "Ajuste calorico inicial alinhado ao objetivo definido." },
      ]}
    >
      <div className="entry-metric-grid">
        <article className="entry-metric-card">
          <span>TMB</span>
          <strong>{Math.round(tmb)} kcal</strong>
        </article>
        <article className="entry-metric-card">
          <span>Gasto diario</span>
          <strong>{Math.round(tdee)} kcal</strong>
        </article>
        <article className="entry-metric-card">
          <span>Meta inicial</span>
          <strong>{Math.round(caloriasObjetivo)} kcal</strong>
        </article>
      </div>

      {erro && <p className="entry-feedback entry-feedback-error">{erro}</p>}

      <button className="entry-primary" onClick={continuar}>
        Criar conta e continuar
      </button>
    </EntryShell>
  )
}

export default CalculoMetabolico
