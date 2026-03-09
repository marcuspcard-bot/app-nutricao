import { useEffect, useState } from "react"
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

  const [tmb, setTmb] = useState(0)
  const [tdee, setTdee] = useState(0)
  const [caloriasObjetivo, setCaloriasObjetivo] = useState(0)

  useEffect(() => {

    console.log("Dados recebidos do store:")
    console.log("nome:", nome)
    console.log("idade:", idade)
    console.log("peso:", peso)
    console.log("altura:", altura)
    console.log("sexo:", sexo)
    console.log("atividade:", atividade)
    console.log("objetivo:", objetivo)

    if (!peso || !altura || !idade || !sexo) {
      console.log("Algum dado está vazio")
      return
    }

    const pesoNum = Number(peso)
    const alturaNum = Number(altura)
    const idadeNum = Number(idade)

    let metabolismo

    if (sexo === "masculino") {
      metabolismo =
        10 * pesoNum +
        6.25 * alturaNum -
        5 * idadeNum +
        5
    } else {
      metabolismo =
        10 * pesoNum +
        6.25 * alturaNum -
        5 * idadeNum -
        161
    }

    setTmb(metabolismo)

    let fatorAtividade = 1.2

    if (atividade === "leve") fatorAtividade = 1.375
    if (atividade === "moderado") fatorAtividade = 1.55
    if (atividade === "alto") fatorAtividade = 1.725
    if (atividade === "muito_alto") fatorAtividade = 1.9

    const gastoDiario = metabolismo * fatorAtividade

    setTdee(gastoDiario)

    let caloriasFinais = gastoDiario

    if (objetivo === "emagrecer") {
      caloriasFinais = gastoDiario - 400
    }

    if (objetivo === "ganhar_massa") {
      caloriasFinais = gastoDiario + 400
    }

    setCaloriasObjetivo(caloriasFinais)

  }, [])

  function continuar() {
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