import { useCallback, useEffect, useRef, useState } from "react"
import {
  createCommunityComment,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  likeCommunityPost,
  listCommunityComments,
  listCommunityPosts,
  saveCommunityPost,
  unsaveCommunityPost,
  unlikeCommunityPost,
  updateCommunityPost,
  uploadCommunityImage,
} from "../lib/communityService"
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient"
import { readCachedResource, writeCachedResource } from "../lib/cacheClient"
import { runWithRetry } from "../lib/dataClient"
import { cacheKeys } from "../lib/cacheKeys"

const COMMUNITY_PAGE_SIZE = 10
const COMMENT_PAGE_SIZE = 5

function createPostState(overrides = {}) {
  return {
    comments: [],
    commentsCount: 0,
    commentsLoaded: false,
    commentsLoading: false,
    commentsRefreshing: false,
    commentsHasMore: false,
    commentsError: "",
    commentsPage: 0,
    ...overrides,
  }
}

const fallbackPosts = [
  createPostState({
    id: "community-1",
    author: "Marina",
    userId: "",
    mealLabel: "Cafe da manha",
    caption: "Overnight oats de banana com canela",
    body: "Preparei ontem a noite e ficou perfeito para comecar o dia com energia. Ficou cremoso e bem pratico para a rotina.",
    imageUrl: "https://static.vecteezy.com/ti/fotos-gratis/p2/75626029-cremoso-durante-a-noite-aveia-com-banana-fatias-e-canela-gravetos-dentro-jarra-gratis-foto.jpeg",
    likes: 18,
    likedByMe: false,
    savedByMe: false,
    comments: [
      {
        id: "community-comment-1",
        postId: "community-1",
        userId: "",
        author: "Luciana",
        body: "Ficou com uma cara otima. Vou testar essa combinacao amanha cedo.",
        postedAt: "Hoje, 08:05",
        createdAt: "",
      },
    ],
    commentsCount: 1,
    commentsLoaded: true,
    commentsHasMore: false,
    commentsPage: 1,
    postedAt: "Hoje, 07:40",
    createdAt: "",
  }),
  createPostState({
    id: "community-2",
    author: "Rafael",
    userId: "",
    mealLabel: "Almoco",
    caption: "Prato forte do dia",
    body: "Frango grelhado, arroz integral e legumes. Mantive a refeição simples para bater a meta de proteína sem exagerar nas calorias.",
    imageUrl: "",
    likes: 9,
    likedByMe: false,
    savedByMe: false,
    comments: [],
    commentsCount: 0,
    commentsLoaded: true,
    commentsHasMore: false,
    commentsPage: 0,
    postedAt: "Hoje, 12:15",
    createdAt: "",
  }),
]

function normalizePost(post) {
  return createPostState(post)
}

function normalizePosts(posts) {
  return (posts ?? []).map(normalizePost)
}

function mergePosts(currentPosts, nextPosts) {
  const nextById = new Map(nextPosts.map((item) => [item.id, normalizePost(item)]))
  const merged = currentPosts.map((item) => {
    const incoming = nextById.get(item.id)
    return incoming
      ? {
          ...incoming,
          comments: item.commentsLoaded ? item.comments : incoming.comments,
          commentsLoaded: item.commentsLoaded || incoming.commentsLoaded,
          commentsLoading: item.commentsLoading,
          commentsRefreshing: item.commentsRefreshing,
          commentsHasMore: item.commentsLoaded ? item.commentsHasMore : incoming.commentsHasMore,
          commentsError: item.commentsError,
          commentsPage: item.commentsLoaded ? item.commentsPage : incoming.commentsPage,
        }
      : item
  })
  const knownIds = new Set(merged.map((item) => item.id))
  const appended = nextPosts.map(normalizePost).filter((item) => !knownIds.has(item.id))
  return [...merged, ...appended]
}

function updatePost(posts, postId, updater) {
  return posts.map((item) => (item.id === postId ? updater(item) : item))
}

async function persistFeedCache(posts, hasMorePosts, source = "supabase") {
  await writeCachedResource(cacheKeys.communityFeedFirstPage, {
    posts: posts.slice(0, COMMUNITY_PAGE_SIZE).map((post) => ({
      ...post,
      comments: post.commentsLoaded ? post.comments.slice(0, COMMENT_PAGE_SIZE) : [],
    })),
    hasMorePosts,
    source,
  })
}

export function useCommunity(authorName) {
  const [posts, setPosts] = useState(normalizePosts(fallbackPosts))
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [source, setSource] = useState("local")
  const [feedback, setFeedback] = useState("")
  const [staleData, setStaleData] = useState(false)
  const [userId, setUserId] = useState("")
  const [likingPostId, setLikingPostId] = useState("")
  const [commentingPostId, setCommentingPostId] = useState("")
  const [savingPostId, setSavingPostId] = useState("")
  const [editingPostId, setEditingPostId] = useState("")
  const [deletingPostId, setDeletingPostId] = useState("")
  const [deletingCommentId, setDeletingCommentId] = useState("")
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const postsCountRef = useRef(fallbackPosts.length)
  const postsRef = useRef(normalizePosts(fallbackPosts))
  const latestLoadRequestIdRef = useRef(0)

  useEffect(() => {
    postsCountRef.current = posts.length
    postsRef.current = posts
  }, [posts])

  const loadPosts = useCallback(async ({ mode = "initial" } = {}) => {
    const isAppend = mode === "append"
    const isInitial = mode === "initial"
    const requestId = latestLoadRequestIdRef.current + 1
    latestLoadRequestIdRef.current = requestId

    if (!hasSupabaseConfig || !supabase) {
      setSource("local")
      setFeedback("Supabase não configurado. O feed está usando dados locais de exemplo.")
      setPosts(normalizePosts(fallbackPosts))
      setLoading(false)
      setInitialLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
      setHasMorePosts(false)
      return
    }

    if (isInitial) {
      const cachedFeed = await readCachedResource(cacheKeys.communityFeedFirstPage)
      if (latestLoadRequestIdRef.current !== requestId) return

      if (cachedFeed.exists && cachedFeed.data?.posts?.length) {
        setPosts(normalizePosts(cachedFeed.data.posts))
        setHasMorePosts(Boolean(cachedFeed.data.hasMorePosts))
        setSource(cachedFeed.data.source || "cache")
        setInitialLoading(false)
      }
    }

    if (isAppend) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setRefreshing(!isInitial || postsCountRef.current > 0)
      setFeedback("")
      setStaleData(false)
    }

    const nextOffset = isAppend ? postsCountRef.current : 0

    try {
      const [{ data: userData, error: userError }, { posts: remotePosts, error: postsError, hasMore }] = await Promise.all([
        runWithRetry(() => supabase.auth.getUser(), {
          label: "community:getUser",
          retries: 2,
          baseDelayMs: 450,
        }),
        runWithRetry(
          () =>
            listCommunityPosts({
              limit: COMMUNITY_PAGE_SIZE,
              offset: nextOffset,
            }),
          {
            label: `community:list:${mode}`,
            retries: 2,
            baseDelayMs: 500,
          },
        ),
      ])

      if (latestLoadRequestIdRef.current !== requestId) return

      setUserId(userData.user?.id ?? "")

      if (userError) {
        throw userError
      }

      if (postsError) {
        throw postsError
      }

      if (remotePosts.length) {
        const normalizedRemotePosts = normalizePosts(remotePosts)
        const nextPosts = isAppend ? mergePosts(postsRef.current, normalizedRemotePosts) : normalizedRemotePosts
        setPosts(nextPosts)
        setSource("supabase")
        setHasMorePosts(hasMore)
        setStaleData(false)
        if (!isAppend) {
          await persistFeedCache(nextPosts, hasMore, "supabase")
        }
      } else if (!isAppend) {
        setPosts(normalizePosts(fallbackPosts))
        setSource("local")
        setHasMorePosts(false)
        setFeedback("Ainda não existem posts no Supabase. Exibindo exemplos locais.")
      } else {
        setHasMorePosts(false)
      }
    } catch (error) {
      if (latestLoadRequestIdRef.current !== requestId) return

      const cachedFeed = await readCachedResource(cacheKeys.communityFeedFirstPage)
      if (cachedFeed.exists && cachedFeed.data?.posts?.length && !isAppend) {
        setPosts(normalizePosts(cachedFeed.data.posts))
        setHasMorePosts(Boolean(cachedFeed.data.hasMorePosts))
        setSource(cachedFeed.data.source || "cache")
        setFeedback("Sem conexão no momento. Exibindo feed salvo neste aparelho.")
        setStaleData(true)
      } else {
        setFeedback(`Não foi possível carregar a comunidade agora. ${error.message || ""}`.trim())
      }
    } finally {
      if (latestLoadRequestIdRef.current === requestId) {
        setLoading(false)
        setInitialLoading(false)
        setRefreshing(false)
        setLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPosts({ mode: "initial" })
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadPosts])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return undefined
    }

    let realtimeRefreshTimeoutId = null
    const channel = supabase.channel("community-feed-realtime")

    function scheduleRealtimeRefresh() {
      if (realtimeRefreshTimeoutId) {
        clearTimeout(realtimeRefreshTimeoutId)
      }

      realtimeRefreshTimeoutId = setTimeout(() => {
        loadPosts({ mode: "reload" })
      }, 350)
    }

    channel
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "community_posts",
      }, scheduleRealtimeRefresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "community_post_comments",
      }, scheduleRealtimeRefresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "community_post_likes",
      }, scheduleRealtimeRefresh)
      .subscribe()

    return () => {
      if (realtimeRefreshTimeoutId) {
        clearTimeout(realtimeRefreshTimeoutId)
      }
      supabase.removeChannel(channel)
    }
  }, [loadPosts])

  const loadCommentsForPost = useCallback(async (postId, options = {}) => {
    const { mode = "initial" } = options
    const targetPost = postsRef.current.find((item) => item.id === postId)
    if (!targetPost) return { error: new Error("Post não encontrado.") }

    const isAppend = mode === "append"
    const nextOffset = isAppend ? targetPost.comments.length : 0

    if (!hasSupabaseConfig || !supabase) {
      return { error: null, source: "local" }
    }

    setPosts((current) =>
      updatePost(current, postId, (post) => ({
        ...post,
        commentsLoading: !isAppend,
        commentsRefreshing: isAppend ? post.commentsRefreshing : post.commentsLoaded,
        commentsError: "",
      })),
    )

    try {
      const { comments, error, hasMore } = await runWithRetry(
        () =>
          listCommunityComments(postId, {
            limit: COMMENT_PAGE_SIZE,
            offset: nextOffset,
          }),
        {
          label: `community:comments:${postId}:${mode}`,
          retries: 2,
          baseDelayMs: 500,
        },
      )

      if (error) {
        throw error
      }

      setPosts((current) =>
        updatePost(current, postId, (post) => ({
          ...post,
          comments: isAppend ? [...post.comments, ...comments] : comments,
          commentsLoaded: true,
          commentsLoading: false,
          commentsRefreshing: false,
          commentsHasMore: hasMore,
          commentsPage: isAppend ? post.commentsPage + 1 : 1,
          commentsError: "",
        })),
      )
      return { error: null, source: "supabase" }
    } catch (error) {
      setPosts((current) =>
        updatePost(current, postId, (post) => ({
          ...post,
          commentsLoading: false,
          commentsRefreshing: false,
          commentsError: "Não foi possível carregar os comentários agora.",
        })),
      )
      return { error, source: "supabase" }
    }
  }, [])

  const publishPost = useCallback(
    async ({ caption, body, imageUrl, imageAsset, mealLabel }) => {
      if (!caption.trim() || !body.trim()) {
        return { error: new Error("Preencha legenda e texto do post antes de publicar.") }
      }

      if (!hasSupabaseConfig || !supabase || !userId) {
        const localPost = createPostState({
          id: `community-${Date.now()}`,
          author: authorName || "Você",
          userId,
          mealLabel,
          caption: caption.trim(),
          body: body.trim(),
          imageUrl: imageAsset?.uri || imageUrl.trim(),
          likes: 0,
          likedByMe: false,
          savedByMe: false,
          postedAt: "Agora mesmo",
          createdAt: new Date().toISOString(),
          commentsLoaded: true,
        })

        const nextPosts = [localPost, ...posts]
        setPosts(nextPosts)
        await persistFeedCache(nextPosts, hasMorePosts, "local")
        return { post: localPost, error: null, source: "local" }
      }

      setSubmitting(true)
      let resolvedImageUrl = imageUrl.trim()

      if (imageAsset?.uri) {
        const { imageUrl: uploadedImageUrl, error: uploadError } = await uploadCommunityImage(userId, imageAsset)
        if (uploadError) {
          setSubmitting(false)
          return { post: null, error: uploadError, source: "supabase" }
        }
        resolvedImageUrl = uploadedImageUrl
      }

      const { post, error } = await createCommunityPost(userId, {
        caption: caption.trim(),
        body: body.trim(),
        imageUrl: resolvedImageUrl,
        mealLabel,
        authorName,
      })

      setSubmitting(false)
      if (error || !post) {
        return { post: null, error, source: "supabase" }
      }

      const nextPosts = [normalizePost(post), ...posts.filter((item) => item.id !== post.id)]
      setPosts(nextPosts)
      await persistFeedCache(nextPosts, hasMorePosts, "supabase")
      setSource("supabase")
      return { post, error: null, source: "supabase" }
    },
    [authorName, hasMorePosts, posts, userId],
  )

  const toggleLike = useCallback(async (postId) => {
    const targetPost = posts.find((item) => item.id === postId)
    if (!targetPost) return { error: new Error("Post não encontrado.") }

    const previousLikedState = targetPost.likedByMe
    const optimisticPosts = updatePost(posts, postId, (post) => ({
      ...post,
      likedByMe: !post.likedByMe,
      likes: Math.max(0, post.likes + (post.likedByMe ? -1 : 1)),
    }))
    setPosts(optimisticPosts)
    await persistFeedCache(optimisticPosts, hasMorePosts, hasSupabaseConfig ? "supabase" : "local")

    if (!hasSupabaseConfig || !supabase || !userId) {
      return { error: null, source: "local" }
    }

    setLikingPostId(postId)
    const result = previousLikedState ? await unlikeCommunityPost(userId, postId) : await likeCommunityPost(userId, postId)
    setLikingPostId("")

    if (result.error) {
      const revertedPosts = updatePost(posts, postId, (post) => ({
        ...post,
        likedByMe: previousLikedState,
        likes: Math.max(0, post.likes + (previousLikedState ? 1 : -1)),
      }))
      setPosts(revertedPosts)
      await persistFeedCache(revertedPosts, hasMorePosts, "supabase")
      return { error: result.error, source: "supabase" }
    }

    return { error: null, source: "supabase" }
  }, [hasMorePosts, posts, userId])

  const addComment = useCallback(async (postId, commentBody) => {
    const normalizedBody = commentBody.trim()
    const targetPost = posts.find((item) => item.id === postId)
    if (!targetPost) return { error: new Error("Post não encontrado.") }
    if (!normalizedBody) return { error: new Error("Escreva um comentário antes de enviar.") }

    if (!hasSupabaseConfig || !supabase || !userId) {
      const localComment = {
        id: `community-comment-${Date.now()}`,
        postId,
        userId,
        author: authorName || "Você",
        body: normalizedBody,
        postedAt: "Agora mesmo",
        createdAt: new Date().toISOString(),
      }

      const nextPosts = updatePost(posts, postId, (post) => ({
        ...post,
        comments: post.commentsLoaded ? [...post.comments, localComment] : post.comments,
        commentsCount: (post.commentsCount ?? 0) + 1,
        commentsLoaded: post.commentsLoaded,
      }))
      setPosts(nextPosts)
      await persistFeedCache(nextPosts, hasMorePosts, "local")
      return { comment: localComment, error: null, source: "local" }
    }

    setCommentingPostId(postId)
    const { comment, error } = await createCommunityComment(userId, {
      postId,
      body: normalizedBody,
      authorName,
    })
    setCommentingPostId("")

    if (error || !comment) {
      return { comment: null, error, source: "supabase" }
    }

    const nextPosts = updatePost(posts, postId, (post) => ({
      ...post,
      comments: post.commentsLoaded ? [...post.comments, comment] : post.comments,
      commentsCount: (post.commentsCount ?? 0) + 1,
      commentsHasMore: post.commentsLoaded ? post.commentsHasMore : true,
    }))
    setPosts(nextPosts)
    await persistFeedCache(nextPosts, hasMorePosts, "supabase")
    return { comment, error: null, source: "supabase" }
  }, [authorName, hasMorePosts, posts, userId])

  const toggleSave = useCallback(async (postId) => {
    const targetPost = posts.find((item) => item.id === postId)
    if (!targetPost) return { error: new Error("Post não encontrado.") }

    const previousSavedState = targetPost.savedByMe
    const optimisticPosts = updatePost(posts, postId, (post) => ({
      ...post,
      savedByMe: !post.savedByMe,
    }))
    setPosts(optimisticPosts)
    await persistFeedCache(optimisticPosts, hasMorePosts, hasSupabaseConfig ? "supabase" : "local")

    if (!hasSupabaseConfig || !supabase || !userId) {
      return { error: null, source: "local" }
    }

    setSavingPostId(postId)
    const result = previousSavedState ? await unsaveCommunityPost(userId, postId) : await saveCommunityPost(userId, postId)
    setSavingPostId("")

    if (result.error) {
      const revertedPosts = updatePost(posts, postId, (post) => ({
        ...post,
        savedByMe: previousSavedState,
      }))
      setPosts(revertedPosts)
      await persistFeedCache(revertedPosts, hasMorePosts, "supabase")
      return { error: result.error, source: "supabase" }
    }

    return { error: null, source: "supabase" }
  }, [hasMorePosts, posts, userId])

  const editPost = useCallback(async (payload) => {
    const targetPost = posts.find((item) => item.id === payload.postId)
    if (!targetPost) return { error: new Error("Post não encontrado.") }
    if (!payload.caption.trim() || !payload.body.trim()) return { error: new Error("Legenda e texto sao obrigatorios.") }

    if (!hasSupabaseConfig || !supabase || !userId) {
      const nextPosts = updatePost(posts, payload.postId, (post) => ({
        ...post,
        caption: payload.caption.trim(),
        body: payload.body.trim(),
        imageUrl: payload.imageUrl.trim(),
        mealLabel: payload.mealLabel,
      }))
      setPosts(nextPosts)
      await persistFeedCache(nextPosts, hasMorePosts, "local")
      return { error: null, source: "local" }
    }

    setEditingPostId(payload.postId)
    const { post, error } = await updateCommunityPost(userId, {
      ...payload,
      authorName,
    })
    setEditingPostId("")

    if (error || !post) return { error, source: "supabase" }

    const nextPosts = updatePost(posts, payload.postId, (currentPost) => ({
      ...currentPost,
      ...normalizePost(post),
      comments: currentPost.comments,
      commentsLoaded: currentPost.commentsLoaded,
      commentsLoading: currentPost.commentsLoading,
      commentsRefreshing: currentPost.commentsRefreshing,
      commentsHasMore: currentPost.commentsHasMore,
      commentsError: currentPost.commentsError,
      commentsPage: currentPost.commentsPage,
    }))
    setPosts(nextPosts)
    await persistFeedCache(nextPosts, hasMorePosts, "supabase")
    return { error: null, source: "supabase" }
  }, [authorName, hasMorePosts, posts, userId])

  const removePost = useCallback(async (postId) => {
    const targetPost = posts.find((item) => item.id === postId)
    if (!targetPost) return { error: new Error("Post não encontrado.") }

    if (!hasSupabaseConfig || !supabase || !userId) {
      const nextPosts = posts.filter((item) => item.id !== postId)
      setPosts(nextPosts)
      await persistFeedCache(nextPosts, hasMorePosts, "local")
      return { error: null, source: "local" }
    }

    setDeletingPostId(postId)
    const { error } = await deleteCommunityPost(userId, postId)
    setDeletingPostId("")
    if (error) return { error, source: "supabase" }

    const nextPosts = posts.filter((item) => item.id !== postId)
    setPosts(nextPosts)
    await persistFeedCache(nextPosts, hasMorePosts, "supabase")
    return { error: null, source: "supabase" }
  }, [hasMorePosts, posts, userId])

  const removeComment = useCallback(async (postId, commentId) => {
    const targetPost = posts.find((item) => item.id === postId)
    const targetComment = targetPost?.comments?.find((item) => item.id === commentId)
    if (!targetPost || !targetComment) return { error: new Error("Comentário não encontrado.") }

    if (!hasSupabaseConfig || !supabase || !userId) {
      const nextPosts = updatePost(posts, postId, (post) => ({
        ...post,
        comments: (post.comments ?? []).filter((comment) => comment.id !== commentId),
        commentsCount: Math.max(0, (post.commentsCount ?? 0) - 1),
      }))
      setPosts(nextPosts)
      await persistFeedCache(nextPosts, hasMorePosts, "local")
      return { error: null, source: "local" }
    }

    setDeletingCommentId(commentId)
    const { error } = await deleteCommunityComment(userId, commentId)
    setDeletingCommentId("")
    if (error) return { error, source: "supabase" }

    const nextPosts = updatePost(posts, postId, (post) => ({
      ...post,
      comments: (post.comments ?? []).filter((comment) => comment.id !== commentId),
      commentsCount: Math.max(0, (post.commentsCount ?? 0) - 1),
    }))
    setPosts(nextPosts)
    await persistFeedCache(nextPosts, hasMorePosts, "supabase")
    return { error: null, source: "supabase" }
  }, [hasMorePosts, posts, userId])

  const loadMorePosts = useCallback(async () => {
    if (loading || loadingMore || !hasMorePosts) return
    await loadPosts({ mode: "append" })
  }, [hasMorePosts, loadPosts, loading, loadingMore])

  const reloadPosts = useCallback(async () => {
    if (loadingMore) return
    await loadPosts({ mode: "reload" })
  }, [loadPosts, loadingMore])

  return {
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
    currentUserId: userId,
    source,
    feedback,
    staleData,
    reloadPosts,
    loadMorePosts,
    loadCommentsForPost,
    publishPost,
    toggleLike,
    toggleSave,
    addComment,
    editPost,
    removePost,
    removeComment,
  }
}
