import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LoginForm from "@/components/auth/login-form"

export default async function LoginPage() {
  const supabase = createClient()

  // Check if user is already authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If authenticated, redirect based on role
  if (user) {
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") {
      redirect("/admin")
    } else if (userData?.role === "TRANSLATOR") {
      redirect("/translator")
    } else {
      redirect("/events")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-white mb-2 text-3xl font-light">Plurall Simultâneo</h1>
          <p className="text-gray-400 text-sm">Sistema de tradução simultânea</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
