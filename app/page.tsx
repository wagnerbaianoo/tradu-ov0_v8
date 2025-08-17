import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user role and redirect accordingly
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") {
    redirect("/admin")
  } else if (userData?.role === "TRANSLATOR") {
    redirect("/translator")
  } else {
    redirect("/events")
  }
}
