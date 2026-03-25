import { useNavigate } from "react-router-dom"
import { useUserStore } from "../../store/userStore"

function CalculoMetabolico() {
  const navigate = useNavigate()

  const nome = useUserStore((state) => state.nome)
  const idade = useUserStore((state) => state.idade)
  const peso = useUserStore((state) => state.peso)
  const altura = useUserStore((state) => state.altura)
  const sexo = useUserStore((state) => state.sexo)
  const atividade = useUserStore((state) => state.atividade)
  const objetivo = useUserStore((state) => state.objetivo)
  const setCalculoMetabolico = useUserStore((state) => state.setCalculoMetabolico)

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
      alert("Complete os dados do onboarding antes de continuar.")
      navigate("/nome")
      return
    }

    setCalculoMetabolico({
      tmb: Math.round(tmb),
      tdee: Math.round(tdee),
      caloriasObjetivo: Math.round(caloriasObjetivo),
    })

    navigate("/criar-conta")
  }

  return (

    <div>

      <h1>Resultado metabólico</h1>

      <h2>Olá, {nome}!</h2>

      <p>Metabolismo basal: {Math.round(tmb)} kcal</p>

      <p>Gasto diário estimado: {Math.round(tdee)} kcal</p>

      <p>Calorias para seu objetivo: {Math.round(caloriasObjetivo)} kcal</p>

      <br />

      <button onClick={continuar}>
        Próxima etapa
      </button>

    </div>

  )
}

export default CalculoMetabolico
