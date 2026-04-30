import { useEffect, useMemo, useRef, useState } from "react"
import * as Linking from "expo-linking"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { Platform, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AppDataProvider } from "../mobile/AppDataContext"
import { useAppDataContext } from "../mobile/AppDataContext"
import {
  CheckinScreen,
  CommunityScreen,
  DashboardScreen,
  EvolutionScreen,
  MealPlansScreen,
  MealsOverviewScreen,
  PremiumScreen,
  RecipeDetailsScreen,
  SettingsScreen,
  PlaceholderScreen,
} from "../mobile/screens/AppScreens"
import {
  AlturaScreen,
  CalculoMetabolicoScreen,
  CriarContaScreen,
  ForgotPasswordScreen,
  HomeScreen,
  IdadeScreen,
  LoginScreen,
  NivelAtividadeScreen,
  NomeScreen,
  ObjetivoScreen,
  PesoScreen,
  ResetPasswordScreen,
  SexoScreen,
  TermsScreen,
} from "../mobile/screens/PublicScreens"
import AppLoadingScreen from "../components/AppLoadingScreen"
import { parseAuthCallbackUrl } from "../lib/authRecovery"
import { colors, radius, typography } from "../mobile/theme"
import { logError, logInfo } from "../lib/appLogger"
import { startMeasure, trackScreenMetric } from "../lib/performanceMonitor"
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const SESSION_BOOTSTRAP_TIMEOUT_MS = 7000

function TabIcon({ name, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Ionicons
        name={focused ? name : `${name}-outline`}
        size={18}
        color={focused ? colors.brand : colors.textMuted}
      />
    </View>
  )
}

function AppTabs() {
  const insets = useSafeAreaInsets()
  const bottomInset = Platform.OS === "ios" ? insets.bottom : 0
  const tabBarHeight = Platform.OS === "ios" ? 68 + bottomInset : 68
  const tabBarBottomOffset = Platform.OS === "ios" ? 10 : 18

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        safeAreaInsets: {
          bottom: 0,
          top: 0,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: tabBarBottomOffset,
            height: tabBarHeight,
            paddingTop: 6,
            paddingBottom: Platform.OS === "ios" ? Math.max(bottomInset, 6) : 6,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIconSlot,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Início"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Comunidade"
        component={CommunityScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Refeições"
        component={MealsOverviewScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="restaurant" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Evolução"
        component={EvolutionScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="analytics" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Premium"
        component={PremiumScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="diamond" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  )
}

function PrivateNavigator() {
  return (
    <AppDataProvider>
      <PrivateAppGate />
    </AppDataProvider>
  )
}

function PrivateAppGate() {
  const { initialAppReady } = useAppDataContext()

  if (!initialAppReady) {
    return (
      <AppLoadingScreen
        title="Montando seu painel"
        description="Buscando seu perfil, check-ins e imagens para abrir o app completo."
      />
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: typography.semiBold },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Checkin" component={CheckinScreen} options={{ title: "Check-in semanal" }} />
      <Stack.Screen name="MealPlans" component={MealPlansScreen} options={{ title: "Cardápios" }} />
      <Stack.Screen name="RecipeDetails" component={RecipeDetailsScreen} options={{ title: "Receita" }} />
      <Stack.Screen
        name="Metas"
        children={() => (
          <PlaceholderScreen
            title="Metas"
            description="Espaço reservado para metas pessoais, marcos e próximos objetivos."
            bullets={["Metas de peso", "Objetivos por fase", "Marcos da sua jornada"]}
          />
        )}
      />
      <Stack.Screen
        name="Suplementacao"
        children={() => (
          <PlaceholderScreen
            title="Suplementacao"
            description="Área reservada para protocolos, horários e observações."
            bullets={["Protocolos ativos", "Horários e lembretes", "Ajustes por objetivo"]}
          />
        )}
      />
      <Stack.Screen
        name="Agenda"
        children={() => (
          <PlaceholderScreen
            title="Rotina"
            description="Espaço para organizar sua semana, seus lembretes e seus compromissos."
            bullets={["Planejamento da semana", "Lembretes pessoais", "Organizacao do dia"]}
          />
        )}
      />
      <Stack.Screen
        name="Configurações"
        component={SettingsScreen}
      />
    </Stack.Navigator>
  )
}

function PublicNavigator({ onRecoveryComplete }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Nome" component={NomeScreen} />
      <Stack.Screen name="Idade" component={IdadeScreen} />
      <Stack.Screen name="Peso" component={PesoScreen} />
      <Stack.Screen name="Altura" component={AlturaScreen} />
      <Stack.Screen name="Sexo" component={SexoScreen} />
      <Stack.Screen name="NivelAtividade" component={NivelAtividadeScreen} />
      <Stack.Screen name="Objetivo" component={ObjetivoScreen} />
      <Stack.Screen name="CalculoMetabolico" component={CalculoMetabolicoScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RecuperarSenha" component={ForgotPasswordScreen} />
      <Stack.Screen
        name="NovaSenha"
        children={({ navigation }) => (
          <ResetPasswordScreen navigation={navigation} onRecoveryComplete={onRecoveryComplete} />
        )}
      />
      <Stack.Screen name="CriarConta" component={CriarContaScreen} />
    </Stack.Navigator>
  )
}

function AppRoutes() {
  const [initializing, setInitializing] = useState(() => hasSupabaseConfig)
  const [session, setSession] = useState(null)
  const [authFlow, setAuthFlow] = useState("")
  const navigationRef = useRef(null)
  const navigationReadyRef = useRef(false)
  const activeRouteNameRef = useRef("")
  const transitionMeasureRef = useRef(startMeasure("navigation:bootstrap"))
  const pendingPublicRouteRef = useRef(null)

  function flushPendingPublicRoute() {
    if (!navigationReadyRef.current || !navigationRef.current || !pendingPublicRouteRef.current) {
      return
    }

    const { name, params } = pendingPublicRouteRef.current
    pendingPublicRouteRef.current = null
    navigationRef.current.navigate(name, params)
  }

  async function handleRecoveryLink(url) {
    if (!url || !hasSupabaseConfig || !supabase) {
      return false
    }

    const params = parseAuthCallbackUrl(url)
    if (params.type !== "recovery") {
      return false
    }

    let authError = null

    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code)
      authError = error
    } else if (params.access_token && params.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      })
      authError = error
    } else {
      authError = new Error("Link de recuperação inválido ou incompleto.")
    }

    if (authError) {
      logError("Falha ao processar link de recuperação de senha.", {
        scope: "password-recovery",
        error: authError,
      })
      pendingPublicRouteRef.current = {
        name: "RecuperarSenha",
      }
      setAuthFlow("")
      return true
    }

    setAuthFlow("recovery")
    pendingPublicRouteRef.current = {
      name: "NovaSenha",
    }
    return true
  }

  async function finishRecoveryFlow() {
    setAuthFlow("")

    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut()
    } else {
      setSession(null)
    }

    pendingPublicRouteRef.current = {
      name: "Login",
    }
  }

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return undefined
    }

    let isMounted = true
    let timeoutId

    function finishBootstrap(nextSession = null) {
      if (!isMounted) return
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      setSession(nextSession)
      setInitializing(false)
    }

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          logError("Falha ao recuperar sessão inicial.", {
            scope: "navigation-bootstrap",
            error,
          })
          finishBootstrap(null)
          return
        }

        finishBootstrap(data.session ?? null)
      } catch (error) {
        logError("Erro inesperado ao carregar sessão inicial.", {
          scope: "navigation-bootstrap",
          error,
        })
        finishBootstrap(null)
      }
    }

    timeoutId = setTimeout(() => {
      finishBootstrap(null)
    }, SESSION_BOOTSTRAP_TIMEOUT_MS)

    loadSession()

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthFlow("recovery")
        pendingPublicRouteRef.current = {
          name: "NovaSenha",
        }
      }
      finishBootstrap(nextSession ?? null)
    })

    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return undefined
    }

    let isMounted = true

    async function handleInitialUrl() {
      const initialUrl = await Linking.getInitialURL()
      if (!isMounted || !initialUrl) {
        return
      }

      await handleRecoveryLink(initialUrl)
    }

    function handleIncomingUrl({ url }) {
      handleRecoveryLink(url)
    }

    handleInitialUrl()
    const subscription = Linking.addEventListener("url", handleIncomingUrl)

    return () => {
      isMounted = false
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    flushPendingPublicRoute()
  }, [authFlow, session, initializing])

  const navTheme = useMemo(
    () => ({
      dark: false,
      colors: {
        primary: colors.brand,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.brand,
      },
      fonts: {},
    }),
    [],
  )

  if (initializing) {
    return (
      <AppLoadingScreen
        title="Preparando seu acesso"
        description="Validando sua sessão para abrir a experiência certa do aplicativo."
      />
    )
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => {
        navigationReadyRef.current = true
        const route = navigationRef.current?.getCurrentRoute()
        const routeName = route?.name ?? "unknown"
        activeRouteNameRef.current = routeName

        const completed = transitionMeasureRef.current.end({
          from: "bootstrap",
          to: routeName,
        })

        trackScreenMetric(routeName, {
          event: "navigation-ready",
          durationMs: completed.durationMs,
          context: completed.context,
        })
        logInfo("Navegacao inicial pronta.", {
          routeName,
          durationMs: completed.durationMs,
        })
        flushPendingPublicRoute()
      }}
      onStateChange={() => {
        const route = navigationRef.current?.getCurrentRoute()
        const nextRouteName = route?.name ?? "unknown"
        const previousRouteName = activeRouteNameRef.current || "unknown"

        if (previousRouteName === nextRouteName) {
          return
        }

        const completed = transitionMeasureRef.current.end({
          from: previousRouteName,
          to: nextRouteName,
        })

        trackScreenMetric(nextRouteName, {
          event: "navigation-transition",
          durationMs: completed.durationMs,
          context: completed.context,
        })
        logInfo("Tela alterada.", {
          previousRouteName,
          nextRouteName,
          durationMs: completed.durationMs,
        })

        activeRouteNameRef.current = nextRouteName
        transitionMeasureRef.current = startMeasure(`navigation:${nextRouteName}`, {
          from: previousRouteName,
        })
        flushPendingPublicRoute()
      }}
    >
      {session && authFlow !== "recovery" ? <PrivateNavigator /> : <PublicNavigator onRecoveryComplete={finishRecoveryFlow} />}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    paddingTop: 0,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    borderRadius: radius.xl,
  },
  tabBarItem: {
    paddingTop: 0,
    paddingBottom: 0,
    justifyContent: "center",
  },
  tabBarIconSlot: {
    marginTop: 0,
    marginBottom: 0,
  },
  tabBarLabel: {
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: 2,
    paddingBottom: 0,
  },
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  tabIconActive: {
    backgroundColor: colors.brandSoft,
  },
})

export default AppRoutes
