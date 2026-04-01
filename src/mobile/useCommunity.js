import { useCallback, useEffect, useState } from "react"
import {
  createCommunityComment,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  likeCommunityPost,
  listCommunityPosts,
  saveCommunityPost,
  unsaveCommunityPost,
  unlikeCommunityPost,
  updateCommunityPost,
  uploadCommunityImage,
} from "../lib/communityService"
import { hasSupabaseConfig, supabase } from "../lib/supabaseClient"

const fallbackPosts = [
  {
    id: "community-1",
    author: "Marina",
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
    postedAt: "Hoje, 07:40",
    createdAt: "",
  },
  {
    id: "community-2",
    author: "Rafael",
    mealLabel: "Almoco",
    caption: "Prato forte do dia",
    body: "Frango grelhado, arroz integral e legumes. Mantive a refeicao simples para bater a meta de proteina sem exagerar nas calorias.",
    imageUrl: "",
    likes: 9,
    likedByMe: false,
    savedByMe: false,
    comments: [],
    commentsCount: 0,
    postedAt: "Hoje, 12:15",
    createdAt: "",
  },
]

const COMMUNITY_PAGE_SIZE = 10

function mergePosts(currentPosts, nextPosts) {
  const nextById = new Map(nextPosts.map((item) => [item.id, item]))
  const merged = currentPosts.map((item) => nextById.get(item.id) ?? item)
  const knownIds = new Set(merged.map((item) => item.id))
  const appended = nextPosts.filter((item) => !knownIds.has(item.id))
  return [...merged, ...appended]
}

export function useCommunity(authorName) {
  const [posts, setPosts] = useState(fallbackPosts)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [source, setSource] = useState("local")
  const [feedback, setFeedback] = useState("")
  const [userId, setUserId] = useState("")
  const [likingPostId, setLikingPostId] = useState("")
  const [commentingPostId, setCommentingPostId] = useState("")
  const [savingPostId, setSavingPostId] = useState("")
  const [editingPostId, setEditingPostId] = useState("")
  const [deletingPostId, setDeletingPostId] = useState("")
  const [deletingCommentId, setDeletingCommentId] = useState("")
  const [hasMorePosts, setHasMorePosts] = useState(true)

  const loadPosts = useCallback(async ({ append = false } = {}) => {
    if (!hasSupabaseConfig || !supabase) {
      setSource("local")
      setFeedback("Supabase nao configurado. O feed esta usando dados locais de exemplo.")
      setLoading(false)
      setLoadingMore(false)
      setHasMorePosts(false)
      return
    }

    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setFeedback("")
    }

    const nextOffset = append ? posts.length : 0

    const [{ data: userData, error: userError }, { posts: remotePosts, error: postsError, hasMore }] = await Promise.all([
      supabase.auth.getUser(),
      listCommunityPosts({
        limit: COMMUNITY_PAGE_SIZE,
        offset: nextOffset,
      }),
    ])

    setUserId(userData.user?.id ?? "")

    if (userError) {
      setSource("local")
      setFeedback("Nao foi possivel validar a sessao da comunidade. Exibindo dados locais.")
      setLoading(false)
      setLoadingMore(false)
      return
    }

    if (postsError) {
      setSource("local")
      setFeedback(`Supabase indisponivel: ${postsError.message}`)
      setLoading(false)
      setLoadingMore(false)
      return
    }

    if (remotePosts.length) {
      setPosts((current) => (append ? mergePosts(current, remotePosts) : remotePosts))
      setSource("supabase")
      setHasMorePosts(hasMore)
      setLoading(false)
      setLoadingMore(false)
      return
    }

    if (!append) {
      setPosts(fallbackPosts)
    }
    setSource("local")
    setHasMorePosts(false)
    if (!append) {
      setFeedback("Ainda nao existem posts no Supabase. Exibindo exemplos locais.")
    }
    setLoading(false)
    setLoadingMore(false)
  }, [posts.length])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPosts()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadPosts])

  const publishPost = useCallback(async ({
    caption,
    body,
    imageUrl,
    imageAsset,
    mealLabel,
  }) => {
    if (!caption.trim() || !body.trim()) {
      return {
        error: new Error("Preencha legenda e texto do post antes de publicar."),
      }
    }

    if (!hasSupabaseConfig || !supabase || !userId) {
      const localPost = {
        id: `community-${Date.now()}`,
        author: authorName || "Voce",
        mealLabel,
        caption: caption.trim(),
        body: body.trim(),
        imageUrl: imageAsset?.uri || imageUrl.trim(),
        likes: 0,
        likedByMe: false,
        savedByMe: false,
        comments: [],
        commentsCount: 0,
        postedAt: "Agora mesmo",
        createdAt: new Date().toISOString(),
      }

      setPosts((current) => [localPost, ...current])

      return {
        post: localPost,
        error: null,
        source: "local",
      }
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

    setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)])
    setSource("supabase")
    return { post, error: null, source: "supabase" }
  }, [authorName, userId])

  const toggleLike = useCallback(async (postId) => {
    const targetPost = posts.find((item) => item.id === postId)
    if (!targetPost) return { error: new Error("Post nao encontrado.") }

    if (!hasSupabaseConfig || !supabase || !userId) {
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? {
                ...item,
                likedByMe: !item.likedByMe,
                likes: Math.max(0, item.likes + (item.likedByMe ? -1 : 1)),
              }
            : item,
        ),
      )
      return { error: null, source: "local" }
    }

    setLikingPostId(postId)

    const previousLikedState = targetPost.likedByMe
    setPosts((current) =>
      current.map((item) =>
        item.id === postId
          ? {
              ...item,
              likedByMe: !item.likedByMe,
              likes: Math.max(0, item.likes + (item.likedByMe ? -1 : 1)),
            }
          : item,
      ),
    )

    const result = previousLikedState
      ? await unlikeCommunityPost(userId, postId)
      : await likeCommunityPost(userId, postId)

    setLikingPostId("")

    if (result.error) {
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? {
                ...item,
                likedByMe: previousLikedState,
                likes: Math.max(0, item.likes + (previousLikedState ? 1 : -1)),
              }
            : item,
        ),
      )
      return { error: result.error, source: "supabase" }
    }

    return { error: null, source: "supabase" }
  }, [posts, userId])

  const addComment = useCallback(async (postId, commentBody) => {
    const normalizedBody = commentBody.trim()
    const targetPost = posts.find((item) => item.id === postId)

    if (!targetPost) return { error: new Error("Post nao encontrado.") }
    if (!normalizedBody) return { error: new Error("Escreva um comentario antes de enviar.") }

    if (!hasSupabaseConfig || !supabase || !userId) {
      const localComment = {
        id: `community-comment-${Date.now()}`,
        postId,
        userId,
        author: authorName || "Voce",
        body: normalizedBody,
        postedAt: "Agora mesmo",
        createdAt: new Date().toISOString(),
      }

      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? {
                ...item,
                comments: [...(item.comments ?? []), localComment],
                commentsCount: (item.commentsCount ?? 0) + 1,
              }
            : item,
        ),
      )

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

    setPosts((current) =>
      current.map((item) =>
        item.id === postId
          ? {
              ...item,
              comments: [...(item.comments ?? []), comment],
              commentsCount: (item.commentsCount ?? 0) + 1,
            }
          : item,
      ),
    )

    return { comment, error: null, source: "supabase" }
  }, [authorName, posts, userId])

  const toggleSave = useCallback(async (postId) => {
    const targetPost = posts.find((item) => item.id === postId)
    if (!targetPost) return { error: new Error("Post nao encontrado.") }

    if (!hasSupabaseConfig || !supabase || !userId) {
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? { ...item, savedByMe: !item.savedByMe }
            : item,
        ),
      )
      return { error: null, source: "local" }
    }

    setSavingPostId(postId)
    const previousSavedState = targetPost.savedByMe
    setPosts((current) =>
      current.map((item) =>
        item.id === postId
          ? { ...item, savedByMe: !item.savedByMe }
          : item,
      ),
    )

    const result = previousSavedState
      ? await unsaveCommunityPost(userId, postId)
      : await saveCommunityPost(userId, postId)

    setSavingPostId("")

    if (result.error) {
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? { ...item, savedByMe: previousSavedState }
            : item,
        ),
      )
      return { error: result.error, source: "supabase" }
    }

    return { error: null, source: "supabase" }
  }, [posts, userId])

  const editPost = useCallback(async (payload) => {
    const targetPost = posts.find((item) => item.id === payload.postId)
    if (!targetPost) return { error: new Error("Post nao encontrado.") }
    if (!payload.caption.trim() || !payload.body.trim()) return { error: new Error("Legenda e texto sao obrigatorios.") }

    if (!hasSupabaseConfig || !supabase || !userId) {
      setPosts((current) =>
        current.map((item) =>
          item.id === payload.postId
            ? {
                ...item,
                caption: payload.caption.trim(),
                body: payload.body.trim(),
                imageUrl: payload.imageUrl.trim(),
                mealLabel: payload.mealLabel,
              }
            : item,
        ),
      )
      return { error: null, source: "local" }
    }

    setEditingPostId(payload.postId)
    const { post, error } = await updateCommunityPost(userId, {
      ...payload,
      authorName,
    })
    setEditingPostId("")

    if (error || !post) return { error, source: "supabase" }

    setPosts((current) =>
      current.map((item) =>
        item.id === payload.postId
          ? {
              ...item,
              ...post,
              likes: item.likes,
              likedByMe: item.likedByMe,
              savedByMe: item.savedByMe,
              comments: item.comments,
              commentsCount: item.commentsCount,
            }
          : item,
      ),
    )

    return { error: null, source: "supabase" }
  }, [authorName, posts, userId])

  const removePost = useCallback(async (postId) => {
    const targetPost = posts.find((item) => item.id === postId)
    if (!targetPost) return { error: new Error("Post nao encontrado.") }

    if (!hasSupabaseConfig || !supabase || !userId) {
      setPosts((current) => current.filter((item) => item.id !== postId))
      return { error: null, source: "local" }
    }

    setDeletingPostId(postId)
    const { error } = await deleteCommunityPost(userId, postId)
    setDeletingPostId("")

    if (error) return { error, source: "supabase" }

    setPosts((current) => current.filter((item) => item.id !== postId))
    return { error: null, source: "supabase" }
  }, [posts, userId])

  const removeComment = useCallback(async (postId, commentId) => {
    const targetPost = posts.find((item) => item.id === postId)
    const targetComment = targetPost?.comments?.find((item) => item.id === commentId)
    if (!targetPost || !targetComment) return { error: new Error("Comentario nao encontrado.") }

    if (!hasSupabaseConfig || !supabase || !userId) {
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? {
                ...item,
                comments: (item.comments ?? []).filter((comment) => comment.id !== commentId),
                commentsCount: Math.max(0, (item.commentsCount ?? 0) - 1),
              }
            : item,
        ),
      )
      return { error: null, source: "local" }
    }

    setDeletingCommentId(commentId)
    const { error } = await deleteCommunityComment(userId, commentId)
    setDeletingCommentId("")

    if (error) return { error, source: "supabase" }

    setPosts((current) =>
      current.map((item) =>
        item.id === postId
          ? {
              ...item,
              comments: (item.comments ?? []).filter((comment) => comment.id !== commentId),
              commentsCount: Math.max(0, (item.commentsCount ?? 0) - 1),
            }
          : item,
      ),
    )

    return { error: null, source: "supabase" }
  }, [posts, userId])

  const loadMorePosts = useCallback(async () => {
    if (loading || loadingMore || !hasMorePosts) return
    await loadPosts({ append: true })
  }, [hasMorePosts, loadPosts, loading, loadingMore])

  return {
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
    currentUserId: userId,
    source,
    feedback,
    reloadPosts: loadPosts,
    loadMorePosts,
    publishPost,
    toggleLike,
    toggleSave,
    addComment,
    editPost,
    removePost,
    removeComment,
  }
}
