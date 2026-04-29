import { logError, logPerformance, logWarn } from "./appLogger"

const resourceMetricsStore = new Map()
const screenMetricsStore = new Map()

function now() {
  if (globalThis.performance?.now) {
    return globalThis.performance.now()
  }

  return Date.now()
}

function roundDuration(durationMs) {
  return Math.round(Number(durationMs || 0))
}

function getMetricBucket(store, key) {
  if (!store.has(key)) {
    store.set(key, {
      count: 0,
      failures: 0,
      totalDurationMs: 0,
      maxDurationMs: 0,
      lastDurationMs: 0,
    })
  }

  return store.get(key)
}

function buildMetricSummary(bucket) {
  return {
    count: bucket.count,
    failures: bucket.failures,
    avgDurationMs: bucket.count ? roundDuration(bucket.totalDurationMs / bucket.count) : 0,
    maxDurationMs: roundDuration(bucket.maxDurationMs),
    lastDurationMs: roundDuration(bucket.lastDurationMs),
  }
}

export function startMeasure(name, context = {}) {
  const startedAt = now()

  return {
    end(extraContext = {}) {
      const durationMs = roundDuration(now() - startedAt)
      return {
        durationMs,
        name,
        context: {
          ...context,
          ...extraContext,
        },
      }
    },
  }
}

export function trackResourceMetric(resourceName, details = {}) {
  const bucket = getMetricBucket(resourceMetricsStore, resourceName)
  const durationMs = roundDuration(details.durationMs)
  const failed = Boolean(details.failed)

  bucket.count += 1
  bucket.totalDurationMs += durationMs
  bucket.lastDurationMs = durationMs
  bucket.maxDurationMs = Math.max(bucket.maxDurationMs, durationMs)

  if (failed) {
    bucket.failures += 1
  }

  const baseContext = {
    resourceName,
    durationMs,
    failed,
    source: details.source || "unknown",
    cacheKey: details.cacheKey || "",
    summary: buildMetricSummary(bucket),
    ...details.context,
  }

  if (failed) {
    logWarn("Metrica de recurso registrou falha.", baseContext)
    return
  }

  logPerformance("Metrica de recurso atualizada.", baseContext)
}

export function trackScreenMetric(screenName, details = {}) {
  const bucket = getMetricBucket(screenMetricsStore, screenName)
  const durationMs = roundDuration(details.durationMs)

  bucket.count += 1
  bucket.totalDurationMs += durationMs
  bucket.lastDurationMs = durationMs
  bucket.maxDurationMs = Math.max(bucket.maxDurationMs, durationMs)

  logPerformance("Metrica de tela atualizada.", {
    screenName,
    event: details.event || "screen-visible",
    durationMs,
    summary: buildMetricSummary(bucket),
    ...details.context,
  })
}

export function trackListRenderMetric(listName, details = {}) {
  const durationMs = roundDuration(details.durationMs)
  const itemCount = Number(details.itemCount || 0)

  logPerformance("Render de lista monitorado.", {
    listName,
    itemCount,
    durationMs,
    virtualization: details.virtualization || "default",
    warning: itemCount >= 40 || durationMs >= 120 ? "large-list" : "",
    ...details.context,
  })
}

export async function trackAsyncOperation(operationName, callback, context = {}) {
  const measure = startMeasure(operationName, context)

  try {
    const result = await callback()
    const completed = measure.end()
    logPerformance("Operacao assincrona concluida.", {
      operationName,
      durationMs: completed.durationMs,
      ...completed.context,
    })
    return result
  } catch (error) {
    const completed = measure.end()
    logError("Operacao assincrona falhou.", {
      operationName,
      durationMs: completed.durationMs,
      error,
      ...completed.context,
    })
    throw error
  }
}
