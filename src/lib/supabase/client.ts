import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eozbqzajqtortjugyyvm.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvemJxemFqcXRvcnRqdWd5eXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTQ0NzksImV4cCI6MjA3MDk3MDQ3OX0.t9CKaYIF2jR232NCo8H5ANros07ZTvY7jXgc9Ba4XeA'

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Export singleton instance for convenience
export const supabase = createClient()