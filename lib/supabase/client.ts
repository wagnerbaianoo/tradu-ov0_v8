import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Verifica se as variáveis de ambiente estão configuradas corretamente
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("SEU_PROJETO") &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0 &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("SEU_ANON_KEY")

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
  // Caso esteja no SSR e não configurado -> não quebra
  if (typeof window === "undefined" && !isSupabaseConfigured) {
    console.warn("⚠️ Supabase não configurado no servidor (SSR)")
    return null
  }

  // Caso esteja no client e não configurado -> erro explícito
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Please check your environment variables."
    )
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: fetchWithRetry } }
  )
}

// Singleton para uso no Client
export const supabase =
  typeof window !== "undefined" && isSupabaseConfigured
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { fetch: fetchWithRetry } }
      )
    : null
