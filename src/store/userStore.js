import { create } from "zustand"

export const useUserStore = create((set) => ({

  nome: "",
  idade: "",
  peso: "",
  altura: "",
  sexo: "",
  atividade: "",
  objetivo: "",

  setNome: (nome) => set({ nome }),
  setIdade: (idade) => set({ idade }),
  setPeso: (peso) => set({ peso }),
  setAltura: (altura) => set({ altura }),
  setSexo: (sexo) => set({ sexo }),
  setAtividade: (atividade) => set({ atividade }),
  setObjetivo: (objetivo) => set({ objetivo }),

}))