import "react-native-url-polyfill/auto"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import AppRoutes from "./src/routes/AppRoutes"

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppRoutes />
    </SafeAreaProvider>
  )
}

export default App
