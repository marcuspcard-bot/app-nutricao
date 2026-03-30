import { hasSupabaseConfig, supabase } from "./supabaseClient"

function mapCheckinRow(row) {
  return {
    id: row.id,
    date: row.data_checkin,
    peso: Number(row.peso),
    createdAt: row.created_at,
  }
}

export async function getWeeklyCheckins(userId) {
  if (!hasSupabaseConfig || !supabase || !userId) return { checkins: [], error: null }

  const { data, error } = await supabase
    .from("checkins_semanais")
    .select("id, data_checkin, peso, created_at")
    .eq("user_id", userId)
    .order("data_checkin", { ascending: true })

  if (error) return { checkins: [], error }

  return {
    checkins: (data ?? []).map(mapCheckinRow),
    error: null,
  }
}

export async function createWeeklyCheckin(userId, payload) {
  if (!hasSupabaseConfig || !supabase || !userId) return { checkin: null, error: null }

  const { data, error } = await supabase
    .from("checkins_semanais")
    .insert({
      user_id: userId,
      data_checkin: payload.date,
      peso: payload.peso,
    })
    .select("id, data_checkin, peso, created_at")
    .single()

  if (error) return { checkin: null, error }

  return {
    checkin: mapCheckinRow(data),
    error: null,
  }
}
