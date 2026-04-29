import { hasSupabaseConfig, supabase } from "./supabaseClient"

function formatCreatedAt(value) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function mapPostRow(row, profilesByUserId = {}) {
  return {
    id: row.id,
    author: profilesByUserId[row.user_id]?.nome || "Membro da comunidade",
    userId: row.user_id,
    mealLabel: row.meal_type || "Refeicao",
    caption: row.caption,
    body: row.body,
    imageUrl: row.image_url || "",
    likes: 0,
    likedByMe: false,
    savedByMe: false,
    comments: [],
    commentsCount: 0,
    postedAt: formatCreatedAt(row.created_at),
    createdAt: row.created_at,
  }
}

function mapCommentRow(row, profilesByUserId = {}) {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    author: profilesByUserId[row.user_id]?.nome || "Membro da comunidade",
    body: row.body,
    postedAt: formatCreatedAt(row.created_at),
    createdAt: row.created_at,
  }
}

function getFileExtension(fileName = "", mimeType = "") {
  const normalizedFileName = String(fileName)
  const fileExtension = normalizedFileName.includes(".") ? normalizedFileName.split(".").pop() : ""
  if (fileExtension) return fileExtension.toLowerCase()

  const normalizedMimeType = String(mimeType).toLowerCase()
  if (normalizedMimeType.includes("png")) return "png"
  if (normalizedMimeType.includes("webp")) return "webp"
  return "jpg"
}

function getContentType(mimeType = "", extension = "") {
  if (mimeType) return mimeType
  if (extension === "png") return "image/png"
  if (extension === "webp") return "image/webp"
  return "image/jpeg"
}

async function getProfilesMap(userIds) {
  if (!userIds.length) return {}

  const { data, error } = await supabase
    .from("perfis")
    .select("user_id, nome")
    .in("user_id", userIds)

  if (error) return {}

  return (data ?? []).reduce((acc, profile) => {
    acc[profile.user_id] = profile
    return acc
  }, {})
}

export async function listCommunityPosts(options = {}) {
  if (!hasSupabaseConfig || !supabase) return { posts: [], error: null }

  const limit = Number(options.limit ?? 10)
  const offset = Number(options.offset ?? 0)

  const { data: userData } = await supabase.auth.getUser()
  const currentUserId = userData.user?.id ?? ""

  const { data, error } = await supabase
    .from("community_posts")
    .select("id, user_id, caption, body, image_url, meal_type, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { posts: [], error, hasMore: false }

  const userIds = [...new Set((data ?? []).map((item) => item.user_id).filter(Boolean))]
  const profilesByUserId = await getProfilesMap(userIds)
  const postIds = (data ?? []).map((item) => item.id)
  let likesByPostId = {}
  let likedPostIds = new Set()
  let savedPostIds = new Set()

  if (postIds.length) {
    const [{ data: likeRows }, { data: myLikeRows }, { data: commentRows }, { data: savedRows }] = await Promise.all([
      supabase
        .from("community_post_likes")
        .select("post_id")
        .in("post_id", postIds),
      currentUserId
        ? supabase
            .from("community_post_likes")
            .select("post_id")
            .eq("user_id", currentUserId)
            .in("post_id", postIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("community_post_comments")
        .select("id, post_id, user_id, body, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true }),
      currentUserId
        ? supabase
            .from("community_saved_posts")
            .select("post_id")
            .eq("user_id", currentUserId)
            .in("post_id", postIds)
        : Promise.resolve({ data: [] }),
    ])

    likesByPostId = (likeRows ?? []).reduce((acc, item) => {
      acc[item.post_id] = (acc[item.post_id] ?? 0) + 1
      return acc
    }, {})

    likedPostIds = new Set((myLikeRows ?? []).map((item) => item.post_id))
    savedPostIds = new Set((savedRows ?? []).map((item) => item.post_id))
    const commentsCountByPostId = (commentRows ?? []).reduce((acc, item) => {
      acc[item.post_id] = (acc[item.post_id] ?? 0) + 1
      return acc
    }, {})

    return {
      posts: (data ?? []).map((row) => ({
        ...mapPostRow(row, profilesByUserId),
        likes: likesByPostId[row.id] ?? 0,
        likedByMe: likedPostIds.has(row.id),
        savedByMe: savedPostIds.has(row.id),
        comments: [],
        commentsCount: commentsCountByPostId[row.id] ?? 0,
      })),
      hasMore: (data ?? []).length === limit,
      error: null,
    }
  }

  return {
    posts: (data ?? []).map((row) => ({
      ...mapPostRow(row, profilesByUserId),
      likes: likesByPostId[row.id] ?? 0,
      likedByMe: likedPostIds.has(row.id),
      savedByMe: savedPostIds.has(row.id),
      comments: [],
      commentsCount: 0,
    })),
    hasMore: (data ?? []).length === limit,
    error: null,
  }
}

export async function listCommunityComments(postId, options = {}) {
  if (!hasSupabaseConfig || !supabase || !postId) {
    return { comments: [], error: null, hasMore: false }
  }

  const limit = Number(options.limit ?? 5)
  const offset = Number(options.offset ?? 0)

  const { data, error } = await supabase
    .from("community_post_comments")
    .select("id, post_id, user_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    return { comments: [], error, hasMore: false }
  }

  const commentUserIds = [...new Set((data ?? []).map((item) => item.user_id).filter(Boolean))]
  const commentProfilesByUserId = await getProfilesMap(commentUserIds)

  return {
    comments: (data ?? []).map((row) => mapCommentRow(row, commentProfilesByUserId)),
    hasMore: (data ?? []).length === limit,
    error: null,
  }
}

export async function createCommunityPost(userId, payload) {
  if (!hasSupabaseConfig || !supabase || !userId) return { post: null, error: null }

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: userId,
      caption: payload.caption,
      body: payload.body,
      image_url: payload.imageUrl || null,
      meal_type: payload.mealLabel || null,
    })
    .select("id, user_id, caption, body, image_url, meal_type, created_at")
    .single()

  if (error) return { post: null, error }

  return {
    post: mapPostRow(data, {
      [userId]: {
        nome: payload.authorName || "Voce",
      },
    }),
    error: null,
  }
}

export async function likeCommunityPost(userId, postId) {
  if (!hasSupabaseConfig || !supabase || !userId || !postId) return { error: null }

  const { error } = await supabase
    .from("community_post_likes")
    .insert({
      post_id: postId,
      user_id: userId,
    })

  return { error }
}

export async function saveCommunityPost(userId, postId) {
  if (!hasSupabaseConfig || !supabase || !userId || !postId) return { error: null }

  const { error } = await supabase
    .from("community_saved_posts")
    .insert({
      post_id: postId,
      user_id: userId,
    })

  return { error }
}

export async function unsaveCommunityPost(userId, postId) {
  if (!hasSupabaseConfig || !supabase || !userId || !postId) return { error: null }

  const { error } = await supabase
    .from("community_saved_posts")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId)

  return { error }
}

export async function unlikeCommunityPost(userId, postId) {
  if (!hasSupabaseConfig || !supabase || !userId || !postId) return { error: null }

  const { error } = await supabase
    .from("community_post_likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId)

  return { error }
}

export async function uploadCommunityImage(userId, imageAsset) {
  if (!hasSupabaseConfig || !supabase || !userId || !imageAsset?.uri) {
    return { imageUrl: imageAsset?.uri || "", error: null }
  }

  const extension = getFileExtension(imageAsset.fileName, imageAsset.mimeType)
  const contentType = getContentType(imageAsset.mimeType, extension)
  const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

  const response = await fetch(imageAsset.uri)
  const arrayBuffer = await response.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from("community-images")
    .upload(filePath, arrayBuffer, {
      contentType,
      upsert: false,
    })

  if (uploadError) return { imageUrl: "", error: uploadError }

  const { data } = supabase.storage.from("community-images").getPublicUrl(filePath)

  return {
    imageUrl: data.publicUrl,
    error: null,
  }
}

export async function createCommunityComment(userId, payload) {
  if (!hasSupabaseConfig || !supabase || !userId || !payload.postId) return { comment: null, error: null }

  const { data, error } = await supabase
    .from("community_post_comments")
    .insert({
      post_id: payload.postId,
      user_id: userId,
      body: payload.body,
    })
    .select("id, post_id, user_id, body, created_at")
    .single()

  if (error) return { comment: null, error }

  return {
    comment: mapCommentRow(data, {
      [userId]: {
        nome: payload.authorName || "Voce",
      },
    }),
    error: null,
  }
}

export async function updateCommunityPost(userId, payload) {
  if (!hasSupabaseConfig || !supabase || !userId || !payload.postId) return { post: null, error: null }

  const { data, error } = await supabase
    .from("community_posts")
    .update({
      caption: payload.caption,
      body: payload.body,
      image_url: payload.imageUrl || null,
      meal_type: payload.mealLabel || null,
    })
    .eq("id", payload.postId)
    .eq("user_id", userId)
    .select("id, user_id, caption, body, image_url, meal_type, created_at")
    .single()

  if (error) return { post: null, error }

  return {
    post: mapPostRow(data, {
      [userId]: {
        nome: payload.authorName || "Voce",
      },
    }),
    error: null,
  }
}

export async function deleteCommunityPost(userId, postId) {
  if (!hasSupabaseConfig || !supabase || !userId || !postId) return { error: null }

  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", userId)

  return { error }
}

export async function deleteCommunityComment(userId, commentId) {
  if (!hasSupabaseConfig || !supabase || !userId || !commentId) return { error: null }

  const { error } = await supabase
    .from("community_post_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId)

  return { error }
}
