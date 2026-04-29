import AsyncStorage from "@react-native-async-storage/async-storage"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

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
      premiumBillingCycle: "monthly",

      setNome: (nome) => set({ nome }),
      setIdade: (idade) => set({ idade }),
      setPeso: (peso) => set({ peso }),
      setAltura: (altura) => set({ altura }),
      setSexo: (sexo) => set({ sexo }),
      setAtividade: (atividade) => set({ atividade }),
      setObjetivo: (objetivo) => set({ objetivo }),
      setPremium: (isPremium) => set({ isPremium }),
      setPremiumBillingCycle: (premiumBillingCycle) => set({ premiumBillingCycle }),
      setPremiumSubscription: ({ isPremium, premiumBillingCycle }) =>
        set({
          isPremium,
          premiumBillingCycle,
        }),
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
          premiumBillingCycle: perfil.premium_billing_cycle ?? perfil.premiumBillingCycle ?? "monthly",
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
          premiumBillingCycle: "monthly",
        }),
    }),
    {
      name: "app-nutricao-user-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
