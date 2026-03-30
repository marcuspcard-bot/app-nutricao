export const objetivoLabels = {
  emagrecer: "Emagrecimento",
  manter: "Manutenção",
  ganhar_massa: "Ganho de massa",
}

export const mealLabels = {
  cafe_da_manha: "Cafe da manha",
  lanche_manha: "Lanche da manha",
  almoco: "Almoco",
  lanche_tarde: "Lanche da tarde",
  jantar: "Jantar",
}

export const recipeCategoryOptions = [
  { key: "rapido", label: "Rapido" },
  { key: "economico", label: "Economico" },
  { key: "pre_treino", label: "Pre-treino" },
  { key: "pos_treino", label: "Pos-treino" },
]

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function parseProtein(proteina) {
  return Number(String(proteina ?? "").replace(/[^\d.]/g, "")) || 0
}

function parseTime(tempo) {
  return Number(String(tempo ?? "").replace(/[^\d.]/g, "")) || 0
}

function inferCategories(recipe) {
  const text = normalizeText(`${recipe.titulo} ${(recipe.ingredientes ?? []).join(" ")}`)
  const categories = new Set(recipe.categorias ?? [])
  const time = parseTime(recipe.tempo)
  const calories = Number(recipe.calorias ?? 0)
  const protein = parseProtein(recipe.proteina)

  if (time > 0 && time <= 10) categories.add("rapido")
  if (calories > 0 && calories <= 350) categories.add("economico")
  if (text.includes("banana") || text.includes("aveia") || text.includes("pao") || text.includes("tapioca")) {
    categories.add("pre_treino")
  }
  if (text.includes("whey") || text.includes("frango") || text.includes("iogurte") || protein >= 25) {
    categories.add("pos_treino")
  }

  return Array.from(categories)
}

export function enrichRecipe(recipe) {
  return {
    ...recipe,
    proteinaNumero: parseProtein(recipe.proteina),
    tempoMinutos: parseTime(recipe.tempo),
    categorias: inferCategories(recipe),
  }
}

const plans = {
  emagrecer: {
    cafe_da_manha: [
      {
        id: "e-cafe-1",
        titulo: "Omelete funcional + fruta",
        calorias: 320,
        proteina: "24g",
        tempo: "10 min",
        imageUrl: "",
        ingredientes: ["2 ovos", "Tomate picado", "Espinafre", "1 maca"],
        preparo: [
          "Bata os ovos e misture tomate e espinafre.",
          "Grelhe em frigideira antiaderente por 4-5 minutos.",
          "Sirva com a maca em fatias.",
        ],
      },
      {
        id: "e-cafe-2",
        titulo: "Iogurte proteico com chia",
        calorias: 290,
        proteina: "21g",
        tempo: "5 min",
        imageUrl: "",
        ingredientes: ["170g iogurte natural", "1 colher de chia", "Morangos", "Canela"],
        preparo: ["Misture o iogurte com chia.", "Adicione morangos picados e canela.", "Consuma gelado."],
      },
    ],
    lanche_manha: [
      {
        id: "e-lanchem-1",
        titulo: "Castanhas + pera",
        calorias: 210,
        proteina: "6g",
        tempo: "2 min",
        imageUrl: "",
        ingredientes: ["15g castanhas", "1 pera"],
        preparo: ["Separe as castanhas em porcao controlada.", "Consuma junto com a pera."],
      },
    ],
    almoco: [
      {
        id: "e-almoco-1",
        titulo: "Frango grelhado com arroz integral",
        calorias: 520,
        proteina: "38g",
        tempo: "25 min",
        imageUrl: "",
        ingredientes: ["150g frango", "100g arroz integral", "Salada verde", "Azeite"],
        preparo: ["Grelhe o frango com temperos naturais.", "Cozinhe o arroz integral.", "Monte o prato com salada e um fio de azeite."],
      },
    ],
    lanche_tarde: [
      {
        id: "e-lanchet-1",
        titulo: "Shake leve de whey",
        calorias: 180,
        proteina: "25g",
        tempo: "3 min",
        imageUrl: "",
        ingredientes: ["1 scoop whey", "200ml agua", "Gelo"],
        preparo: ["Bata tudo no liquidificador por 20 segundos.", "Sirva imediatamente."],
      },
    ],
    jantar: [
      {
        id: "e-jantar-1",
        titulo: "Peixe assado com legumes",
        calorias: 430,
        proteina: "33g",
        tempo: "30 min",
        imageUrl: "",
        ingredientes: ["140g peixe branco", "Abobrinha", "Cenoura", "Limao"],
        preparo: ["Tempere o peixe com limao e sal leve.", "Asse com os legumes por 25 minutos.", "Finalize com ervas frescas."],
      },
    ],
  },
  manter: {
    cafe_da_manha: [
      {
        id: "m-cafe-1",
        titulo: "Pao integral + ovos mexidos",
        calorias: 380,
        proteina: "22g",
        tempo: "12 min",
        imageUrl: "",
        ingredientes: ["2 fatias pao integral", "2 ovos", "Ricota", "Cafe sem acucar"],
        preparo: ["Prepare os ovos mexidos.", "Monte o pao com ricota.", "Sirva com o cafe."],
      },
    ],
    lanche_manha: [
      {
        id: "m-lanchem-1",
        titulo: "Banana com pasta de amendoim",
        calorias: 230,
        proteina: "7g",
        tempo: "2 min",
        imageUrl: "",
        ingredientes: ["1 banana", "1 colher pasta de amendoim"],
        preparo: ["Fatie a banana.", "Finalize com a pasta por cima."],
      },
    ],
    almoco: [
      {
        id: "m-almoco-1",
        titulo: "Carne magra + feijao + arroz",
        calorias: 610,
        proteina: "40g",
        tempo: "30 min",
        imageUrl: "",
        ingredientes: ["130g patinho", "80g feijao", "90g arroz", "Salada"],
        preparo: ["Grelhe a carne magra.", "Aqueça feijao e arroz.", "Monte com salada fresca."],
      },
    ],
    lanche_tarde: [
      {
        id: "m-lanchet-1",
        titulo: "Iogurte + granola",
        calorias: 260,
        proteina: "12g",
        tempo: "3 min",
        imageUrl: "",
        ingredientes: ["Iogurte natural", "2 colheres granola", "Mel opcional"],
        preparo: ["Misture todos os ingredientes em tigela unica."],
      },
    ],
    jantar: [
      {
        id: "m-jantar-1",
        titulo: "Wrap de frango com salada",
        calorias: 470,
        proteina: "29g",
        tempo: "15 min",
        imageUrl: "",
        ingredientes: ["1 tortilha integral", "120g frango desfiado", "Alface", "Tomate"],
        preparo: ["Aqueça a tortilha.", "Recheie com frango e salada.", "Enrole e sirva."],
      },
    ],
  },
  ganhar_massa: {
    cafe_da_manha: [
      {
        id: "g-cafe-1",
        titulo: "Panqueca de aveia proteica",
        calorias: 520,
        proteina: "32g",
        tempo: "15 min",
        imageUrl: "",
        ingredientes: ["2 ovos", "3 colheres aveia", "1 banana", "1 scoop whey"],
        preparo: ["Bata todos os ingredientes.", "Grelhe em fogo medio ate dourar.", "Sirva com fruta."],
      },
    ],
    lanche_manha: [
      {
        id: "g-lanchem-1",
        titulo: "Sanduiche de peito de peru",
        calorias: 340,
        proteina: "21g",
        tempo: "6 min",
        imageUrl: "",
        ingredientes: ["2 fatias pao integral", "Peito de peru", "Queijo branco", "Alface"],
        preparo: ["Monte o sanduiche com os ingredientes frescos."],
      },
    ],
    almoco: [
      {
        id: "g-almoco-1",
        titulo: "Frango + macarrao integral",
        calorias: 760,
        proteina: "48g",
        tempo: "30 min",
        imageUrl: "",
        ingredientes: ["170g frango", "120g macarrao integral", "Molho de tomate"],
        preparo: ["Cozinhe o macarrao.", "Grelhe o frango.", "Misture com molho leve."],
      },
    ],
    lanche_tarde: [
      {
        id: "g-lanchet-1",
        titulo: "Vitamina hipercalorica caseira",
        calorias: 450,
        proteina: "28g",
        tempo: "4 min",
        imageUrl: "",
        ingredientes: ["300ml leite", "Banana", "Aveia", "Pasta de amendoim"],
        preparo: ["Bata tudo no liquidificador ate ficar cremoso."],
      },
    ],
    jantar: [
      {
        id: "g-jantar-1",
        titulo: "Arroz, ovos e carne moida",
        calorias: 690,
        proteina: "42g",
        tempo: "25 min",
        imageUrl: "",
        ingredientes: ["100g arroz", "120g carne moida", "2 ovos", "Legumes"],
        preparo: ["Prepare arroz e carne em panelas separadas.", "Finalize com ovos mexidos e legumes."],
      },
    ],
  },
}

export function getPlanByObjective(objetivo) {
  const plan = plans[objetivo] ?? plans.manter

  return Object.fromEntries(
    Object.entries(plan).map(([mealKey, recipes]) => [mealKey, recipes.map((recipe) => enrichRecipe(recipe))]),
  )
}

export function getRecipeById(recipeId) {
  for (const objective of Object.values(plans)) {
    for (const recipes of Object.values(objective)) {
      const found = recipes.find((recipe) => recipe.id === recipeId)
      if (found) return enrichRecipe(found)
    }
  }
  return null
}

export function getRecipesByMealAndObjective(objetivo, mealKey) {
  const plan = getPlanByObjective(objetivo)
  return plan[mealKey] ?? []
}
