import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if variables are properly configured
export const isSupabaseConfigured = 
  typeof supabaseUrl === "string" && 
  supabaseUrl.length > 0 && 
  !supabaseUrl.includes("SEU_PROJETO") &&
  typeof supabaseAnonKey === "string" && 
  supabaseAnonKey.length > 0 && 
  !supabaseAnonKey.includes("SEU_ANON_KEY")

// Helper function for fetch retry
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(5000), // 5s timeout
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

// Create client with SSR and Client-side handling
export const createClient = () => {
  // If not configured and running on SSR
  if (!isSupabaseConfigured && typeof window === "undefined") {
    console.warn("⚠️ Supabase not configured on server (SSR)")
    return null
  }

  // If not configured and running on Client
  if (!isSupabaseConfigured && typeof window !== "undefined") {
    throw new Error("Supabase is not configured. Please check your environment variables.")
  }

  // If configured, create and return client
  return createSupabaseClient(supabaseUrl!, supabaseAnonKey!, {
    global: { fetch: fetchWithRetry }
  })
}

// Singleton for Client usage (with verification)