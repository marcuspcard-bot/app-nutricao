import * as Linking from "expo-linking"
import * as WebBrowser from "expo-web-browser"
import { hasSupabaseConfig, supabase } from "./supabaseClient"

WebBrowser.maybeCompleteAuthSession()

const callbackPath = "auth/callback"
const appScheme = "appnutricao"

function getRedirectUrl() {
  return Linking.createURL(callbackPath, { scheme: appScheme })
}

function readParams(segment = "") {
  return Array.from(new URLSearchParams(segment).entries()).reduce((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})
}

function parseAuthResponse(url) {
  const [baseUrl, hashFragment = ""] = url.split("#")
  const queryString = baseUrl.includes("?") ? baseUrl.split("?")[1] : ""

  return {
    ...readParams(queryString),
    ...readParams(hashFragment),
  }
}

export function getGoogleRedirectUrl() {
  return getRedirectUrl()
}

export async function signInWithGoogle() {
  if (!hasSupabaseConfig || !supabase) {
    return {
      session: null,
      error: new Error("Conexao com o Supabase nao configurada."),
      cancelled: false,
      redirectTo: getRedirectUrl(),
    }
  }

  const redirectTo = getRedirectUrl()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  if (error || !data?.url) {
    return {
      session: null,
      error: error ?? new Error("Nao foi possivel iniciar o login com Google."),
      cancelled: false,
      redirectTo,
    }
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

  if (result.type !== "success" || !result.url) {
    return {
      session: null,
      error: null,
      cancelled: true,
      redirectTo,
    }
  }

  const params = parseAuthResponse(result.url)
  if (params.error || params.error_description) {
    return {
      session: null,
      error: new Error(params.error_description ?? params.error),
      cancelled: false,
      redirectTo,
    }
  }

  if (params.code) {
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code)
    return {
      session: sessionData.session ?? null,
      error: exchangeError,
      cancelled: false,
      redirectTo,
    }
  }

  if (params.access_token && params.refresh_token) {
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    })

    return {
      session: sessionData.session ?? null,
      error: sessionError,
      cancelled: false,
      redirectTo,
    }
  }

  return {
    session: null,
    error: new Error("Callback do Google recebido, mas a sessao nao veio no retorno."),
    cancelled: false,
    redirectTo,
  }
}
