import { createContext, useContext } from "react"
import { useAppData } from "./useAppData"

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const value = useAppData()
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppDataContext() {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error("useAppDataContext deve ser usado dentro de AppDataProvider.")
  }

  return context
}
