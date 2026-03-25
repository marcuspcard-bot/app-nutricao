import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useUserStore = create(
  persist(
    (set) => ({
      nome: "",
      idade: "",
      peso: "",
      altura: "",
      sexo: "",
      atividade: "",
      objetivo: "",
      tmb: 0,
      tdee: 0,
      caloriasObjetivo: 0,
      isPremium: false,

      setNome: (nome) => set({ nome }),
      setIdade: (idade) => set({ idade }),
      setPeso: (peso) => set({ peso }),
      setAltura: (altura) => set({ altura }),
      setSexo: (sexo) => set({ sexo }),
      setAtividade: (atividade) => set({ atividade }),
      setObjetivo: (objetivo) => set({ objetivo }),
      setPremium: (isPremium) => set({ isPremium }),
      setCalculoMetabolico: ({ tmb, tdee, caloriasObjetivo }) =>
        set({ tmb, tdee, caloriasObjetivo }),
      setPerfil: (perfil) =>
        set({
          nome: perfil.nome ?? "",
          idade: perfil.idade != null ? String(perfil.idade) : "",
          peso: perfil.peso != null ? String(perfil.peso) : "",
          altura: perfil.altura != null ? String(perfil.altura) : "",
          sexo: perfil.sexo ?? "",
          atividade: perfil.atividade ?? "",
          objetivo: perfil.objetivo ?? "",
          tmb: perfil.tmb ?? 0,
          tdee: perfil.tdee ?? 0,
          caloriasObjetivo: perfil.calorias_objetivo ?? perfil.caloriasObjetivo ?? 0,
          isPremium: perfil.is_premium ?? perfil.isPremium ?? false,
        }),
      resetOnboarding: () =>
        set({
          nome: "",
          idade: "",
          peso: "",
          altura: "",
          sexo: "",
          atividade: "",
          objetivo: "",
          tmb: 0,
          tdee: 0,
          caloriasObjetivo: 0,
          isPremium: false,
        }),
    }),
    {
      name: "app-nutricao-user-store",
    },
  ),
)
