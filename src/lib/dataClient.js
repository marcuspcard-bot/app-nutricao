import { isCacheFresh, readCachedResource, writeCachedResource } from "./cacheClient"
import { logError, logInfo, logWarn } from "./appLogger"
import { startMeasure, trackResourceMetric } from "./performanceMonitor"

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toError(error) {
  if (error instanceof Error) return error
  return new Error(typeof error === "string" ? error : "Falha desconhecida.")
}

function isRetriableError(error) {
  const message = String(error?.message ?? "").toLowerCase()
  return (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("fetch") ||
    message.includes("tempor") ||
    message.includes("failed")
  )
}

export async function runWithRetry(requestFn, options = {}) {
  const {
    label = "request",
    retries = 1,
    baseDelayMs = 450,
    maxDelayMs = 5000,
    jitterMs = 180,
    shouldRetry = isRetriableError,
  } = options

  let attempt = 0
  let lastError = null

  while (attempt <= retries) {
    try {
      return await requestFn({ attempt })
    } catch (error) {
      const normalizedError = toError(error)
      lastError = normalizedError

      if (attempt >= retries || !shouldRetry(normalizedError)) {
        logError("Requisicao falhou.", {
          label,
          attempt: attempt + 1,
          error: normalizedError.message,
        })
        throw normalizedError
      }

      logWarn("Requisicao falhou e sera tentada novamente.", {
        label,
        attempt: attempt + 1,
        error: normalizedError.message,
      })

      const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
      const jitter = Math.floor(Math.random() * jitterMs)
      await sleep(exponentialDelay + jitter)
      attempt += 1
    }
  }

  throw lastError ?? new Error("Falha na requisicao.")
}

export async function fetchCachedResource(options) {
  const {
    cacheKey,
    requestFn,
    getData,
    getError = (result) => result?.error ?? null,
    fallbackData = null,
    retries = 1,
    label = cacheKey || "resource",
    maxAgeMs = 0,
    preferFreshCache = false,
  } = options

  const cached = await readCachedResource(cacheKey)
  const cacheIsFresh = cached.exists && isCacheFresh(cached.updatedAt, maxAgeMs)
  const requestMeasure = startMeasure(`${label}:fetch`, {
    cacheKey,
    preferFreshCache,
  })

  if (preferFreshCache && cacheIsFresh) {
    const completed = requestMeasure.end({
      source: "fresh-cache",
      cacheHit: true,
    })
    trackResourceMetric(label, {
      durationMs: completed.durationMs,
      source: "fresh-cache",
      cacheKey,
      context: completed.context,
    })

    return {
      data: cached.data,
      error: null,
      fromCache: true,
      isStale: false,
      updatedAt: cached.updatedAt,
      hasCache: true,
      cacheIsFresh: true,
    }
  }

  try {
    const result = await runWithRetry(async () => {
      const response = await requestFn()
      const responseError = getError(response)

      if (responseError) {
        throw toError(responseError)
      }

      return response
    }, { label, retries })

    const data = getData(result)
    await writeCachedResource(cacheKey, data)
    const completed = requestMeasure.end({
      source: "network",
      cacheHit: false,
    })

    logInfo("Recurso sincronizado com sucesso.", {
      label,
      cacheKey,
      durationMs: completed.durationMs,
    })
    trackResourceMetric(label, {
      durationMs: completed.durationMs,
      source: "network",
      cacheKey,
      context: completed.context,
    })

    return {
      data,
      error: null,
      fromCache: false,
      isStale: false,
      updatedAt: Date.now(),
      hasCache: cached.exists,
      cacheIsFresh: false,
    }
  } catch (error) {
    const normalizedError = toError(error)

    if (cached.exists) {
      const completed = requestMeasure.end({
        source: "stale-cache",
        cacheHit: true,
      })
      logWarn("Usando cache local por falha na sincronizacao.", {
        label,
        cacheKey,
        error: normalizedError.message,
        durationMs: completed.durationMs,
      })
      trackResourceMetric(label, {
        durationMs: completed.durationMs,
        source: "stale-cache",
        cacheKey,
        failed: true,
        context: {
          ...completed.context,
          error: normalizedError.message,
        },
      })

      return {
        data: cached.data,
        error: normalizedError,
        fromCache: true,
        isStale: true,
        updatedAt: cached.updatedAt,
        hasCache: true,
        cacheIsFresh,
      }
    }

    const completed = requestMeasure.end({
      source: "network",
      cacheHit: false,
    })
    trackResourceMetric(label, {
      durationMs: completed.durationMs,
      source: "network",
      cacheKey,
      failed: true,
      context: {
        ...completed.context,
        error: normalizedError.message,
      },
    })

    return {
      data: fallbackData,
      error: normalizedError,
      fromCache: false,
      isStale: false,
      updatedAt: null,
      hasCache: false,
      cacheIsFresh: false,
    }
  }
}

export function getErrorMessage(error, fallbackMessage) {
  if (!error) return ""
  return error.message || fallbackMessage
}
