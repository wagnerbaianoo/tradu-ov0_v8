import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Lê as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verifica se as variáveis estão configuradas
export const isSupabaseConfigured = 
  typeof supabaseUrl === "string" && 
  supabaseUrl.length > 0 && 
  !supabaseUrl.includes("SEU_PROJETO") &&
  typeof supabaseAnonKey === "string" && 
  supabaseAnonKey.length > 0 && 
  !supabaseAnonKey.includes("SEU_ANON_KEY")

// Função auxiliar para retry em fetch
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(5000), // timeout de 5s
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}

// Criação do client com tratamento para SSR e Client
export const createClient = () => {
  // Se não configurado e rodando no SSR
  if (!isSupabaseConfigured && typeof window === "undefined") {
    console.warn("⚠️ Supabase não configurado no servidor (SSR)")
    return null
  }

  // Se não configurado e rodando no Client
  if (!isSupabaseConfigured && typeof window !== "undefined") {
    throw new Error("Supabase is not configured. Please check your environment variables.")
  }

  // Se configurado, criar e retornar o cliente
  return createSupabaseClient(supabaseUrl!, supabaseAnonKey!, {
    global: { fetch: fetchWithRetry }
  })
}

// Singleton para uso no Client (com verificação)
export const supabase = 
  typeof window !== "undefined" && isSupabaseConfigured
    ? createSupabaseClient(supabaseUrl!, supabaseAnonKey!, {
        global: { fetch: fetchWithRetry }
      })
    : null