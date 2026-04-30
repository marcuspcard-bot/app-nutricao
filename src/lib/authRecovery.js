import * as Linking from "expo-linking"

const callbackPath = "auth/callback"
const appScheme = "appnutricao"

function readParams(segment = "") {
  return Array.from(new URLSearchParams(segment).entries()).reduce((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})
}

export function getAuthRedirectUrl() {
  return Linking.createURL(callbackPath, { scheme: appScheme })
}

export function parseAuthCallbackUrl(url = "") {
  const [baseUrl, hashFragment = ""] = String(url).split("#")
  const queryString = baseUrl.includes("?") ? baseUrl.split("?")[1] : ""

  return {
    ...readParams(queryString),
    ...readParams(hashFragment),
  }
}

export function isRecoveryCallback(url = "") {
  const params = parseAuthCallbackUrl(url)
  return params.type === "recovery"
}
