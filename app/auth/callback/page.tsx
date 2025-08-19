import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const supabase = createClient()

  if (searchParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code)

    if (!error) {
      // Get user role and redirect accordingly
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

        if (userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") {
          redirect("/admin")
        } else if (userData?.role === "TRANSLATOR") {
          redirect("/translator")
        } else {
          redirect("/events")
        }
      }
    }
  }

  // If there's an error or no code, redirect to login
  redirect("/auth/login")
}
