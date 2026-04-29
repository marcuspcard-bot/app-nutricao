import AsyncStorage from "@react-native-async-storage/async-storage"
import { logWarn } from "./appLogger"

const CACHE_PREFIX = "appnutricao:cache:"

function buildStorageKey(cacheKey) {
  return `${CACHE_PREFIX}${cacheKey}`
}

export async function readCachedResource(cacheKey) {
  if (!cacheKey) {
    return { exists: false, data: null, updatedAt: null }
  }

  try {
    const rawValue = await AsyncStorage.getItem(buildStorageKey(cacheKey))
    if (!rawValue) {
      return { exists: false, data: null, updatedAt: null }
    }

    const parsed = JSON.parse(rawValue)
    return {
      exists: true,
      data: parsed.data ?? null,
      updatedAt: parsed.updatedAt ?? null,
    }
  } catch (error) {
    logWarn("Nao foi possivel ler o cache local.", {
      cacheKey,
      error: error?.message ?? String(error),
    })
    return { exists: false, data: null, updatedAt: null }
  }
}

export async function writeCachedResource(cacheKey, data) {
  if (!cacheKey) return

  try {
    await AsyncStorage.setItem(
      buildStorageKey(cacheKey),
      JSON.stringify({
        data,
        updatedAt: Date.now(),
      }),
    )
  } catch (error) {
    logWarn("Nao foi possivel salvar o cache local.", {
      cacheKey,
      error: error?.message ?? String(error),
    })
  }
}

export async function removeCachedResource(cacheKey) {
  if (!cacheKey) return

  try {
    await AsyncStorage.removeItem(buildStorageKey(cacheKey))
  } catch (error) {
    logWarn("Nao foi possivel limpar o cache local.", {
      cacheKey,
      error: error?.message ?? String(error),
    })
  }
}

export function isCacheFresh(updatedAt, maxAgeMs) {
  if (!updatedAt || !maxAgeMs) return false
  return Date.now() - Number(updatedAt) <= maxAgeMs
}
