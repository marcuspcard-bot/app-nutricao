import { useEffect, useMemo, useState } from "react"
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import Svg, { Circle, Line, Polyline } from "react-native-svg"
import { Page, Button, Card, Chip, EmptyStateCard, InputField, MetricTile, ProgressBar, SectionHeader, StatusCard } from "../ui"
import { colors, radius, spacing, typography } from "../theme"
import { useAppDataContext } from "../AppDataContext"
import { formatShortDate, getChartPointPosition } from "../appDataUtils"
import { useCommunity } from "../useCommunity"
import { useUserStore } from "../../store/userStore"
import { getPlanByObjective, getRecipeById, mealLabels, objetivoLabels, recipeCategoryOptions } from "../../data/mealPlans"
import { getMealImageUrl } from "../../lib/mealCardImagesService"
import { getMealPlanFromSupabase, getRecipeFromSupabase } from "../../lib/mealPlansService"
import { hasSupabaseConfig, supabase } from "../../lib/supabaseClient"

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

export function DashboardScreen({ navigation }) {
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
    <Page>
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
              <Text style={styles.dashboardHeroKicker}>Resumo diario</Text>
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
              <Text style={styles.dashboardSummaryLabel}>gasto diario</Text>
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

          {(appData.dataLoading || appData.dataError || appData.profileSyncing) ? (
            <View style={styles.chipRow}>
              {appData.dataLoading ? <Chip label="Sincronizando dados..." /> : null}
              {appData.profileSyncing ? <Chip label="Salvando perfil..." /> : null}
              {appData.dataError ? <Chip label={appData.dataError} tone="warning" /> : null}
            </View>
          ) : null}
        </LinearGradient>
      </HeroCard>

      <Card>
        <SectionHeader title="Acoes rapidas" helper="Atalhos principais para manter sua rotina em movimento." />
        <View style={styles.dashboardActionGrid}>
          <Pressable onPress={() => navigation.navigate("Checkin")} style={styles.dashboardActionCard}>
            <Text style={styles.dashboardActionTitle}>Registrar check-in</Text>
            <Text style={styles.dashboardActionCopy}>Atualize peso e progresso semanal.</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("MealPlans")} style={styles.dashboardActionCard}>
            <Text style={styles.dashboardActionTitle}>Abrir cardapios</Text>
            <Text style={styles.dashboardActionCopy}>Veja refeicoes e receitas do seu plano.</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Metas")} style={styles.dashboardActionCard}>
            <Text style={styles.dashboardActionTitle}>Metas</Text>
            <Text style={styles.dashboardActionCopy}>Acompanhe marcos e proximos passos.</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Agenda")} style={styles.dashboardActionCard}>
            <Text style={styles.dashboardActionTitle}>Rotina</Text>
            <Text style={styles.dashboardActionCopy}>Organize lembretes e compromissos.</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <SectionHeader title="Conta e plano" helper="Configuracoes administrativas e simulacao de acesso." />
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
            label="Configuracoes"
            variant="ghost"
            onPress={() => navigation.navigate("Configuracoes")}
          />
          <Button
            label="Refazer onboarding"
            variant="ghost"
            onPress={recomecarOnboarding}
          />
          <Button label="Sair" variant="ghost" onPress={sair} />
        </View>
      </Card>
    </Page>
  )
}

export function MealsOverviewScreen({ navigation }) {
  const { meals, caloriasObjetivo } = useAppDataContext()

  return (
    <Page>
      <Card>
        <SectionHeader title="Abrir cardapios" helper="Entre nos planos completos organizados por refeicao." />
        <Button label="Ver todos os cardapios" onPress={() => navigation.navigate("MealPlans")} />
      </Card>

      <Card>
        <SectionHeader title="Plano do dia" helper="Distribuicao estimada por refeicao." />
        <View style={styles.mealPillGrid}>
          {meals.map((meal) => <MealProgressCard key={meal.key} meal={meal} totalCalories={caloriasObjetivo} />)}
        </View>
      </Card>
    </Page>
  )
}

export function CommunityScreen() {
  const nome = useUserStore((state) => state.nome)
  const {
    posts,
    loading,
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
    reloadPosts,
    loadMorePosts,
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
  const [expandedComments, setExpandedComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [editingPostDrafts, setEditingPostDrafts] = useState({})
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  const selectedMealLabel = communityMealOptions.find((option) => option.key === mealType)?.label ?? "Refeicao"
  const previewUrl = imageAsset?.uri || String(imageUrl).trim()

  async function pickFromLibrary() {
    setFeedback("")
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      setFeedback("Precisamos de permissao para acessar a galeria e anexar a foto da refeicao.")
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
      setFeedback("Precisamos de permissao para usar a camera e fotografar a refeicao.")
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
      setFeedback("Nao foi possivel atualizar a curtida agora. Tente novamente em instantes.")
    }
  }

  function toggleComments(postId) {
    setExpandedComments((current) => ({
      ...current,
      [postId]: !current[postId],
    }))
  }

  async function handleAddComment(postId) {
    setFeedback("")
    const { error } = await addComment(postId, commentDrafts[postId] ?? "")

    if (error) {
      setFeedback(error.message || "Nao foi possivel enviar o comentario agora.")
      return
    }

    setCommentDrafts((current) => ({
      ...current,
      [postId]: "",
    }))
    setExpandedComments((current) => ({
      ...current,
      [postId]: true,
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
    if (error) setFeedback("Nao foi possivel atualizar os posts salvos agora.")
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
      mealLabel: draft.mealLabel ?? "Refeicao",
    })

    if (error) {
      setFeedback(error.message || "Nao foi possivel salvar as edicoes do post.")
      return
    }

    cancelEditingPost(postId)
  }

  async function handleRemovePost(postId) {
    setFeedback("")
    const { error } = await removePost(postId)
    if (error) setFeedback("Nao foi possivel excluir o post agora.")
  }

  async function handleRemoveComment(postId, commentId) {
    setFeedback("")
    const { error } = await removeComment(postId, commentId)
    if (error) setFeedback("Nao foi possivel excluir o comentario agora.")
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
      setFeedback("Adicione uma legenda curta para apresentar a sua refeicao.")
      return
    }

    if (!body.trim()) {
      setFeedback("Escreva um texto contando como foi a refeicao, a preparacao ou o contexto do post.")
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
      setFeedback(`Nao foi possivel publicar agora. ${error.message || "Tente novamente em instantes."}`)
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
        ? "Publicacao criada e salva no Supabase."
        : "Publicacao criada localmente. Quando a persistencia online estiver disponivel, ela podera ser sincronizada.",
    )
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
            <Text style={styles.communitySectionTitle}>Feed de refeicoes e rotina</Text>
            <Text style={styles.communitySectionSubtitle}>Atualizacoes da comunidade, posts salvos e interacoes em um so lugar.</Text>
          </View>
        </View>

        <View style={styles.communityPrimaryActionRow}>
          <Button
            label={isComposerOpen ? "Fechar criacao" : "Criar post"}
            onPress={() => setIsComposerOpen((current) => !current)}
            style={styles.communityComposerToggle}
          />
        </View>

      </Card>

      {loading ? (
        <StatusCard
          eyebrow="Sincronizando"
          title="Carregando comunidade"
          description="Estamos buscando as publicacoes mais recentes no feed."
        />
      ) : null}

      {isComposerOpen ? (
        <Card style={styles.communityComposerCard}>
          <SectionHeader title="Criar publicacao" helper="Monte um post com legenda, texto e a imagem da sua refeicao." />
          <InputField
            label="Legenda"
            value={caption}
            onChangeText={setCaption}
            placeholder="Ex: Meu almoco proteico de hoje"
          />
          <InputField
            label="Texto do post"
            value={body}
            onChangeText={setBody}
            placeholder="Conte como preparou, como encaixou na dieta e qualquer dica util."
            multiline
            numberOfLines={5}
          />
          <InputField
            label="Link da imagem"
            value={imageUrl}
            onChangeText={(value) => {
              setImageAsset(null)
              setImageUrl(value)
            }}
            placeholder="Cole a URL da foto da refeicao"
            autoCapitalize="none"
          />
          <View style={styles.communityActionRow}>
            <Button label="Escolher da galeria" variant="secondary" onPress={pickFromLibrary} style={styles.communityActionButton} />
            <Button label="Usar camera" variant="secondary" onPress={takePhoto} style={styles.communityActionButton} />
          </View>
          {imageAsset ? (
            <View style={styles.chipRow}>
              <Chip label="Imagem selecionada do aparelho" active />
              <Chip label="Remover imagem" onPress={clearSelectedImage} />
            </View>
          ) : null}
          <View style={styles.filterGroup}>
            <Text style={styles.filterTitle}>Tipo de refeicao</Text>
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
            <View style={styles.communityPreviewBox}>
              <Text style={styles.communityPreviewLabel}>Preview da imagem</Text>
              <Image source={{ uri: previewUrl }} style={styles.communityPreviewImage} />
            </View>
          ) : null}
          {feedback ? <StatusCard tone="warning" title="Post incompleto" description={feedback} /> : null}
          {successMessage ? <StatusCard tone="success" title="Publicacao enviada" description={successMessage} /> : null}
          <Button label={submitting ? "Publicando..." : "Publicar refeicao"} onPress={handlePublishPost} disabled={submitting} />
        </Card>
      ) : null}

      <Card style={styles.communityFeedCard}>
        <View style={styles.communityFeedHeader}>
          <SectionHeader title="Feed da comunidade" helper="Veja o que outras pessoas estao compartilhando hoje." trailing={`${posts.length} posts`} />
          <Button label="Atualizar" variant="ghost" onPress={reloadPosts} style={styles.communityReloadButton} />
        </View>
        {posts.map((post) => (
          <View key={post.id} style={styles.communityPost}>
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
            {editingPostDrafts[post.id]?.active ? (
              <View style={styles.communityEditBox}>
                <InputField
                  label="Legenda"
                  value={editingPostDrafts[post.id]?.caption ?? ""}
                  onChangeText={(value) =>
                    setEditingPostDrafts((current) => ({
                      ...current,
                      [post.id]: { ...current[post.id], caption: value, active: true },
                    }))
                  }
                  placeholder="Legenda do post"
                />
                <InputField
                  label="Texto"
                  value={editingPostDrafts[post.id]?.body ?? ""}
                  onChangeText={(value) =>
                    setEditingPostDrafts((current) => ({
                      ...current,
                      [post.id]: { ...current[post.id], body: value, active: true },
                    }))
                  }
                  placeholder="Texto do post"
                  multiline
                  numberOfLines={4}
                />
                <InputField
                  label="Link da imagem"
                  value={editingPostDrafts[post.id]?.imageUrl ?? ""}
                  onChangeText={(value) =>
                    setEditingPostDrafts((current) => ({
                      ...current,
                      [post.id]: { ...current[post.id], imageUrl: value, active: true },
                    }))
                  }
                  placeholder="URL da imagem"
                  autoCapitalize="none"
                />
                <View style={styles.communityActions}>
                  <Button
                    label={editingPostId === post.id ? "Salvando..." : "Salvar alteracoes"}
                    variant="secondary"
                    onPress={() => handleEditPost(post.id)}
                    disabled={editingPostId === post.id}
                    style={styles.communityActionButton}
                  />
                  <Button
                    label="Cancelar"
                    variant="ghost"
                    onPress={() => cancelEditingPost(post.id)}
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
                onPress={() => handleToggleLike(post)}
              />
              <Chip
                label={`${expandedComments[post.id] ? "Ocultar" : "Comentar"} • ${post.commentsCount ?? 0}`}
                active={Boolean(expandedComments[post.id])}
                onPress={() => toggleComments(post.id)}
              />
              <Chip
                label={savingPostId === post.id ? "Salvando..." : post.savedByMe ? "Salvo" : "Salvar"}
                active={post.savedByMe}
                onPress={() => handleSavePost(post)}
              />
              {post.userId && post.userId === currentUserId ? (
                <>
                  <Chip label="Editar" onPress={() => startEditingPost(post)} />
                  <Chip
                    label={deletingPostId === post.id ? "Excluindo..." : "Excluir"}
                    tone="warning"
                    onPress={() => handleRemovePost(post.id)}
                  />
                </>
              ) : null}
            </View>
            {expandedComments[post.id] ? (
              <View style={styles.communityCommentSection}>
                <Text style={styles.communityCommentTitle}>Comentarios</Text>
                {(post.comments ?? []).length ? (
                  post.comments.map((comment) => (
                    <View key={comment.id} style={styles.communityCommentCard}>
                      <View style={styles.communityCommentHeader}>
                        <Text style={styles.communityCommentAuthor}>{comment.author}</Text>
                        <Text style={styles.communityCommentDate}>{comment.postedAt}</Text>
                      </View>
                      <Text style={styles.communityCommentBody}>{comment.body}</Text>
                  {comment.userId && comment.userId === currentUserId ? (
                    <View style={styles.communityCommentActions}>
                          <Chip
                            label={deletingCommentId === comment.id ? "Excluindo..." : "Excluir comentario"}
                            tone="warning"
                            onPress={() => handleRemoveComment(post.id, comment.id)}
                          />
                        </View>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <Text style={styles.communityCommentEmpty}>Seja a primeira pessoa a comentar essa refeicao.</Text>
                )}
                <InputField
                  label="Novo comentario"
                  value={commentDrafts[post.id] ?? ""}
                  onChangeText={(value) =>
                    setCommentDrafts((current) => ({
                      ...current,
                      [post.id]: value,
                    }))
                  }
                  placeholder="Escreva um comentario util ou motivador..."
                  multiline
                  numberOfLines={3}
                />
                <Button
                  label={commentingPostId === post.id ? "Enviando comentario..." : "Enviar comentario"}
                  variant="secondary"
                  onPress={() => handleAddComment(post.id)}
                  disabled={commentingPostId === post.id}
                />
              </View>
            ) : null}
          </View>
        ))}
        {source === "supabase" && loadingMore ? (
          <Button
            label="Carregando mais posts..."
            variant="secondary"
            disabled
            style={styles.communityLoadMoreButton}
          />
        ) : null}
        {source === "supabase" && !hasMorePosts && posts.length > 0 ? (
          <Text style={styles.communityFeedEnd}>Voce chegou ao fim do feed por enquanto.</Text>
        ) : null}
      </Card>
    </Page>
  )
}

export function CheckinScreen({ navigation }) {
  const { addWeeklyCheckin, history, peso, savingCheckin } = useAppDataContext()
  const [pesoCheckin, setPesoCheckin] = useState(peso || "")
  const [feedback, setFeedback] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function salvar() {
    setFeedback("")
    setSuccessMessage("")

    const parsedWeight = Number(String(pesoCheckin).replace(",", "."))
    if (Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      setFeedback("Informe um peso valido para registrar o check-in.")
      return
    }

    const { error } = await addWeeklyCheckin({
      date: new Date().toISOString(),
      peso: Number(parsedWeight.toFixed(1)),
    })

    if (error) {
      setFeedback("Nao foi possivel salvar seu check-in agora. Tente novamente em instantes.")
      return
    }

    setSuccessMessage("Check-in salvo com sucesso. Sua evolucao ja foi atualizada.")
    setTimeout(() => {
      navigation.navigate("AppTabs", {
        screen: "Evolucao",
        params: { checkinSaved: Date.now() },
      })
    }, 500)
  }

  return (
    <Page>
      <Card>
        <SectionHeader title="Check-in semanal" helper="Acompanhamento rapido para manter a constancia." trailing={history.length ? `${history.length} semanas` : "Novo"} />
        <InputField
          label="Seu peso atual"
          value={String(pesoCheckin)}
          onChangeText={setPesoCheckin}
          placeholder="Ex: 72.4"
          keyboardType="decimal-pad"
        />
        {feedback ? <StatusCard tone="warning" title="Nao foi possivel concluir o check-in" description={feedback} /> : null}
        {successMessage ? <StatusCard tone="success" title="Check-in registrado" description={successMessage} /> : null}
        <Button label={savingCheckin ? "Salvando check-in..." : "Salvar check-in"} onPress={salvar} disabled={savingCheckin} />
      </Card>
    </Page>
  )
}

function EvolutionChart({ chartPoints, history, checkinsLoading }) {
  if (!history.length) {
    return checkinsLoading ? (
      <StatusCard
        eyebrow="Sincronizando"
        title="Carregando historico de evolucao"
        description="Estamos buscando os registros mais recentes no Supabase."
      />
    ) : (
      <EmptyStateCard
        title="Seu grafico ainda nao tem registros"
        description="Assim que o primeiro check-in for salvo, a evolucao do peso aparecera aqui automaticamente."
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
      <SectionHeader title="Grafico de evolucao" trailing="Peso semanal" />
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
    <Page>
      {route.params?.checkinSaved ? (
        <StatusCard
          tone="success"
          eyebrow="Check-in atualizado"
          title="Evolucao sincronizada com sucesso"
          description="O peso salvo ja faz parte do seu historico e do grafico de evolucao."
        />
      ) : null}

      <Card>
        <SectionHeader title="Evolucao recente" helper="Visualize seu progresso com mais clareza e contexto." trailing={history.length ? `${history.length} registros` : "Sem registros"} />
        <MetricGrid
          items={[
            { label: "Peso atual", value: latestCheckin ? `${latestCheckin.peso} kg` : peso ? `${peso} kg` : "-" },
            { label: "Variacao", value: previousCheckin ? `${weightDelta > 0 ? "+" : ""}${weightDelta} kg` : "-" },
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
            { label: "Gasto diario", value: tdee || "-" },
            { label: "Meta calorica", value: caloriasObjetivo ? `${caloriasObjetivo} kcal` : "-" },
          ]}
        />
      </Card>

      <Card>
        <SectionHeader title="Historico recente" trailing="Ultimos registros" />
        {history.length ? [...history].slice(-6).reverse().map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyCopy}>
              <Text style={styles.historyTitle}>{item.label}</Text>
              <Text style={styles.historyDescription}>Registro semanal salvo no Supabase.</Text>
            </View>
            <View>
              <Text style={styles.historyValue}>{item.peso} kg</Text>
              <Text style={styles.historyDate}>{formatShortDate(item.date)}</Text>
            </View>
          </View>
        )) : (
          <EmptyStateCard
            title="Nenhum check-in registrado ainda"
            description="Quando o primeiro check-in for salvo, os ultimos registros aparecerao aqui com data e peso."
          />
        )}
      </Card>
    </Page>
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
  const { mealCardImagesByKey } = useAppDataContext()
  const mealKey = route.params?.mealKey ?? ""
  const objetivo = useUserStore((state) => state.objetivo)
  const caloriasObjetivo = useUserStore((state) => state.caloriasObjetivo)
  const fallbackPlan = useMemo(() => getPlanByObjective(objetivo), [objetivo])
  const [plano, setPlano] = useState(fallbackPlan)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState("")
  const [fatalError, setFatalError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [proteinFilter, setProteinFilter] = useState("all")
  const [calorieFilter, setCalorieFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const objetivoLabel = objetivoLabels[objetivo] ?? objetivoLabels.manter
  const selectedMealLabel = mealLabels[mealKey] ?? ""

  useEffect(() => {
    let isMounted = true

    async function loadPlan() {
      setLoading(true)
      setPlano(fallbackPlan)
      setFeedback("")
      setFatalError("")

      const { plan, error } = await getMealPlanFromSupabase(objetivo)
      if (!isMounted) return

      if (plan) {
        setPlano(plan)
      } else if (error) {
        setFeedback(`Supabase indisponivel: ${error.message}`)
        if (!fallbackPlan || Object.values(fallbackPlan).every((recipes) => recipes.length === 0)) {
          setFatalError("Nao foi possivel carregar os cardapios agora.")
        }
      } else {
        setFeedback("Sem receitas cadastradas no Supabase para essa meta. Exibindo fallback local.")
      }

      setLoading(false)
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

  function clearFilters() {
    setSearchQuery("")
    setProteinFilter("all")
    setCalorieFilter("all")
    setTimeFilter("all")
    setCategoryFilter("all")
  }

  return (
    <Page>
      <HeroCard>
        <Text style={styles.eyebrow}>Seu plano diario</Text>
        <Text style={styles.heroTitle}>{mealKey ? selectedMealLabel : `Cardapios para ${objetivoLabel}`}</Text>
        <Text style={styles.heroSubtitle}>
          {mealKey
            ? `Receitas recomendadas para ${selectedMealLabel.toLowerCase()} dentro do plano de ${objetivoLabel.toLowerCase()}.`
            : `Selecione uma refeicao do dia para visualizar receitas alinhadas ao seu objetivo. Meta calorica: ${caloriasObjetivo ? `${caloriasObjetivo} kcal` : "a definir"}`}
        </Text>
        <View style={styles.chipRow}>
          {loading ? <Chip label="Atualizando..." /> : null}
          {mealKey && hasActiveFilters ? <Chip label={`${totalMatches} receitas encontradas`} /> : null}
        </View>
        {feedback ? <Text style={styles.warningText}>{feedback}</Text> : null}
      </HeroCard>

      {loading ? (
        <StatusCard
          eyebrow="Sincronizando"
          title="Carregando plano de refeicoes"
          description="Estamos buscando as melhores receitas para o objetivo atual."
        />
      ) : null}

      {fatalError ? (
        <StatusCard
          tone="warning"
          eyebrow="Instabilidade"
          title="Nao foi possivel carregar os cardapios"
          description={fatalError}
        />
      ) : null}

      {mealKey ? (
        <Card>
          <SectionHeader title="Busca inteligente" trailing={selectedMealLabel} />
          <InputField
            label="Titulo ou ingrediente"
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
              { value: "low", label: "Ate 300" },
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
              { value: "fast", label: "Ate 10 min" },
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
          <SectionHeader title="Refeicoes disponiveis" helper="Escolha uma refeicao para ver as receitas." />
          <View style={styles.mealPillGrid}>
            {mealEntries.map(([currentMealKey, receitas]) => (
              <Pressable
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
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}

      {mealKey && !fatalError ? filteredEntries.map(([currentMealKey, receitas]) => (
        <Card key={currentMealKey}>
          <SectionHeader title={mealLabels[currentMealKey]} trailing={`${receitas.length} opcoes`} />
          {receitas.length === 0 ? (
            <EmptyStateCard
              title={hasActiveFilters ? "Nenhuma receita encontrada" : "Nenhuma receita disponivel"}
              description={
                hasActiveFilters
                  ? `Ajuste sua busca ou os filtros para encontrar novas opcoes em ${mealLabels[currentMealKey].toLowerCase()}.`
                  : `Ainda nao existem receitas cadastradas para ${mealLabels[currentMealKey].toLowerCase()}.`
              }
            />
          ) : (
            <View style={styles.recipeGrid}>
              {receitas.map((receita) => (
                <Pressable
                  key={receita.id}
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
              ))}
            </View>
          )}
        </Card>
      )) : null}

      {hasActiveFilters && totalMatches === 0 ? (
        <EmptyStateCard
          title="Nenhum resultado para esta combinacao"
          description="Tente outro titulo, ingrediente ou ajuste os filtros para visualizar mais receitas desta refeicao."
          actionLabel="Limpar filtros"
          onAction={clearFilters}
        />
      ) : null}

      <Button label={mealKey ? "Voltar para as refeicoes" : "Voltar ao painel"} variant="ghost" onPress={() => navigation.goBack()} />
    </Page>
  )
}

export function RecipeDetailsScreen({ navigation, route }) {
  const recipeId = route.params?.recipeId ?? ""
  const isPremium = useUserStore((state) => state.isPremium)
  const fallbackRecipe = useMemo(() => getRecipeById(recipeId), [recipeId])
  const [receita, setReceita] = useState(fallbackRecipe)
  const [source, setSource] = useState(fallbackRecipe ? "local" : "none")
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState("")
  const [adTimer, setAdTimer] = useState(isPremium ? 0 : 6)
  const [adLiberado, setAdLiberado] = useState(isPremium)

  useEffect(() => {
    let isMounted = true

    async function loadRecipe() {
      setLoading(true)
      setReceita(fallbackRecipe)
      setSource(fallbackRecipe ? "local" : "none")
      setFeedback("")

      const { recipe, error } = await getRecipeFromSupabase(recipeId)
      if (!isMounted) return

      if (recipe) {
        setReceita(recipe)
        setSource("supabase")
      } else if (error) {
        setFeedback(`Supabase indisponivel: ${error.message}`)
      }

      setLoading(false)
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

  if (loading) {
    return (
      <Page>
        <StatusCard eyebrow="Sincronizando" title="Carregando receita" description="Estamos preparando os detalhes desta receita para voce." />
      </Page>
    )
  }

  if (!receita) {
    return (
      <Page>
        <EmptyStateCard
          title="Receita nao encontrada"
          description="Essa receita nao esta mais disponivel ou ainda nao foi sincronizada."
          actionLabel="Voltar para cardapios"
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
          <Text style={styles.heroTitle}>Anuncio patrocinado</Text>
          <Text style={styles.heroSubtitle}>A receita sera liberada em {adTimer}s.</Text>
          <Card style={styles.adBox}>
            <Text style={styles.historyTitle}>Suplemento Nutri+</Text>
            <Text style={styles.historyDescription}>Recupere melhor no pos-treino com formula de aminoacidos.</Text>
          </Card>
          <Button label={adTimer > 0 ? `Aguarde ${adTimer}s` : "Ver receita"} onPress={() => setAdLiberado(true)} disabled={adTimer > 0} />
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <Card>
        {receita.imageUrl ? (
          <ImageBackground source={{ uri: receita.imageUrl }} imageStyle={styles.recipeHeroImage} style={styles.recipeHero}>
            <View style={styles.recipeOverlay}>
              <Text style={styles.eyebrow}>Receita selecionada</Text>
              <Text style={styles.heroTitle}>{receita.titulo}</Text>
              <Text style={styles.heroSubtitle}>{receita.calorias} kcal • {receita.proteina} de proteina • {receita.tempo}</Text>
            </View>
          </ImageBackground>
        ) : (
          <>
            <Text style={styles.eyebrow}>Receita selecionada</Text>
            <Text style={styles.heroTitle}>{receita.titulo}</Text>
            <Text style={styles.heroSubtitle}>{receita.calorias} kcal • {receita.proteina} de proteina • {receita.tempo}</Text>
          </>
        )}
        <View style={styles.chipRow}>
          <Chip label={`Fonte: ${source === "supabase" ? "Supabase" : "Fallback local"}`} />
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
        label={route.params?.backLabel ? `Voltar para ${route.params.backLabel}` : "Voltar aos cardapios"}
        variant="ghost"
        onPress={() => navigation.goBack()}
      />
    </Page>
  )
}

export function PlaceholderScreen({ title, description, bullets }) {
  const { objetivoLabel } = useAppDataContext()

  return (
    <Page>
      <Card>
        <SectionHeader title={title} helper={description} trailing={objetivoLabel} />
        <Card style={styles.placeholderHighlight}>
          <Text style={styles.historyTitle}>Espaco reservado no menu</Text>
          <Text style={styles.historyDescription}>Essa area ja esta pronta na navegacao mobile para evoluir sem refazer a estrutura principal.</Text>
        </Card>
        {bullets.map((bullet) => (
          <View key={bullet} style={styles.placeholderItem}>
            <Text style={styles.historyTitle}>{bullet}</Text>
            <Text style={styles.historyDescription}>Quando voce quiser, a gente pode transformar este bloco em uma tela funcional mantendo a mesma linguagem visual.</Text>
          </View>
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
    padding: spacing.lg,
    gap: spacing.md,
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
    minWidth: 98,
    borderRadius: radius.lg,
    padding: spacing.md,
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
    fontSize: 28,
    lineHeight: 32,
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
    padding: spacing.md,
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
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dashboardActionCard: {
    minWidth: "48%",
    flexGrow: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    gap: spacing.xs,
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
    gap: spacing.sm,
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
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    gap: spacing.xs,
  },
  mealActionImageCard: {
    minWidth: "48%",
    flexGrow: 1,
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
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  communityPrimaryActionRow: {
    alignItems: "flex-start",
  },
  communityComposerToggle: {
    minWidth: 112,
  },
  communityComposerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  warningText: {
    ...typography.bodySmall,
    color: colors.warning,
  },
  communityPreviewBox: {
    gap: spacing.sm,
  },
  communityActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  communityActionButton: {
    flexGrow: 1,
  },
  communityPreviewLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  communityPreviewImage: {
    width: "100%",
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
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
  communityReloadButton: {
    alignSelf: "flex-start",
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
    backgroundColor: colors.brandSoft,
  },
  placeholderItem: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
})
