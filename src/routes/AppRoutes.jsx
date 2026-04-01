import { useEffect, useMemo, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AppDataProvider } from "../mobile/AppDataContext"
import {
  CheckinScreen,
  CommunityScreen,
  DashboardScreen,
  EvolutionScreen,
  MealPlansScreen,
  MealsOverviewScreen,
  PlaceholderScreen,
  RecipeDetailsScreen,
} from "../mobile/screens/AppScreens"
import {
  AlturaScreen,
  CalculoMetabolicoScreen,
  CriarContaScreen,
  HomeScreen,
  IdadeScreen,
  LoginScreen,
  NivelAtividadeScreen,
  NomeScreen,
  ObjetivoScreen,
  PesoScreen,
  SexoScreen,
  TermsScreen,
} from "../mobile/screens/PublicScreens"
import { colors, radius, spacing, typography } from "../mobile/theme"
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
  const bottomInset = Platform.OS === "android" ? Math.max(insets.bottom, 8) : insets.bottom

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 58 + bottomInset,
            paddingBottom: bottomInset,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Inicio"
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
        name="Refeicoes"
        component={MealsOverviewScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="restaurant" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Evolucao"
        component={EvolutionScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="analytics" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Premium"
        children={() => (
          <PlaceholderScreen
            title="Premium"
            description="Area reservada para assinatura do aplicativo, comparativo de planos e beneficios extras."
            bullets={["Planos e assinatura", "Beneficios premium", "Gestao do acesso"]}
          />
        )}
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
        <Stack.Screen name="MealPlans" component={MealPlansScreen} options={{ title: "Cardapios" }} />
        <Stack.Screen name="RecipeDetails" component={RecipeDetailsScreen} options={{ title: "Receita" }} />
        <Stack.Screen
          name="Metas"
          children={() => (
            <PlaceholderScreen
              title="Metas"
              description="Espaco reservado para metas pessoais, marcos e proximos objetivos."
              bullets={["Metas de peso", "Objetivos por fase", "Marcos da sua jornada"]}
            />
          )}
        />
        <Stack.Screen
          name="Suplementacao"
          children={() => (
            <PlaceholderScreen
              title="Suplementacao"
              description="Area reservada para protocolos, horarios e observacoes."
              bullets={["Protocolos ativos", "Horarios e lembretes", "Ajustes por objetivo"]}
            />
          )}
        />
        <Stack.Screen
          name="Agenda"
          children={() => (
            <PlaceholderScreen
              title="Rotina"
              description="Espaco para organizar sua semana, seus lembretes e seus compromissos."
              bullets={["Planejamento da semana", "Lembretes pessoais", "Organizacao do dia"]}
            />
          )}
        />
        <Stack.Screen
          name="Configuracoes"
          children={() => (
            <PlaceholderScreen
              title="Configuracoes"
              description="Area pronta para preferencias, planos e personalizacao futura."
              bullets={["Preferencias da conta", "Assinatura e plano", "Ajustes do sistema"]}
            />
          )}
        />
      </Stack.Navigator>
    </AppDataProvider>
  )
}

function PublicNavigator() {
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
      <Stack.Screen name="CriarConta" component={CriarContaScreen} />
    </Stack.Navigator>
  )
}

function AppRoutes() {
  const [initializing, setInitializing] = useState(() => hasSupabaseConfig)
  const [session, setSession] = useState(null)

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
          finishBootstrap(null)
          return
        }

        finishBootstrap(data.session ?? null)
      } catch {
        finishBootstrap(null)
      }
    }

    timeoutId = setTimeout(() => {
      finishBootstrap(null)
    }, SESSION_BOOTSTRAP_TIMEOUT_MS)

    loadSession()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
      <View style={styles.loadingShell}>
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={styles.loadingText}>Preparando seu ambiente mobile...</Text>
      </View>
    )
  }

  return (
    <NavigationContainer theme={navTheme}>
      {session ? <PrivateNavigator /> : <PublicNavigator />}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  tabBar: {
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  tabBarLabel: {
    fontFamily: typography.medium,
    fontSize: 11,
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
