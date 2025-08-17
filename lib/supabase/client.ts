import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create a singleton instance of the Supabase client
export const supabase = isSupabaseConfigured
  ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  : null

export const createClient = () => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase environment variables not found, using fallback configuration")
    return createSupabaseClient(
      "https://eozbqzajqtortjugyyvm.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvemJxemFqcXRvcnRqdWd5eXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTQ0NzksImV4cCI6MjA3MDk3MDQ3OX0.t9CKaYIF2jR232NCo8H5ANros07ZTvY7jXgc9Ba4XeA"
    )
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
