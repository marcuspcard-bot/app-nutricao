const appSessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
let logSequence = 0

function normalizeError(error) {
  if (!error) return null

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: typeof error === "string" ? error : JSON.stringify(error),
  }
}

function sanitizeValue(value, depth = 0) {
  if (depth > 3) return "[max-depth]"
  if (value == null) return value
  if (typeof value === "function") return "[function]"
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) return normalizeError(value)

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1))
  }

  if (typeof value === "object") {
    return Object.entries(value).reduce((accumulator, [key, currentValue]) => {
      accumulator[key] = sanitizeValue(currentValue, depth + 1)
      return accumulator
    }, {})
  }

  return value
}

function buildLogPayload(level, message, context) {
  logSequence += 1

  return {
    level,
    message,
    context: sanitizeValue(context),
    timestamp: new Date().toISOString(),
    sessionId: appSessionId,
    sequence: logSequence,
    platform: "mobile",
  }
}

function writeLog(method, level, message, context = {}) {
  console[method]("[app]", buildLogPayload(level, message, context))
}

export function logInfo(message, context = {}) {
  writeLog("info", "info", message, context)
}

export function logWarn(message, context = {}) {
  writeLog("warn", "warn", message, context)
}

export function logError(message, context = {}) {
  writeLog("error", "error", message, context)
}

export function logPerformance(message, context = {}) {
  writeLog("info", "performance", message, {
    ...context,
    kind: "performance",
  })
}

export function getLoggerSessionId() {
  return appSessionId
}
