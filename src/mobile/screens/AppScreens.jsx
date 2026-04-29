import { useEffect, useMemo, useRef, useState } from "react"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { FlatList, Image, ImageBackground, LayoutAnimation, Modal, Pressable, StyleSheet, Text, UIManager, View } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import Svg, { Circle, Line, Polyline } from "react-native-svg"
import { Page, Button, Card, Chip, EmptyStateCard, InputField, MetricTile, ProgressBar, SectionHeader, StatusCard, SurfaceBox, SurfacePressable } from "../ui"
import { colors, radius, spacing, typography } from "../theme"
import { useAppDataContext } from "../AppDataContext"
import AppLoadingScreen from "../../components/AppLoadingScreen"
import { formatShortDate, getChartPointPosition } from "../appDataUtils"
import { useCommunity } from "../useCommunity"
import { useUserStore } from "../../store/userStore"
import { getPlanByObjective, getRecipeById, mealLabels, objetivoLabels, recipeCategoryOptions } from "../../data/mealPlans"
import { getMealImageUrl } from "../../lib/mealCardImagesService"
import { getMealPlanFromSupabase, getRecipeFromSupabase } from "../../lib/mealPlansService"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"
import { fetchCachedResource } from "../../lib/dataClient"
import { readCachedResource } from "../../lib/cacheClient"
import { cacheKeys } from "../../lib/cacheKeys"
import { startMeasure, trackListRenderMetric } from "../../lib/performanceMonitor"
import { useScreenPerformance } from "../useScreenPerformance"

const MEAL_PLAN_MAX_AGE_MS = 30 * 60 * 1000
const RECIPE_MAX_AGE_MS = 6 * 60 * 60 * 1000

if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function runSafeLayoutAnimation() {
  if (!LayoutAnimation?.configureNext || !LayoutAnimation?.Presets?.easeInEaseOut) {
    return
  }

  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function MetricGrid({ items }) {
  return (
    <View style={styles.metricGrid}>
      {items.map((item) => (
        <MetricTile key={item.label} label={item.label} value={item.value} />
      ))}
    </View>
  )
}

function HeroCard({ children, style }) {
  return <Card style={[styles.heroCard, style]}>{children}</Card>
}

function TabPage({ children, contentContainerStyle, ...props }) {
  const tabBarHeight = useBottomTabBarHeight()

  return (
    <Page
      {...props}
      contentContainerStyle={[
        {
          paddingBottom: tabBarHeight + spacing.md,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </Page>
  )
}

function MealProgressCard({ meal, totalCalories }) {
  const maxCalories = totalCalories || 1
  const progress = Math.max(0, Math.min(1, (meal.kcal || 0) / maxCalories))
  const size = 76
  const strokeWidth = 8
  const radiusValue = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radiusValue
  const dashOffset = circumference * (1 - progress)

  const content = (
    <View style={styles.mealProgressCardInner}>
      <View style={styles.mealProgressRingWrap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radiusValue}
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radiusValue}
            stroke={colors.surface}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.mealProgressCenter}>
          <Text style={styles.mealProgressPercent}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>
      <View style={styles.mealProgressCopy}>
        <Text style={styles.mealProgressTitle}>{meal.label}</Text>
        <Text style={styles.mealProgressValue}>{meal.kcal ? `${meal.kcal} kcal` : "-"}</Text>
      </View>
    </View>
  )

  if (meal.imageUrl) {
    return (
      <ImageBackground
        source={{ uri: meal.imageUrl }}
        style={styles.mealProgressCard}
        imageStyle={styles.mealProgressImage}
        resizeMode="cover"
      >
        <View style={styles.mealProgressOverlay}>{content}</View>
      </ImageBackground>
    )
  }

  return (
    <View style={[styles.mealProgressCard, styles.mealProgressCardFallback]}>
      <View style={styles.mealProgressOverlayFallback}>{content}</View>
    </View>
  )
}

const communityMealOptions = [
  { key: "cafe_da_manha", label: "Cafe da manha" },
  { key: "almoco", label: "Almoco" },
  { key: "jantar", label: "Jantar" },
  { key: "lanche", label: "Lanche" },
  { key: "sobremesa_fit", label: "Sobremesa fit" },
]

const premiumPlans = [
  {
    key: "monthly",
    title: "Plano mensal",
    price: "R$ 9,99",
    period: "/mes",
    headline: "Flexibilidade total para entrar agora",
    highlight: "Ideal para testar o app com liberdade.",
    ctaIdle: "Assinar mensal",
    ctaActive: "Plano mensal ativo",
    accent: ["#d7efe4", "#f6fbf8"],
    savings: "",
    features: [
      "Receitas completas sem bloqueio por anuncio",
      "Acesso premium liberado imediatamente",
      "Troca simples para anual quando quiser",
    ],
  },
  {
    key: "yearly",
    title: "Plano anual",
    price: "R$ 39,99",
    period: "/ano",
    headline: "Melhor custo para manter constancia",
    highlight: "Menor valor por periodo para quem quer seguir firme o ano todo.",
    ctaIdle: "Assinar anual",
    ctaActive: "Plano anual ativo",
    accent: ["#214b39", "#326f56"],
    savings: "Melhor oferta",
    originalPrice: "R$ 119,88",
    savingsPercent: "67%",
    features: [
      "Tudo do mensal com melhor custo-beneficio",
      "Prioridade para novas funcionalidades premium",
      "Planejamento continuo para toda a jornada",
    ],
  },
]

const premiumFaqItems = [
  {
    question: "Como funciona a cobranca?",
    answer: "A assinatura pode ser cobrada pela App Store ou Google Play, conforme a plataforma usada no checkout.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim. O cancelamento pode ser feito na loja da assinatura e o acesso segue ativo ate o fim do periodo ja pago.",
  },
  {
    question: "O plano anual renova automaticamente?",
    answer: "Sim, se a renovacao automatica estiver ativa na loja. Depois podemos ligar esse fluxo real ao sistema.",
  },
]

function CommunityPostCard({
  post,
  currentUserId,
  editingPostDraft,
  likingPostId,
  savingPostId,
  editingPostId,
  deletingPostId,
  onToggleLike,
  onOpenComments,
  onToggleSave,
  onStartEditingPost,
  onUpdateEditingDraft,
  onCancelEditingPost,
  onSavePost,
  onRemovePost,
}) {
  return (
    <View style={styles.communityPost}>
      <View style={styles.communityPostHeader}>
        <View style={styles.communityAvatar}>
          <Text style={styles.communityAvatarText}>{post.author.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.communityMeta}>
          <Text style={styles.communityAuthor}>{post.author}</Text>
          <Text style={styles.communityPostInfo}>{post.mealLabel} • {post.postedAt}</Text>
        </View>
        <View style={styles.communityPostMenu}>
          <Text style={styles.communityPostMenuText}>•••</Text>
        </View>
      </View>
      {editingPostDraft?.active ? (
        <View style={styles.communityEditBox}>
          <InputField
            label="Legenda"
            value={editingPostDraft.caption ?? ""}
            onChangeText={(value) => onUpdateEditingDraft(post.id, { caption: value })}
            placeholder="Legenda do post"
          />
          <InputField
            label="Texto"
            value={editingPostDraft.body ?? ""}
            onChangeText={(value) => onUpdateEditingDraft(post.id, { body: value })}
            placeholder="Texto do post"
            multiline
            numberOfLines={4}
          />
          <InputField
            label="Link da imagem"
            value={editingPostDraft.imageUrl ?? ""}
            onChangeText={(value) => onUpdateEditingDraft(post.id, { imageUrl: value })}
            placeholder="URL da imagem"
            autoCapitalize="none"
          />
          <View style={styles.communityActions}>
            <Button
              label={editingPostId === post.id ? "Salvando..." : "Salvar alteracoes"}
              variant="secondary"
              onPress={() => onSavePost(post.id)}
              disabled={editingPostId === post.id}
              style={styles.communityActionButton}
            />
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={() => onCancelEditingPost(post.id)}
              style={styles.communityActionButton}
            />
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.communityCaption}>{post.caption}</Text>
          <Text style={styles.communityBody}>{post.body}</Text>
          {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.communityPostImage} /> : null}
        </>
      )}
      <View style={styles.communityActions}>
        <Chip
          label={
            likingPostId === post.id
              ? "Atualizando curtida..."
              : `${post.likedByMe ? "Curtido" : "Curtir"} • ${post.likes}`
          }
          active={post.likedByMe}
          onPress={() => onToggleLike(post)}
        />
        <Chip
          label={`Comentarios • ${post.commentsCount ?? 0}`}
          onPress={() => onOpenComments(post.id)}
        />
        <Chip
          label={savingPostId === post.id ? "Salvando..." : post.savedByMe ? "Salvo" : "Salvar"}
          active={post.savedByMe}
          onPress={() => onToggleSave(post)}
        />
        {post.userId && post.userId === currentUserId ? (
          <>
            <Chip label="Editar" onPress={() => onStartEditingPost(post)} />
            <Chip
              label={deletingPostId === post.id ? "Excluindo..." : "Excluir"}
              tone="warning"
              onPress={() => onRemovePost(post.id)}
            />
          </>
        ) : null}
      </View>
    </View>
  )
}

function RecipeListItem({ receita, selectedMealLabel, navigation }) {
  return (
    <Pressable
      onPress={() =>
        navigation.navigate("RecipeDetails", {
          recipeId: receita.id,
          backLabel: selectedMealLabel || "Cardapios",
        })
      }
      style={styles.recipeCard}
    >
      {receita.imageUrl ? (
        <ImageBackground source={{ uri: receita.imageUrl }} imageStyle={styles.recipeImage} style={styles.recipeImageShell}>
          <View style={styles.recipeOverlay}>
            <Text style={styles.recipeTitle}>{receita.titulo}</Text>
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.recipeFallback}>
          <Text style={styles.recipeTitle}>{receita.titulo}</Text>
        </View>
      )}
      <Text style={styles.recipeMeta}>{receita.calorias} kcal</Text>
      <Text style={styles.recipeSmall}>{receita.proteina} proteina • {receita.tempo}</Text>
      {(receita.categorias ?? []).length ? (
        <View style={styles.chipRow}>
          {receita.categorias.slice(0, 3).map((categoria) => {
            const label = recipeCategoryOptions.find((option) => option.key === categoria)?.label ?? categoria
            return <Chip key={`${receita.id}-${categoria}`} label={label} />
          })}
        </View>
      ) : null}
      {receita.ingredientes?.length ? (
        <Text style={styles.recipeIngredients}>{receita.ingredientes.slice(0, 3).join(" • ")}</Text>
      ) : null}
    </Pressable>
  )
}

export function DashboardScreen({ navigation }) {
  useScreenPerformance("DashboardScreen")
  const appData = useAppDataContext()
  const resetOnboarding = useUserStore((state) => state.resetOnboarding)
  const dailyProgress = appData.tdee ? Math.min(100, Math.round((appData.caloriasObjetivo / appData.tdee) * 100)) : 0

  async function sair() {
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut()
    }
  }

  async function recomecarOnboarding() {
    resetOnboarding()
    if (hasSupabaseConfig && supabase) {
      await supabase.auth.signOut()
    }
  }

  return (
    <TabPage>
      <HeroCard style={styles.dashboardHero}>
        <LinearGradient colors={["#326f56", "#214b39", "#142a20"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dashboardHeroGradient}>
          <View style={styles.dashboardHeroTopRow}>
            <View>
              <Text style={styles.dashboardHeroLabel}>Today</Text>
              <Text style={styles.dashboardHeroDate}>{appData.hoje}</Text>
            </View>
            <Chip label={appData.isPremium ? "Premium" : "Free"} active={appData.isPremium} />
          </View>
          <View style={styles.dashboardHeroMainRow}>
            <View style={styles.dashboardHeroMainCopy}>
              <Text style={styles.dashboardHeroKicker}>Resumo diário</Text>
              <Text style={styles.dashboardHeroName}>{appData.saudacao}</Text>
              <Text style={styles.dashboardHeroSubcopy}>{appData.objetivoLabel}</Text>
            </View>
            <View style={styles.dashboardScoreCard}>
              <Text style={styles.dashboardScoreLabel}>Plano</Text>
              <Text style={styles.dashboardScoreValue}>{dailyProgress || appData.balanceScore || 0}%</Text>
              <Text style={styles.dashboardScoreHint}>consistencia</Text>
            </View>
          </View>
          <View style={styles.dashboardHeroSummaryGrid}>
            <View style={styles.dashboardSummaryCard}>
              <Text style={styles.dashboardSummaryValue}>{appData.caloriasObjetivo ? `${appData.caloriasObjetivo}` : "-"}</Text>
              <Text style={styles.dashboardSummaryLabel}>kcal alvo</Text>
            </View>
            <View style={styles.dashboardSummaryCard}>
              <Text style={styles.dashboardSummaryValue}>{appData.tdee || "-"}</Text>
              <Text style={styles.dashboardSummaryLabel}>gasto diário</Text>
            </View>
            <View style={styles.dashboardSummaryCard}>
              <Text style={styles.dashboardSummaryValue}>{appData.caloriasRestantes || 0}</Text>
              <Text style={styles.dashboardSummaryLabel}>kcal livres</Text>
            </View>
          </View>

          <View style={styles.dashboardInlineNutrition}>
            <Text style={styles.dashboardInlineNutritionTitle}>Distribuicao nutricional</Text>
            <View style={styles.progressGroup}>
              <Text style={styles.dashboardInlineNutritionLabel}>Calorias {appData.caloriasObjetivo ? `${appData.caloriasObjetivo} kcal` : "-"}</Text>
              <ProgressBar value={100} />
            </View>
            <View style={styles.progressGroup}>
              <Text style={styles.dashboardInlineNutritionLabel}>Carboidratos {appData.carboMeta ? `${appData.carboMeta} g` : "-"}</Text>
              <ProgressBar value={78} tone="carbs" />
            </View>
            <View style={styles.progressGroup}>
              <Text style={styles.dashboardInlineNutritionLabel}>Proteina {appData.proteinaMeta ? `${appData.proteinaMeta} g` : "-"}</Text>
              <ProgressBar value={84} tone="protein" />
            </View>
            <View style={styles.progressGroup}>
              <Text style={styles.dashboardInlineNutritionLabel}>Gorduras {appData.gorduraMeta ? `${appData.gorduraMeta} g` : "-"}</Text>
              <ProgressBar value={64} tone="fat" />
            </View>
          </View>

          {(appData.dataLoading || appData.dataRefreshing || appData.dataStale || appData.dataError || appData.profileSyncing) ? (
            <View style={styles.chipRow}>
              {appData.dataLoading ? <Chip label="Sincronizando dados..." /> : null}
              {appData.dataRefreshing ? <Chip label="Atualizando em segundo plano..." /> : null}
              {appData.dataStale ? <Chip label="Mostrando dados salvos" tone="warning" /> : null}
              {appData.profileSyncing ? <Chip label="Salvando perfil..." /> : null}
              {appData.dataError ? <Chip label={appData.dataError} tone="warning" /> : null}
            </View>
          ) : null}
        </LinearGradient>
      </HeroCard>

      <Card style={styles.dashboardSectionCard}>
        <SectionHeader title="Acoes rapidas" helper="Atalhos principais para manter sua rotina em movimento." />
        <View style={styles.dashboardActionGrid}>
          <SurfacePressable onPress={() => navigation.navigate("Checkin")} style={styles.dashboardActionCard}>
            <Text style={styles.dashboardActionTitle}>Registrar check-in</Text>
            <Text style={styles.dashboardActionCopy}>Atualize peso e progresso semanal.</Text>
          </SurfacePressable>
          <SurfacePressable onPress={() => navigation.navigate("MealPlans")} style={styles.dashboardActionCard}>
            <Text style={styles.dashboardActionTitle}>Abrir cardápios</Text>
            <Text style={styles.dashboardActionCopy}>Veja refeições e receitas do seu plano.</Text>
          </SurfacePressable>
          <SurfacePressable onPress={() => navigation.navigate("Metas")} style={styles.dashboardActionCard}>
            <Text style={styles.dashboardActionTitle}>Metas</Text>
            <Text style={styles.dashboardActionCopy}>Acompanhe marcos e proximos passos.</Text>
          </SurfacePressable>
          <SurfacePressable onPress={() => navigation.navigate("Agenda")} style={styles.dashboardActionCard}>
            <Text style={styles.dashboardActionTitle}>Rotina</Text>
            <Text style={styles.dashboardActionCopy}>Organize lembretes e compromissos.</Text>
          </SurfacePressable>
        </View>
      </Card>

      <Card style={styles.dashboardSectionCard}>
        <SectionHeader title="Conta e plano" helper="Configurações administrativas e simulação de acesso." />
        <View style={styles.dashboardControlStack}>
          <Button
            label={appData.isPremium ? "Trocar para gratuito" : "Simular premium"}
            variant="secondary"
            onPress={() => appData.setPremium(!appData.isPremium)}
          />
          <Button
            label="Suplementacao"
            variant="ghost"
            onPress={() => navigation.navigate("Suplementacao")}
          />
          <Button
            label="Configurações"
            variant="ghost"
            onPress={() => navigation.navigate("Configurações")}
          />
          <Button
            label="Refazer onboarding"
            variant="ghost"
            onPress={recomecarOnboarding}
          />
          <Button label="Sair" variant="ghost" onPress={sair} />
        </View>
      </Card>
    </TabPage>
  )
}

export function MealsOverviewScreen({ navigation }) {
  useScreenPerformance("MealsOverviewScreen")
  const { meals, caloriasObjetivo } = useAppDataContext()

  return (
    <TabPage>
      <Card>
        <SectionHeader title="Abrir cardápios" helper="Entre nos planos completos organizados por refeição." />
        <Button label="Ver todos os cardápios" onPress={() => navigation.navigate("MealPlans")} />
      </Card>

      <Card>
        <SectionHeader title="Plano do dia" helper="Distribuição estimada por refeição." />
        <View style={styles.mealPillGrid}>
          {meals.map((meal) => <MealProgressCard key={meal.key} meal={meal} totalCalories={caloriasObjetivo} />)}
        </View>
      </Card>
    </TabPage>
  )
}

export function CommunityScreen() {
  const nome = useUserStore((state) => state.nome)
  const {
    posts,
    loading,
    initialLoading,
    refreshing,
    loadingMore,
    submitting,
    likingPostId,
    commentingPostId,
    savingPostId,
    editingPostId,
    deletingPostId,
    deletingCommentId,
    hasMorePosts,
    currentUserId,
    source,
    staleData,
    loadMorePosts,
    loadCommentsForPost,
    publishPost,
    toggleLike,
    toggleSave,
    addComment,
    editPost,
    removePost,
    removeComment,
  } = useCommunity(nome)
  const [caption, setCaption] = useState("")
  const [body, setBody] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageAsset, setImageAsset] = useState(null)
  const [mealType, setMealType] = useState(communityMealOptions[0].key)
  const [feedback, setFeedback] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [commentDrafts, setCommentDrafts] = useState({})
  const [editingPostDrafts, setEditingPostDrafts] = useState({})
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [commentsSheetPostId, setCommentsSheetPostId] = useState("")
  const feedRenderMeasureRef = useRef(startMeasure("community-feed-render"))
  const composerName = nome?.trim() || "Você"
  const previousTopPostIdRef = useRef("")

  useScreenPerformance("CommunityScreen", {
    postsCount: posts.length,
  })

  const selectedMealLabel = communityMealOptions.find((option) => option.key === mealType)?.label ?? "Refeição"
  const previewUrl = imageAsset?.uri || String(imageUrl).trim()
  const commentsSheetPost = posts.find((item) => item.id === commentsSheetPostId) ?? null

  useEffect(() => {
    feedRenderMeasureRef.current = startMeasure("community-feed-render", {
      itemCount: posts.length,
    })
  }, [posts.length])

  useEffect(() => {
    const topPostId = posts[0]?.id ?? ""

    if (!topPostId) return

    if (!previousTopPostIdRef.current) {
      previousTopPostIdRef.current = topPostId
      return
    }

    if (previousTopPostIdRef.current !== topPostId) {
      runSafeLayoutAnimation()
      previousTopPostIdRef.current = topPostId
    }
  }, [posts])

  if (initialLoading) {
    return (
      <AppLoadingScreen
        title="Abrindo comunidade"
        description="Preparando o feed, as interações e as publicações mais recentes."
      />
    )
  }

  async function pickFromLibrary() {
    setFeedback("")
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      setFeedback("Precisamos de permissão para acessar a galeria e anexar a foto da refeição.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
    })

    if (result.canceled || !result.assets?.length) return

    setImageAsset(result.assets[0])
    setImageUrl("")
  }

  async function takePhoto() {
    setFeedback("")
    const permission = await ImagePicker.requestCameraPermissionsAsync()

    if (!permission.granted) {
      setFeedback("Precisamos de permissão para usar a câmera e fotografar a refeição.")
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
    })

    if (result.canceled || !result.assets?.length) return

    setImageAsset(result.assets[0])
    setImageUrl("")
  }

  function clearSelectedImage() {
    setImageAsset(null)
    setImageUrl("")
  }

  async function handleToggleLike(post) {
    setFeedback("")
    const { error } = await toggleLike(post.id)

    if (error) {
      setFeedback("Não foi possível atualizar a curtida agora. Tente novamente em instantes.")
    }
  }

  async function openComments(postId) {
    setCommentsSheetPostId(postId)
    const targetPost = posts.find((item) => item.id === postId)
    if (!targetPost?.commentsLoaded && targetPost?.commentsCount) {
      const { error } = await loadCommentsForPost(postId)
      if (error) {
        setFeedback("Não foi possível carregar os comentários agora.")
      }
    }
  }

  async function handleAddComment(postId) {
    setFeedback("")
    const { error } = await addComment(postId, commentDrafts[postId] ?? "")

    if (error) {
      setFeedback(error.message || "Não foi possível enviar o comentário agora.")
      return
    }

    setCommentDrafts((current) => ({
      ...current,
      [postId]: "",
    }))
  }

  function startEditingPost(post) {
    setEditingPostDrafts((current) => ({
      ...current,
      [post.id]: {
        caption: post.caption,
        body: post.body,
        imageUrl: post.imageUrl,
        mealLabel: post.mealLabel,
        active: true,
      },
    }))
  }

  function cancelEditingPost(postId) {
    setEditingPostDrafts((current) => ({
      ...current,
      [postId]: {
        ...current[postId],
        active: false,
      },
    }))
  }

  async function handleSavePost(post) {
    setFeedback("")
    const { error } = await toggleSave(post.id)
    if (error) setFeedback("Não foi possível atualizar os posts salvos agora.")
  }

  async function handleEditPost(postId) {
    setFeedback("")
    const draft = editingPostDrafts[postId]
    if (!draft) return

    const { error } = await editPost({
      postId,
      caption: draft.caption ?? "",
      body: draft.body ?? "",
      imageUrl: draft.imageUrl ?? "",
      mealLabel: draft.mealLabel ?? "Refeição",
    })

    if (error) {
      setFeedback(error.message || "Não foi possível salvar as edições do post.")
      return
    }

    cancelEditingPost(postId)
  }

  async function handleRemovePost(postId) {
    setFeedback("")
    const { error } = await removePost(postId)
    if (error) setFeedback("Não foi possível excluir o post agora.")
  }

  async function handleRemoveComment(postId, commentId) {
    setFeedback("")
    const { error } = await removeComment(postId, commentId)
    if (error) setFeedback("Não foi possível excluir o comentário agora.")
  }

  function updateEditingDraft(postId, nextValues) {
    setEditingPostDrafts((current) => ({
      ...current,
      [postId]: {
        ...current[postId],
        ...nextValues,
        active: true,
      },
    }))
  }

  function handleCommunityScroll(event) {
    if (source !== "supabase" || loading || loadingMore || !hasMorePosts) return

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height)

    if (distanceFromBottom < 240) {
      loadMorePosts()
    }
  }

  async function handlePublishPost() {
    setFeedback("")
    setSuccessMessage("")

    if (!caption.trim()) {
      setFeedback("Adicione uma legenda curta para apresentar a sua refeição.")
      return
    }

    if (!body.trim()) {
      setFeedback("Escreva um texto contando como foi a refeição, a preparação ou o contexto do post.")
      return
    }

    const { error, source: publishSource } = await publishPost({
      caption,
      body,
      imageUrl: previewUrl,
      imageAsset,
      mealLabel: selectedMealLabel,
    })

    if (error) {
      setFeedback(`Não foi possível publicar agora. ${error.message || "Tente novamente em instantes."}`)
      return
    }

    setCaption("")
    setBody("")
    setImageUrl("")
    setImageAsset(null)
    setMealType(communityMealOptions[0].key)
    setIsComposerOpen(false)
    setSuccessMessage(
      publishSource === "supabase"
        ? "Publicação criada e salva no Supabase."
        : "Publicação criada localmente. Quando a persistência on-line estiver disponível, ela poderá ser sincronizada.",
    )
  }

  function handleInlineImageAction(action) {
    setIsComposerOpen(true)
    if (action === "gallery") {
      pickFromLibrary()
      return
    }

    if (action === "camera") {
      takePhoto()
      return
    }
  }

  return (
    <Page
      scrollProps={{
        onScroll: handleCommunityScroll,
        scrollEventThrottle: 16,
      }}
    >
      <Card style={styles.communityShell}>
        <View style={styles.communityTopBar}>
          <View style={styles.communityTitleWrap}>
            <Text style={styles.communitySectionLabel}>Comunidade</Text>
            <Text style={styles.communitySectionTitle}>Feed de refeições e rotina</Text>
            <Text style={styles.communitySectionSubtitle}>Novos posts aparecem automaticamente conforme a comunidade publica.</Text>
          </View>
        </View>

        <View style={styles.communityComposerEntry}>
          <Pressable onPress={() => setIsComposerOpen((current) => !current)} style={styles.communityComposerPromptButton}>
            <View style={styles.communityComposerAvatar}>
              <Text style={styles.communityComposerAvatarText}>{composerName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.communityComposerPrompt}>
              <Text style={styles.communityComposerPromptTitle}>No que você está pensando?</Text>
              <Text style={styles.communityComposerPromptHint}>Compartilhe uma refeição, dica ou progresso.</Text>
            </View>
          </Pressable>
          <View style={styles.communityComposerInlineActions}>
            <Chip label="Galeria" onPress={() => handleInlineImageAction("gallery")} />
            <Chip label="Câmera" onPress={() => handleInlineImageAction("camera")} />
            <Chip label={isComposerOpen ? "Fechar" : "Texto"} active={isComposerOpen} onPress={() => setIsComposerOpen((current) => !current)} />
          </View>
        </View>

        <View style={styles.chipRow}>
          {refreshing ? <Chip label="Atualizando feed..." /> : null}
          {staleData ? <Chip label="Mostrando dados salvos" tone="warning" /> : null}
          {source === "supabase" ? <Chip label="Tempo real" active /> : null}
        </View>

      </Card>

      {loading && !posts.length ? (
        <StatusCard
          eyebrow="Sincronizando"
          title="Carregando comunidade"
          description="Estamos buscando as publicações mais recentes no feed."
        />
      ) : null}

      {isComposerOpen ? (
        <Card style={styles.communityComposerCard}>
          <View style={styles.communityComposerCompactHeader}>
            <View style={styles.communityComposerHeader}>
              <Text style={styles.communityComposerTitle}>Novo post</Text>
              <Text style={styles.communityComposerHint}>Rápido, direto e sem excesso.</Text>
            </View>
            <Chip label={selectedMealLabel} active />
          </View>
          <InputField
            label="Legenda curta"
            value={caption}
            onChangeText={setCaption}
            placeholder="Ex: Almoço proteico de hoje"
          />
          <InputField
            label="Descrição"
            value={body}
            onChangeText={setBody}
            placeholder="Compartilhe a refeição ou uma dica rápida"
            multiline
            numberOfLines={4}
          />
          <View style={styles.communityComposerToolbar}>
            <Button label="Galeria" variant="secondary" onPress={pickFromLibrary} style={styles.communityToolbarButton} />
            <Button label="Câmera" variant="secondary" onPress={takePhoto} style={styles.communityToolbarButton} />
            <Button
              label="Link"
              variant="ghost"
              onPress={() => {
                if (imageAsset) {
                  setImageAsset(null)
                }
              }}
              style={styles.communityToolbarButton}
            />
          </View>
          {!imageAsset ? (
            <InputField
              label="Link da imagem"
              value={imageUrl}
              onChangeText={(value) => {
                setImageAsset(null)
                setImageUrl(value)
              }}
              placeholder="Cole a URL da imagem se quiser"
              autoCapitalize="none"
            />
          ) : null}
          <View style={styles.filterGroup}>
            <Text style={styles.filterTitle}>Categoria</Text>
            <View style={styles.chipRow}>
              {communityMealOptions.map((option) => (
                <Chip
                  key={option.key}
                  label={option.label}
                  active={mealType === option.key}
                  onPress={() => setMealType(option.key)}
                />
              ))}
            </View>
          </View>
          {previewUrl ? (
            <View style={styles.communityPreviewRail}>
              <Image source={{ uri: previewUrl }} style={styles.communityPreviewThumb} />
              <View style={styles.communityPreviewCopy}>
                <Text style={styles.communityPreviewLabel}>Imagem pronta para o post</Text>
                <Text style={styles.communityPreviewHint}>Ela vai aparecer no topo da publicação.</Text>
                <View style={styles.communityPreviewActions}>
                  <Chip label="Trocar" onPress={pickFromLibrary} />
                  <Chip label="Remover" onPress={clearSelectedImage} />
                </View>
              </View>
            </View>
          ) : null}
          {feedback ? <Text style={styles.warningText}>{feedback}</Text> : null}
          {successMessage ? <Text style={styles.communitySuccessText}>{successMessage}</Text> : null}
          <Button label={submitting ? "Publicando..." : "Publicar"} onPress={handlePublishPost} disabled={submitting} />
        </Card>
      ) : null}

      <Card style={styles.communityFeedCard}>
        <View style={styles.communityFeedHeader}>
          <SectionHeader title="Feed da comunidade" helper="Veja o que outras pessoas estão compartilhando agora." trailing={`${posts.length} posts`} />
        </View>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommunityPostCard
              post={{
                ...item,
                commentDraft: commentDrafts[item.id] ?? "",
              }}
              currentUserId={currentUserId}
              editingPostDraft={editingPostDrafts[item.id]}
              likingPostId={likingPostId}
              savingPostId={savingPostId}
              editingPostId={editingPostId}
              deletingPostId={deletingPostId}
              onToggleLike={handleToggleLike}
              onOpenComments={openComments}
              onToggleSave={handleSavePost}
              onStartEditingPost={startEditingPost}
              onUpdateEditingDraft={updateEditingDraft}
              onCancelEditingPost={cancelEditingPost}
              onSavePost={handleEditPost}
              onRemovePost={handleRemovePost}
            />
          )}
          scrollEnabled={false}
          removeClippedSubviews
          initialNumToRender={4}
          maxToRenderPerBatch={5}
          windowSize={7}
          updateCellsBatchingPeriod={60}
          contentContainerStyle={styles.communityFeedList}
          onContentSizeChange={() => {
            const completed = feedRenderMeasureRef.current.end({
              itemCount: posts.length,
            })
            trackListRenderMetric("community-feed", {
              durationMs: completed.durationMs,
              itemCount: posts.length,
              virtualization: "flat-list",
            })
          }}
          ListFooterComponent={
            source === "supabase" && loadingMore ? (
              <Button
                label="Carregando mais posts..."
                variant="secondary"
                disabled
                style={styles.communityLoadMoreButton}
              />
            ) : source === "supabase" && !hasMorePosts && posts.length > 0 ? (
              <Text style={styles.communityFeedEnd}>Você chegou ao fim do feed por enquanto.</Text>
            ) : null
          }
        />
      </Card>

      <Modal visible={Boolean(commentsSheetPost)} transparent animationType="slide" onRequestClose={() => setCommentsSheetPostId("")}>
        <View style={styles.commentsModalOverlay}>
          <Pressable style={styles.commentsModalBackdrop} onPress={() => setCommentsSheetPostId("")} />
          <View style={styles.commentsSheet}>
            {commentsSheetPost ? (
              <>
                <View style={styles.commentsSheetHandle} />
                <View style={styles.commentsSheetHeader}>
                  <View style={styles.commentsSheetHeaderCopy}>
                    <Text style={styles.commentsSheetTitle}>Comentarios</Text>
                    <Text style={styles.commentsSheetSubtitle}>{commentsSheetPost.caption}</Text>
                  </View>
                  <Chip label="Fechar" onPress={() => setCommentsSheetPostId("")} />
                </View>
                <FlatList
                  data={commentsSheetPost.comments ?? []}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.communityCommentCard}>
                      <View style={styles.communityCommentHeader}>
                        <Text style={styles.communityCommentAuthor}>{item.author}</Text>
                        <Text style={styles.communityCommentDate}>{item.postedAt}</Text>
                      </View>
                      <Text style={styles.communityCommentBody}>{item.body}</Text>
                      {item.userId && item.userId === currentUserId ? (
                        <View style={styles.communityCommentActions}>
                          <Chip
                            label={deletingCommentId === item.id ? "Excluindo..." : "Excluir comentário"}
                            tone="warning"
                            onPress={() => handleRemoveComment(commentsSheetPost.id, item.id)}
                          />
                        </View>
                      ) : null}
                    </View>
                  )}
                  style={styles.commentsList}
                  contentContainerStyle={styles.commentsListContent}
                  ListEmptyComponent={
                    commentsSheetPost.commentsLoading ? (
                      <Text style={styles.communityCommentEmpty}>Carregando comentários...</Text>
                    ) : (
                      <Text style={styles.communityCommentEmpty}>Seja a primeira pessoa a comentar essa refeição.</Text>
                    )
                  }
                  ListFooterComponent={
                    <>
                      {commentsSheetPost.commentsError ? <Text style={styles.warningText}>{commentsSheetPost.commentsError}</Text> : null}
                      {commentsSheetPost.commentsHasMore ? (
                        <Button
                          label={commentsSheetPost.commentsRefreshing ? "Carregando mais comentários..." : "Ver mais comentários"}
                          variant="ghost"
                          onPress={() => loadCommentsForPost(commentsSheetPost.id, { mode: "append" })}
                          disabled={commentsSheetPost.commentsRefreshing}
                        />
                      ) : null}
                    </>
                  }
                />
                <View style={styles.commentsComposer}>
                  <InputField
                    label="Novo comentário"
                    value={commentDrafts[commentsSheetPost.id] ?? ""}
                    onChangeText={(value) =>
                      setCommentDrafts((current) => ({
                        ...current,
                        [commentsSheetPost.id]: value,
                      }))
                    }
                    placeholder="Escreva um comentário útil ou motivador..."
                    multiline
                    numberOfLines={3}
                  />
                  <Button
                    label={commentingPostId === commentsSheetPost.id ? "Enviando comentário..." : "Enviar comentário"}
                    variant="secondary"
                    onPress={() => handleAddComment(commentsSheetPost.id)}
                    disabled={commentingPostId === commentsSheetPost.id}
                  />
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </Page>
  )
}

export function CheckinScreen({ navigation }) {
  useScreenPerformance("CheckinScreen")
  const { addWeeklyCheckin, history, peso, savingCheckin } = useAppDataContext()
  const [pesoCheckin, setPesoCheckin] = useState(peso || "")
  const [feedback, setFeedback] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function salvar() {
    setFeedback("")
    setSuccessMessage("")

    const parsedWeight = Number(String(pesoCheckin).replace(",", "."))
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      setFeedback("Informe um peso válido para registrar o check-in.")
      return
    }

    const { error } = await addWeeklyCheckin({
      date: new Date().toISOString(),
      peso: Number(parsedWeight.toFixed(1)),
    })

    if (error) {
      setFeedback("Não foi possível salvar seu check-in agora. Tente novamente em instantes.")
      return
    }

    setSuccessMessage("Check-in salvo com sucesso. Sua evolução já foi atualizada.")
    setTimeout(() => {
      navigation.navigate("AppTabs", {
        screen: "Evolução",
        params: { checkinSaved: Date.now() },
      })
    }, 500)
  }

  return (
    <TabPage>
      <Card>
        <SectionHeader title="Check-in semanal" helper="Acompanhamento rápido para manter a constância." trailing={history.length ? `${history.length} semanas` : "Novo"} />
        <InputField
          label="Seu peso atual"
          value={String(pesoCheckin)}
          onChangeText={setPesoCheckin}
          placeholder="Ex: 72.4"
          keyboardType="decimal-pad"
        />
        {feedback ? <StatusCard tone="warning" title="Não foi possível concluir o check-in" description={feedback} /> : null}
        {successMessage ? <StatusCard tone="success" title="Check-in registrado" description={successMessage} /> : null}
        <Button label={savingCheckin ? "Salvando check-in..." : "Salvar check-in"} onPress={salvar} disabled={savingCheckin} />
      </Card>
    </TabPage>
  )
}

function EvolutionChart({ chartPoints, history, checkinsLoading }) {
  if (!history.length) {
    return checkinsLoading ? (
      <StatusCard
        eyebrow="Sincronizando"
        title="Carregando histórico de evolução"
        description="Estamos buscando os registros mais recentes no Supabase."
      />
    ) : (
      <EmptyStateCard
        title="Seu gráfico ainda não tem registros"
        description="Assim que o primeiro check-in for salvo, a evolução do peso aparecerá aqui automaticamente."
      />
    )
  }

  const points = chartPoints
    .split(" ")
    .map((point) => point.split(",").map(Number))
    .map(([x, y]) => `${x},${y}`)
    .join(" ")

  return (
    <Card>
      <SectionHeader title="Gráfico de evolução" trailing="Peso semanal" />
      <Svg width="100%" height={160} viewBox="0 0 280 120">
        <Line x1="0" y1="112" x2="280" y2="112" stroke="#d8d1c4" strokeWidth="2" />
        <Polyline points={points} fill="none" stroke={colors.brand} strokeWidth="3" />
        {history.map((item, index) => {
          const { cx, cy } = getChartPointPosition(history, index)
          return <Circle key={item.id} cx={cx} cy={cy} r="4" fill={colors.brandDark} />
        })}
      </Svg>
      <View style={styles.chartLabelRow}>
        {history.map((item) => (
          <Text key={item.id} style={styles.chartLabel}>{formatShortDate(item.date)}</Text>
        ))}
      </View>
    </Card>
  )
}

export function EvolutionScreen({ route }) {
  useScreenPerformance("EvolutionScreen")
  const {
    chartPoints,
    history,
    latestCheckin,
    peso,
    previousCheckin,
    weightDelta,
    objetivoLabel,
    idade,
    altura,
    atividade,
    sexo,
    tmb,
    tdee,
    caloriasObjetivo,
    checkinsLoading,
  } = useAppDataContext()

  return (
    <TabPage>
      {route.params?.checkinSaved ? (
        <StatusCard
          tone="success"
          eyebrow="Check-in atualizado"
          title="Evolução sincronizada com sucesso"
          description="O peso salvo já faz parte do seu histórico e do gráfico de evolução."
        />
      ) : null}

      <Card>
        <SectionHeader title="Evolução recente" helper="Visualize seu progresso com mais clareza e contexto." trailing={history.length ? `${history.length} registros` : "Sem registros"} />
        <MetricGrid
          items={[
            { label: "Peso atual", value: latestCheckin ? `${latestCheckin.peso} kg` : peso ? `${peso} kg` : "-" },
            { label: "Variação", value: previousCheckin ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg` : "-" },
            { label: "Check-ins", value: history.length || "-" },
          ]}
        />
      </Card>

      <EvolutionChart chartPoints={chartPoints} history={history} checkinsLoading={checkinsLoading} />

      <Card>
        <SectionHeader title="Seu resumo corporal" trailing={objetivoLabel} />
        <MetricGrid
          items={[
            { label: "Idade", value: idade || "-" },
            { label: "Sexo", value: sexo || "-" },
            { label: "Peso", value: peso ? `${peso} kg` : "-" },
            { label: "Altura", value: altura ? `${altura} cm` : "-" },
            { label: "Atividade", value: atividade || "-" },
            { label: "TMB", value: tmb || "-" },
            { label: "Gasto diário", value: tdee || "-" },
            { label: "Meta calórica", value: caloriasObjetivo ? `${caloriasObjetivo} kcal` : "-" },
          ]}
        />
      </Card>

      <Card>
        <SectionHeader title="Histórico recente" trailing="Últimos registros" />
        {history.length ? [...history].slice(-6).reverse().map((item) => (
          <SurfaceBox key={item.id} style={styles.historyItem}>
            <View style={styles.historyCopy}>
              <Text style={styles.historyTitle}>{item.label}</Text>
              <Text style={styles.historyDescription}>Registro semanal salvo no Supabase.</Text>
            </View>
            <View>
              <Text style={styles.historyValue}>{item.peso} kg</Text>
              <Text style={styles.historyDate}>{formatShortDate(item.date)}</Text>
            </View>
          </SurfaceBox>
        )) : (
          <EmptyStateCard
            title="Nenhum check-in registrado ainda"
            description="Quando o primeiro check-in for salvo, os últimos registros aparecerão aqui com data e peso."
          />
        )}
      </Card>
    </TabPage>
  )
}

function FilterGroup({ title, options, value, onChange }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  )
}

export function MealPlansScreen({ navigation, route }) {
  useScreenPerformance("MealPlansScreen", {
    mealKey: route.params?.mealKey ?? "",
  })
  const { mealCardImagesByKey } = useAppDataContext()
  const mealKey = route.params?.mealKey ?? ""
  const objetivo = useUserStore((state) => state.objetivo)
  const caloriasObjetivo = useUserStore((state) => state.caloriasObjetivo)
  const fallbackPlan = useMemo(() => getPlanByObjective(objetivo), [objetivo])
  const [plano, setPlano] = useState(fallbackPlan)
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [staleData, setStaleData] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [fatalError, setFatalError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [proteinFilter, setProteinFilter] = useState("all")
  const [calorieFilter, setCalorieFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const recipesRenderMeasureRef = useRef(startMeasure("recipe-list-render"))

  const objetivoLabel = objetivoLabels[objetivo] ?? objetivoLabels.manter
  const selectedMealLabel = mealLabels[mealKey] ?? ""

  useEffect(() => {
    let isMounted = true

    async function loadPlan() {
      const planCacheKey = cacheKeys.mealPlan(objetivo)
      setRefreshing(true)
      setPlano(fallbackPlan)
      setFeedback("")
      setFatalError("")
      setStaleData(false)

      const cachedPlan = await readCachedResource(planCacheKey)
      if (!isMounted) return

      if (cachedPlan.exists && cachedPlan.data) {
        setPlano(cachedPlan.data)
        setLoading(false)
        setInitialLoading(false)
      } else {
        setLoading(true)
        setInitialLoading(true)
      }

      const result = await fetchCachedResource({
        cacheKey: planCacheKey,
        label: `meal-plan:${objetivo}`,
        retries: 1,
        maxAgeMs: MEAL_PLAN_MAX_AGE_MS,
        requestFn: () => getMealPlanFromSupabase(objetivo),
        getData: (response) => response.plan,
        fallbackData: fallbackPlan,
      })
      if (!isMounted) return

      if (result.data) {
        setPlano(result.data)
      }

      if (result.error && result.fromCache) {
        setFeedback("Sem conexão no momento. Exibindo cardápios salvos neste aparelho.")
        setStaleData(true)
      } else if (result.error) {
        setFeedback(`Supabase indisponivel: ${result.error.message}`)
        if (!fallbackPlan || Object.values(fallbackPlan).every((recipes) => recipes.length === 0)) {
          setFatalError("Não foi possível carregar os cardápios agora.")
        }
      } else if (!result.data) {
        setFeedback("Sem receitas cadastradas no Supabase para essa meta. Exibindo fallback local.")
      }

      setLoading(false)
      setInitialLoading(false)
      setRefreshing(false)
    }

    loadPlan()
    return () => {
      isMounted = false
    }
  }, [fallbackPlan, objetivo])

  const mealEntries = Object.entries(plano)
  const normalizedQuery = normalizeText(searchQuery)
  const hasActiveFilters =
    normalizedQuery || proteinFilter !== "all" || calorieFilter !== "all" || timeFilter !== "all" || categoryFilter !== "all"

  const filteredEntries = useMemo(() => {
    return mealEntries
      .filter(([currentMealKey]) => !mealKey || currentMealKey === mealKey)
      .map(([currentMealKey, receitas]) => {
        const filteredRecipes = receitas.filter((receita) => {
          const ingredientMatch = (receita.ingredientes ?? []).some((ingrediente) =>
            normalizeText(ingrediente).includes(normalizedQuery),
          )
          const titleMatch = normalizeText(receita.titulo).includes(normalizedQuery)
          const matchesSearch = !normalizedQuery || ingredientMatch || titleMatch

          const matchesProtein =
            proteinFilter === "all" ||
            (proteinFilter === "high" && receita.proteinaNumero >= 25) ||
            (proteinFilter === "medium" && receita.proteinaNumero >= 15 && receita.proteinaNumero < 25) ||
            (proteinFilter === "light" && receita.proteinaNumero > 0 && receita.proteinaNumero < 15)

          const matchesCalories =
            calorieFilter === "all" ||
            (calorieFilter === "low" && receita.calorias <= 300) ||
            (calorieFilter === "balanced" && receita.calorias > 300 && receita.calorias <= 500) ||
            (calorieFilter === "high" && receita.calorias > 500)

          const matchesTime =
            timeFilter === "all" ||
            (timeFilter === "fast" && receita.tempoMinutos > 0 && receita.tempoMinutos <= 10) ||
            (timeFilter === "mid" && receita.tempoMinutos > 10 && receita.tempoMinutos <= 20) ||
            (timeFilter === "long" && receita.tempoMinutos > 20)

          const matchesCategory =
            categoryFilter === "all" || (receita.categorias ?? []).includes(categoryFilter)

          return matchesSearch && matchesProtein && matchesCalories && matchesTime && matchesCategory
        })

        return [currentMealKey, filteredRecipes]
      })
      .filter(([, receitas]) => receitas.length > 0 || !hasActiveFilters)
  }, [calorieFilter, categoryFilter, hasActiveFilters, mealEntries, mealKey, normalizedQuery, proteinFilter, timeFilter])

  const totalMatches = filteredEntries.reduce((total, [, receitas]) => total + receitas.length, 0)
  const visibleRecipes = useMemo(
    () => (mealKey ? filteredEntries.flatMap(([, receitas]) => receitas) : []),
    [filteredEntries, mealKey],
  )

  useEffect(() => {
    recipesRenderMeasureRef.current = startMeasure("recipe-list-render", {
      itemCount: visibleRecipes.length,
      mealKey,
    })
  }, [mealKey, visibleRecipes.length])

  function clearFilters() {
    setSearchQuery("")
    setProteinFilter("all")
    setCalorieFilter("all")
    setTimeFilter("all")
    setCategoryFilter("all")
  }

  if (initialLoading) {
    return (
      <AppLoadingScreen
        title={mealKey ? `Carregando ${selectedMealLabel.toLowerCase()}` : "Carregando cardápios"}
        description="Buscando receitas, imagens e organizando as opções desta etapa."
      />
    )
  }

  return (
    <TabPage>
      <HeroCard>
        <Text style={styles.eyebrow}>Seu plano diário</Text>
        <Text style={styles.heroTitle}>{mealKey ? selectedMealLabel : `Cardápios para ${objetivoLabel}`}</Text>
        <Text style={styles.heroSubtitle}>
          {mealKey
            ? `Receitas recomendadas para ${selectedMealLabel.toLowerCase()} dentro do plano de ${objetivoLabel.toLowerCase()}.`
            : `Selecione uma refeição do dia para visualizar receitas alinhadas ao seu objetivo. Meta calórica: ${caloriasObjetivo ? `${caloriasObjetivo} kcal` : "a definir"}`}
        </Text>
        <View style={styles.chipRow}>
          {refreshing ? <Chip label="Atualizando..." /> : null}
          {staleData ? <Chip label="Mostrando dados salvos" tone="warning" /> : null}
          {mealKey && hasActiveFilters ? <Chip label={`${totalMatches} receitas encontradas`} /> : null}
        </View>
        {feedback ? <Text style={styles.warningText}>{feedback}</Text> : null}
      </HeroCard>

      {loading ? (
        <StatusCard
          eyebrow="Sincronizando"
          title="Carregando plano de refeições"
          description="Estamos buscando as melhores receitas para o objetivo atual."
        />
      ) : null}

      {fatalError ? (
        <StatusCard
          tone="warning"
          eyebrow="Instabilidade"
          title="Não foi possível carregar os cardápios"
          description={fatalError}
        />
      ) : null}

      {mealKey ? (
        <Card>
          <SectionHeader title="Busca inteligente" trailing={selectedMealLabel} />
          <InputField
            label="Título ou ingrediente"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Busque por ovo, frango, panqueca..."
          />
          <FilterGroup
            title="Proteina"
            value={proteinFilter}
            onChange={setProteinFilter}
            options={[
              { value: "all", label: "Todas" },
              { value: "high", label: "Alta" },
              { value: "medium", label: "Media" },
              { value: "light", label: "Leve" },
            ]}
          />
          <FilterGroup
            title="Calorias"
            value={calorieFilter}
            onChange={setCalorieFilter}
            options={[
              { value: "all", label: "Todas" },
              { value: "low", label: "Até 300" },
              { value: "balanced", label: "301 a 500" },
              { value: "high", label: "500+" },
            ]}
          />
          <FilterGroup
            title="Tempo"
            value={timeFilter}
            onChange={setTimeFilter}
            options={[
              { value: "all", label: "Todos" },
              { value: "fast", label: "Até 10 min" },
              { value: "mid", label: "11 a 20" },
              { value: "long", label: "20+" },
            ]}
          />
          <FilterGroup
            title="Categoria"
            value={categoryFilter}
            onChange={(value) => setCategoryFilter((currentValue) => (currentValue === value ? "all" : value))}
            options={[
              { value: "all", label: "Todas" },
              ...recipeCategoryOptions.map((option) => ({ value: option.key, label: option.label })),
            ]}
          />
          {hasActiveFilters ? <Button label="Limpar filtros" variant="ghost" onPress={clearFilters} /> : null}
        </Card>
      ) : null}

      {!mealKey && !fatalError ? (
        <Card>
          <SectionHeader title="Refeições disponíveis" helper="Escolha uma refeição para ver as receitas." />
          <View style={styles.mealPillGrid}>
            {mealEntries.map(([currentMealKey, receitas]) => (
              <SurfacePressable
                key={currentMealKey}
                onPress={() => navigation.navigate("MealPlans", { mealKey: currentMealKey })}
                style={getMealImageUrl(mealCardImagesByKey, currentMealKey) ? styles.mealActionImageCard : styles.mealAction}
              >
                {getMealImageUrl(mealCardImagesByKey, currentMealKey) ? (
                  <ImageBackground
                    source={{ uri: getMealImageUrl(mealCardImagesByKey, currentMealKey) }}
                    style={styles.mealPillImageShell}
                    imageStyle={styles.mealPillImage}
                  >
                    <View style={styles.mealPillOverlay}>
                      <Text style={styles.mealPillTitleOnImage}>{mealLabels[currentMealKey]}</Text>
                      <Text style={styles.mealPillCopyOnImage}>{receitas.length} receitas</Text>
                    </View>
                  </ImageBackground>
                ) : (
                  <>
                    <Text style={styles.mealPillTitle}>{mealLabels[currentMealKey]}</Text>
                    <Text style={styles.mealPillCopy}>{receitas.length} receitas</Text>
                  </>
                )}
              </SurfacePressable>
            ))}
          </View>
        </Card>
      ) : null}

      {mealKey && !fatalError ? filteredEntries.map(([currentMealKey, receitas]) => (
        <Card key={currentMealKey}>
          <SectionHeader title={mealLabels[currentMealKey]} trailing={`${receitas.length} opcoes`} />
          {receitas.length === 0 ? (
            <EmptyStateCard
              title={hasActiveFilters ? "Nenhuma receita encontrada" : "Nenhuma receita disponível"}
              description={
                hasActiveFilters
                  ? `Ajuste sua busca ou os filtros para encontrar novas opções em ${mealLabels[currentMealKey].toLowerCase()}.`
                  : `Ainda não existem receitas cadastradas para ${mealLabels[currentMealKey].toLowerCase()}.`
              }
            />
          ) : (
            <FlatList
              data={receitas}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RecipeListItem receita={item} selectedMealLabel={selectedMealLabel} navigation={navigation} />
              )}
              scrollEnabled={false}
              removeClippedSubviews
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              windowSize={6}
              updateCellsBatchingPeriod={50}
              contentContainerStyle={styles.recipeGrid}
              onContentSizeChange={() => {
                const completed = recipesRenderMeasureRef.current.end({
                  itemCount: visibleRecipes.length,
                  mealKey: currentMealKey,
                })
                trackListRenderMetric("meal-plan-recipes", {
                  durationMs: completed.durationMs,
                  itemCount: visibleRecipes.length,
                  virtualization: "flat-list",
                  context: {
                    mealKey: currentMealKey,
                  },
                })
              }}
            />
          )}
        </Card>
      )) : null}

      {hasActiveFilters && totalMatches === 0 ? (
        <EmptyStateCard
          title="Nenhum resultado para esta combinacao"
          description="Tente outro título, ingrediente ou ajuste os filtros para visualizar mais receitas desta refeição."
          actionLabel="Limpar filtros"
          onAction={clearFilters}
        />
      ) : null}

      <Button label={mealKey ? "Voltar para as refeições" : "Voltar ao painel"} variant="ghost" onPress={() => navigation.goBack()} />
    </TabPage>
  )
}

export function RecipeDetailsScreen({ navigation, route }) {
  useScreenPerformance("RecipeDetailsScreen", {
    recipeId: route.params?.recipeId ?? "",
  })
  const recipeId = route.params?.recipeId ?? ""
  const isPremium = useUserStore((state) => state.isPremium)
  const fallbackRecipe = useMemo(() => getRecipeById(recipeId), [recipeId])
  const [receita, setReceita] = useState(fallbackRecipe)
  const [source, setSource] = useState(fallbackRecipe ? "local" : "none")
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [staleData, setStaleData] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [adTimer, setAdTimer] = useState(isPremium ? 0 : 6)
  const [adLiberado, setAdLiberado] = useState(isPremium)

  useEffect(() => {
    let isMounted = true

    async function loadRecipe() {
      setReceita(fallbackRecipe)
      setSource(fallbackRecipe ? "local" : "none")
      setFeedback("")
      setRefreshing(true)
      setStaleData(false)

      const recipeCacheKey = cacheKeys.recipe(recipeId)
      const cachedRecipe = await readCachedResource(recipeCacheKey)
      if (!isMounted) return

      if (cachedRecipe.exists && cachedRecipe.data) {
        setReceita(cachedRecipe.data)
        setSource("cache")
        setLoading(false)
        setInitialLoading(false)
      } else {
        setLoading(true)
        setInitialLoading(true)
      }

      const result = await fetchCachedResource({
        cacheKey: recipeCacheKey,
        label: `recipe:${recipeId}`,
        retries: 1,
        maxAgeMs: RECIPE_MAX_AGE_MS,
        requestFn: () => getRecipeFromSupabase(recipeId),
        getData: (response) => response.recipe,
        fallbackData: fallbackRecipe,
      })
      if (!isMounted) return

      if (result.data) {
        setReceita(result.data)
        setSource(result.fromCache ? "cache" : result.data === fallbackRecipe ? "local" : "supabase")
      }

      if (result.error && result.fromCache) {
        setFeedback("Sem conexão no momento. Exibindo receita salva neste aparelho.")
        setStaleData(true)
      } else if (result.error) {
        setFeedback(`Supabase indisponivel: ${result.error.message}`)
      }

      setLoading(false)
      setInitialLoading(false)
      setRefreshing(false)
    }

    loadRecipe()
    return () => {
      isMounted = false
    }
  }, [fallbackRecipe, recipeId])

  useEffect(() => {
    if (loading || isPremium || adLiberado) return undefined

    const interval = setInterval(() => {
      setAdTimer((current) => {
        if (current <= 1) {
          clearInterval(interval)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [adLiberado, isPremium, loading])

  if (initialLoading) {
    return (
      <AppLoadingScreen
        title="Carregando receita"
        description="Preparando ingredientes, modo de preparo e detalhes desta opção."
      />
    )
  }

  if (!receita) {
    return (
      <Page>
        <EmptyStateCard
          title="Receita não encontrada"
          description="Essa receita não está mais disponível ou ainda não foi sincronizada."
          actionLabel="Voltar para cardápios"
          onAction={() => navigation.goBack()}
        />
      </Page>
    )
  }

  if (!isPremium && !adLiberado) {
    return (
      <Page>
        <Card>
          <Text style={styles.eyebrow}>Modo gratuito</Text>
          <Text style={styles.heroTitle}>Anúncio patrocinado</Text>
          <Text style={styles.heroSubtitle}>A receita será liberada em {adTimer}s.</Text>
          <Card style={styles.adBox}>
            <Text style={styles.historyTitle}>Suplemento Nutri+</Text>
            <Text style={styles.historyDescription}>Recupere melhor no pós-treino com fórmula de aminoácidos.</Text>
          </Card>
          <Button label={adTimer > 0 ? `Aguarde ${adTimer}s` : "Ver receita"} onPress={() => setAdLiberado(true)} disabled={adTimer > 0} />
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      {(refreshing || staleData || feedback) ? (
        <View style={styles.chipRow}>
          {refreshing ? <Chip label="Atualizando receita..." /> : null}
          {staleData ? <Chip label="Mostrando dados salvos" tone="warning" /> : null}
          {feedback ? <Chip label={feedback} tone="warning" /> : null}
        </View>
      ) : null}
      <Card>
        {receita.imageUrl ? (
          <ImageBackground source={{ uri: receita.imageUrl }} imageStyle={styles.recipeHeroImage} style={styles.recipeHero}>
            <View style={styles.recipeOverlay}>
              <Text style={styles.eyebrow}>Receita selecionada</Text>
              <Text style={styles.heroTitle}>{receita.titulo}</Text>
              <Text style={styles.heroSubtitle}>{receita.calorias} kcal • {receita.proteina} de proteína • {receita.tempo}</Text>
            </View>
          </ImageBackground>
        ) : (
          <>
            <Text style={styles.eyebrow}>Receita selecionada</Text>
            <Text style={styles.heroTitle}>{receita.titulo}</Text>
            <Text style={styles.heroSubtitle}>{receita.calorias} kcal • {receita.proteina} de proteína • {receita.tempo}</Text>
          </>
        )}
        <View style={styles.chipRow}>
          <Chip label={`Fonte: ${source === "supabase" ? "Supabase" : source === "cache" ? "Cache local" : "Fallback local"}`} />
        </View>
        {feedback ? <StatusCard tone="warning" title="Receita exibida com dados locais" description={feedback} /> : null}
      </Card>

      <Card>
        <SectionHeader title="Ingredientes da receita" />
        {receita.ingredientes.map((item) => (
          <Text key={item} style={styles.bulletItem}>• {item}</Text>
        ))}
      </Card>

      <Card>
        <SectionHeader title="Modo de preparo" />
        {receita.preparo.map((item, index) => (
          <Text key={item} style={styles.bulletItem}>{index + 1}. {item}</Text>
        ))}
      </Card>

      <Button
        label={route.params?.backLabel ? `Voltar para ${route.params.backLabel}` : "Voltar aos cardápios"}
        variant="ghost"
        onPress={() => navigation.goBack()}
      />
    </Page>
  )
}

export function PremiumScreen() {
  const isPremium = useUserStore((state) => state.isPremium)
  const premiumBillingCycle = useUserStore((state) => state.premiumBillingCycle)
  const setPremiumSubscription = useUserStore((state) => state.setPremiumSubscription)
  const setPremium = useUserStore((state) => state.setPremium)
  const [selectedPlan, setSelectedPlan] = useState(premiumBillingCycle || "monthly")

  useScreenPerformance("PremiumScreen", {
    premiumStatus: isPremium ? "active" : "inactive",
    selectedPlan,
  })

  const activePlan = premiumPlans.find((plan) => plan.key === premiumBillingCycle) ?? premiumPlans[0]
  const selectedPlanData = premiumPlans.find((plan) => plan.key === selectedPlan) ?? premiumPlans[0]

  function handleSubscribe(planKey) {
    setSelectedPlan(planKey)
    setPremiumSubscription({
      isPremium: true,
      premiumBillingCycle: planKey,
    })
  }

  function handleManageAccess() {
    if (isPremium) {
      setPremium(false)
      return
    }

    handleSubscribe(selectedPlan)
  }

  return (
    <Page>
      <HeroCard style={styles.premiumHeroCard}>
        <LinearGradient colors={["#17392c", "#285843", "#3f7e5f"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premiumHeroGradient}>
          <Text style={styles.premiumHeroEyebrow}>Assinatura premium</Text>
          <Text style={styles.premiumHeroTitle}>Escolha entre mensal ou anual</Text>
          <Text style={styles.premiumHeroSubtitle}>
            Destrave a experiência completa com receitas liberadas, acesso sem espera e uma proposta mais robusta para continuidade.
          </Text>
          <View style={styles.chipRow}>
            <Chip label={isPremium ? `Plano ativo: ${activePlan.title}` : "Nenhum plano ativo"} active={isPremium} />
            {!isPremium ? <Chip label="Cancele quando quiser" /> : null}
          </View>
        </LinearGradient>
      </HeroCard>

      <Card>
        <SectionHeader title="Comparativo de planos" helper="Selecione a modalidade que faz mais sentido para sua rotina." />
        <View style={styles.premiumPlansStack}>
          {premiumPlans.map((plan) => {
            const isSelected = selectedPlan === plan.key
            const isActivePlan = isPremium && premiumBillingCycle === plan.key
            const isDarkCard = plan.key === "yearly"

            return (
              <Pressable
                key={plan.key}
                onPress={() => setSelectedPlan(plan.key)}
                style={[
                  styles.premiumPlanCard,
                  isDarkCard && styles.premiumPlanCardDark,
                  isSelected && styles.premiumPlanCardSelected,
                ]}
              >
                <LinearGradient
                  colors={plan.accent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumPlanGradient}
                >
                  <View style={styles.premiumPlanHeader}>
                    <View style={styles.premiumPlanTitleWrap}>
                      <Text style={[styles.premiumPlanTitle, isDarkCard && styles.premiumPlanTitleDark]}>{plan.title}</Text>
                      <Text style={[styles.premiumPlanHeadline, isDarkCard && styles.premiumPlanHeadlineDark]}>{plan.headline}</Text>
                    </View>
                    {plan.savings ? <Chip label={plan.savings} active={!isDarkCard} /> : null}
                  </View>

                  <View style={styles.premiumPlanPriceRow}>
                    <Text style={[styles.premiumPlanPrice, isDarkCard && styles.premiumPlanPriceDark]}>{plan.price}</Text>
                    <Text style={[styles.premiumPlanPeriod, isDarkCard && styles.premiumPlanPeriodDark]}>{plan.period}</Text>
                  </View>

                  {plan.originalPrice ? (
                    <View style={styles.premiumSavingsRow}>
                      <Text style={[styles.premiumOriginalPrice, isDarkCard && styles.premiumOriginalPriceDark]}>
                        De {plan.originalPrice}
                      </Text>
                      <Text style={[styles.premiumSavingsText, isDarkCard && styles.premiumSavingsTextDark]}>
                        Economize {plan.savingsPercent}
                      </Text>
                    </View>
                  ) : null}

                  <Text style={[styles.premiumPlanHighlight, isDarkCard && styles.premiumPlanHighlightDark]}>{plan.highlight}</Text>

                  <View style={styles.premiumFeatureList}>
                    {plan.features.map((feature) => (
                      <Text
                        key={`${plan.key}-${feature}`}
                        style={[styles.premiumFeatureItem, isDarkCard && styles.premiumFeatureItemDark]}
                      >
                        • {feature}
                      </Text>
                    ))}
                  </View>

                  <Button
                    label={isActivePlan ? plan.ctaActive : plan.ctaIdle}
                    variant={isDarkCard ? "secondary" : "primary"}
                    onPress={() => handleSubscribe(plan.key)}
                    style={styles.premiumPlanButton}
                  />
                </LinearGradient>
              </Pressable>
            )
          })}
        </View>
      </Card>

      <Card>
        <SectionHeader title="O que você libera" helper="Benefícios desenhados para dar mais ritmo e menos fricção no uso diário." />
        <View style={styles.premiumBenefitsGrid}>
          <SurfaceBox style={styles.premiumBenefitCard}>
            <Text style={styles.premiumBenefitTitle}>Receitas sem bloqueio</Text>
            <Text style={styles.premiumBenefitCopy}>Acesso direto aos detalhes premium, sem contagem regressiva para destravar o conteúdo.</Text>
          </SurfaceBox>
          <SurfaceBox style={styles.premiumBenefitCard}>
            <Text style={styles.premiumBenefitTitle}>Jornada mais contínua</Text>
            <Text style={styles.premiumBenefitCopy}>Melhor experiência para manter foco nas metas, refeições e progresso ao longo das semanas.</Text>
          </SurfaceBox>
          <SurfaceBox style={styles.premiumBenefitCard}>
            <Text style={styles.premiumBenefitTitle}>Base para novos extras</Text>
            <Text style={styles.premiumBenefitCopy}>Área pronta para receber recursos exclusivos, comparativos de planos e upgrades futuros.</Text>
          </SurfaceBox>
        </View>
      </Card>

      <Card>
        <SectionHeader title="Resumo da assinatura" trailing={selectedPlanData.title} />
        <Text style={styles.premiumSummaryText}>
          {isPremium
            ? `Seu acesso premium está ativo no ${activePlan.title.toLowerCase()}.`
            : `Você selecionou o ${selectedPlanData.title.toLowerCase()} para ativação.`}
        </Text>
        <Text style={styles.premiumSummaryCaption}>
          Esta etapa está pronta para depois integrar checkout real, restauração de compra e gestão de renovação.
        </Text>
        <View style={styles.premiumCheckoutStack}>
          <Button
            label={`Checkout App Store • ${selectedPlanData.title}`}
            onPress={() => handleSubscribe(selectedPlan)}
          />
          <Button
            label={`Checkout Google Play • ${selectedPlanData.title}`}
            variant="secondary"
            onPress={() => handleSubscribe(selectedPlan)}
          />
        </View>
        <Button
          label={
            isPremium
              ? `Desativar simulacao do ${activePlan.title.toLowerCase()}`
              : `Ativar ${selectedPlanData.title.toLowerCase()}`
          }
          onPress={handleManageAccess}
        />
      </Card>

      <Card>
        <SectionHeader title="FAQ de cobrança" helper="Perguntas principais para reduzir dúvidas antes da assinatura." />
        <View style={styles.premiumFaqList}>
          {premiumFaqItems.map((item) => (
            <SurfaceBox key={item.question} style={styles.premiumFaqCard} tone="default">
              <Text style={styles.premiumFaqQuestion}>{item.question}</Text>
              <Text style={styles.premiumFaqAnswer}>{item.answer}</Text>
            </SurfaceBox>
          ))}
        </View>
      </Card>
    </Page>
  )
}

export function PlaceholderScreen({ title, description, bullets }) {
  useScreenPerformance("PlaceholderScreen", { title })
  const { objetivoLabel } = useAppDataContext()

  return (
    <Page>
      <Card>
        <SectionHeader title={title} helper={description} trailing={objetivoLabel} />
        <SurfaceBox style={styles.placeholderHighlight} tone="soft">
          <Text style={styles.historyTitle}>Espaco reservado no menu</Text>
          <Text style={styles.historyDescription}>Essa area ja esta pronta na navegacao mobile para evoluir sem refazer a estrutura principal.</Text>
        </SurfaceBox>
        {bullets.map((bullet) => (
          <SurfaceBox key={bullet} style={styles.placeholderItem} tone="muted">
            <Text style={styles.historyTitle}>{bullet}</Text>
            <Text style={styles.historyDescription}>Quando você quiser, a gente pode transformar este bloco em uma tela funcional mantendo a mesma linguagem visual.</Text>
          </SurfaceBox>
        ))}
      </Card>
    </Page>
  )
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.caption,
    color: colors.brand,
    textTransform: "uppercase",
  },
  heroCard: {
    gap: spacing.md,
    overflow: "hidden",
  },
  dashboardHero: {
    padding: 0,
  },
  dashboardHeroGradient: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  dashboardHeroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  dashboardHeroLabel: {
    ...typography.caption,
    color: "rgba(255,253,250,0.7)",
    textTransform: "uppercase",
  },
  dashboardHeroDate: {
    ...typography.bodySmall,
    color: "rgba(255,253,250,0.92)",
  },
  dashboardHeroMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: spacing.md,
  },
  dashboardHeroMainCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  dashboardHeroKicker: {
    ...typography.caption,
    color: "rgba(255,253,250,0.68)",
    textTransform: "uppercase",
  },
  dashboardHeroName: {
    ...typography.h1,
    color: colors.surface,
  },
  dashboardHeroSubcopy: {
    ...typography.bodyStrong,
    color: "#f6f1b4",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  dashboardScoreCard: {
    minWidth: 92,
    borderRadius: radius.lg,
    padding: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dashboardScoreLabel: {
    ...typography.caption,
    color: "rgba(255,253,250,0.74)",
    textTransform: "uppercase",
  },
  dashboardScoreValue: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    color: colors.surface,
  },
  dashboardScoreHint: {
    ...typography.bodySmall,
    color: "rgba(255,253,250,0.7)",
  },
  dashboardHeroSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dashboardSummaryCard: {
    flexGrow: 1,
    minWidth: "30%",
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    gap: 2,
  },
  dashboardSummaryValue: {
    ...typography.h2,
    color: colors.surface,
  },
  dashboardSummaryLabel: {
    ...typography.caption,
    color: "rgba(255,253,250,0.72)",
    textTransform: "uppercase",
  },
  dashboardInlineNutrition: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  dashboardSectionCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  dashboardInlineNutritionTitle: {
    ...typography.bodyStrong,
    color: colors.surface,
  },
  dashboardInlineNutritionLabel: {
    ...typography.bodySmall,
    color: "rgba(255,253,250,0.86)",
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  heroFooterTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  heroFooterCopy: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dashboardActionGrid: {
    gap: spacing.xs,
  },
  dashboardActionCard: {
    width: "100%",
    gap: 4,
  },
  dashboardActionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  dashboardActionCopy: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  dashboardControlStack: {
    gap: spacing.xs,
  },
  mealPillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  mealProgressCard: {
    width: "48%",
    borderRadius: radius.lg,
    height: 176,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealProgressCardFallback: {
    backgroundColor: "#f9f6ef",
  },
  mealProgressImage: {
    borderRadius: radius.lg,
    width: "100%",
    height: "100%",
  },
  mealProgressOverlay: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(20, 28, 23, 0.70)",
  },
  mealProgressOverlayFallback: {
    flex: 1,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "space-between",
  },
  mealProgressCardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  mealProgressRingWrap: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mealProgressCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  mealProgressPercent: {
    ...typography.caption,
    color: colors.surface,
  },
  mealProgressCopy: {
    alignItems: "center",
    gap: 2,
  },
  mealProgressTitle: {
    ...typography.bodyStrong,
    color: colors.surface,
    textAlign: "center",
  },
  mealProgressValue: {
    ...typography.bodySmall,
    color: "rgba(255,253,250,0.88)",
    textAlign: "center",
  },
  mealPill: {
    width: "48%",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 2,
  },
  mealAction: {
    minWidth: "48%",
    flexGrow: 1,
    gap: spacing.xs,
  },
  mealActionImageCard: {
    minWidth: "48%",
    flexGrow: 1,
    padding: 0,
    overflow: "hidden",
  },
  mealPillTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  mealPillCopy: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  mealPillImageShell: {
    minHeight: 108,
    borderRadius: radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  mealPillImage: {
    borderRadius: radius.lg,
  },
  mealPillOverlay: {
    padding: spacing.md,
    gap: 2,
    backgroundColor: "rgba(18, 27, 22, 0.34)",
  },
  mealPillTitleOnImage: {
    ...typography.bodyStrong,
    color: colors.surface,
  },
  mealPillCopyOnImage: {
    ...typography.bodySmall,
    color: "rgba(255,253,250,0.88)",
  },
  progressGroup: {
    gap: spacing.xs,
  },
  progressLabel: {
    ...typography.bodySmall,
    color: colors.text,
  },
  chartLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  chartLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    alignItems: "center",
  },
  historyCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  historyTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  historyDescription: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  historyValue: {
    ...typography.bodyStrong,
    color: colors.text,
    textAlign: "right",
  },
  historyDate: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: "right",
  },
  filterGroup: {
    gap: spacing.sm,
  },
  filterTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  communityShell: {
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  communityTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  communityTitleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  communitySectionLabel: {
    ...typography.caption,
    color: colors.brand,
    textTransform: "uppercase",
  },
  communitySectionTitle: {
    ...typography.h2,
    color: colors.text,
  },
  communitySectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  communityComposerEntry: {
    gap: spacing.sm,
  },
  communityComposerPromptButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  communityComposerInlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  communityComposerAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSoft,
  },
  communityComposerAvatarText: {
    ...typography.bodyStrong,
    color: colors.brandDark,
  },
  communityComposerPrompt: {
    flex: 1,
    gap: 2,
  },
  communityComposerPromptTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  communityComposerPromptHint: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  communityComposerEntryAction: {
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  communityComposerEntryActionText: {
    ...typography.caption,
    color: colors.brand,
    textTransform: "uppercase",
  },
  communityComposerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  communityComposerCompactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  communityComposerHeader: {
    gap: 2,
    flex: 1,
  },
  communityComposerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  communityComposerHint: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  communityComposerToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  communityToolbarButton: {
    flexGrow: 1,
  },
  communityFeedCard: {
    paddingHorizontal: 0,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  communityFeedHeader: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  communityFeedList: {
    gap: spacing.md,
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.warning,
  },
  communityPreviewRail: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  communityPreviewLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  communityPreviewThumb: {
    width: 82,
    height: 82,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  communityPreviewCopy: {
    flex: 1,
    gap: 4,
  },
  communityPreviewHint: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  communityPreviewActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  communityPost: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  communityPostHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  communityAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSoft,
  },
  communityAvatarText: {
    ...typography.bodyStrong,
    color: colors.brandDark,
  },
  communityMeta: {
    flex: 1,
    gap: 2,
  },
  communityAuthor: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  communityPostInfo: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  communityPostMenu: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  communityPostMenuText: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  communityCaption: {
    ...typography.h3,
    color: colors.text,
  },
  communityBody: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  communityPostImage: {
    width: "100%",
    height: 300,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  communityEditBox: {
    gap: spacing.sm,
  },
  communityActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  communityCommentSection: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  communityCommentTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  communityCommentCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#fbf8f2",
    borderWidth: 1,
    borderColor: colors.border,
  },
  communityCommentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  communityCommentAuthor: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  communityCommentDate: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  communityCommentBody: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  communityCommentActions: {
    paddingTop: spacing.xs,
  },
  communityCommentEmpty: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  commentsModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(12, 20, 15, 0.2)",
  },
  commentsModalBackdrop: {
    flex: 1,
  },
  commentsSheet: {
    maxHeight: "82%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  commentsSheetHandle: {
    alignSelf: "center",
    width: 54,
    height: 5,
    borderRadius: radius.round,
    backgroundColor: colors.border,
  },
  commentsSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  commentsSheetHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  commentsSheetTitle: {
    ...typography.h3,
    color: colors.text,
  },
  commentsSheetSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  commentsList: {
    flexGrow: 0,
  },
  commentsListContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  commentsComposer: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  communityLoadMoreButton: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  communityFeedEnd: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: "center",
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  communitySuccessText: {
    ...typography.bodySmall,
    color: colors.success,
  },
  premiumHeroCard: {
    padding: 0,
    overflow: "hidden",
  },
  premiumHeroGradient: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  premiumHeroEyebrow: {
    ...typography.caption,
    color: "rgba(255,253,250,0.74)",
    textTransform: "uppercase",
  },
  premiumHeroTitle: {
    ...typography.h1,
    color: colors.surface,
  },
  premiumHeroSubtitle: {
    ...typography.body,
    color: "rgba(255,253,250,0.84)",
  },
  premiumPlansStack: {
    gap: spacing.md,
  },
  premiumPlanCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  premiumPlanCardSelected: {
    borderColor: colors.brand,
    borderWidth: 2,
  },
  premiumPlanCardDark: {
    borderColor: "#285843",
  },
  premiumPlanGradient: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  premiumPlanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  premiumPlanTitleWrap: {
    flex: 1,
    gap: 2,
  },
  premiumPlanTitle: {
    ...typography.h3,
    color: colors.text,
  },
  premiumPlanTitleDark: {
    color: colors.surface,
  },
  premiumPlanHeadline: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  premiumPlanHeadlineDark: {
    color: "rgba(255,253,250,0.8)",
  },
  premiumPlanPriceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  premiumPlanPrice: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.brandDark,
  },
  premiumPlanPriceDark: {
    color: colors.surface,
  },
  premiumPlanPeriod: {
    ...typography.bodyStrong,
    color: colors.textMuted,
  },
  premiumPlanPeriodDark: {
    color: "rgba(255,253,250,0.82)",
  },
  premiumSavingsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  premiumOriginalPrice: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  premiumOriginalPriceDark: {
    color: "rgba(255,253,250,0.68)",
  },
  premiumSavingsText: {
    ...typography.caption,
    color: colors.success,
    textTransform: "uppercase",
  },
  premiumSavingsTextDark: {
    color: "#c8f0d7",
  },
  premiumPlanHighlight: {
    ...typography.bodySmall,
    color: colors.text,
  },
  premiumPlanHighlightDark: {
    color: "rgba(255,253,250,0.9)",
  },
  premiumFeatureList: {
    gap: spacing.xs,
  },
  premiumFeatureItem: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  premiumFeatureItemDark: {
    color: "rgba(255,253,250,0.82)",
  },
  premiumPlanButton: {
    marginTop: spacing.xs,
  },
  premiumBenefitsGrid: {
    gap: spacing.sm,
  },
  premiumBenefitCard: {
    gap: spacing.xs,
  },
  premiumBenefitTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  premiumBenefitCopy: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  premiumSummaryText: {
    ...typography.body,
    color: colors.text,
  },
  premiumSummaryCaption: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  premiumCheckoutStack: {
    gap: spacing.sm,
  },
  premiumFaqList: {
    gap: spacing.sm,
  },
  premiumFaqCard: {
    gap: spacing.xs,
  },
  premiumFaqQuestion: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  premiumFaqAnswer: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  recipeGrid: {
    gap: spacing.md,
  },
  recipeCard: {
    gap: spacing.sm,
  },
  recipeFallback: {
    minHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    justifyContent: "flex-end",
  },
  recipeImageShell: {
    minHeight: 140,
    borderRadius: radius.lg,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  recipeImage: {
    borderRadius: radius.lg,
  },
  recipeOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.md,
    backgroundColor: "rgba(12, 20, 15, 0.32)",
    gap: spacing.xs,
  },
  recipeTitle: {
    ...typography.h3,
    color: colors.surface,
  },
  recipeMeta: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  recipeSmall: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  recipeIngredients: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  adBox: {
    backgroundColor: colors.surfaceMuted,
  },
  recipeHero: {
    minHeight: 240,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: radius.lg,
  },
  recipeHeroImage: {
    borderRadius: radius.lg,
  },
  bulletItem: {
    ...typography.body,
    color: colors.text,
  },
  placeholderHighlight: {
    gap: spacing.xs,
  },
  placeholderItem: {
    gap: spacing.xs,
  },
})
