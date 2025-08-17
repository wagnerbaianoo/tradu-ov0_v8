"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function signIn(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Get user role from database
    const { data: userData } = await supabase.from("users").select("role").eq("id", data.user.id).single()

    revalidatePath("/", "layout")

    // Redirect based on role
    if (userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") {
      redirect("/admin")
    } else if (userData?.role === "TRANSLATOR") {
      redirect("/translator")
    } else {
      redirect("/events")
    }
  }

  return { success: true }
}

export async function signUp(prevState: any, formData: FormData) {
  const supabase = createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const role = formData.get("role") as string

  if (!email || !password || !name) {
    return { error: "Todos os campos são obrigatórios" }
  }

  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres" }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Create user profile in database
    const { error: profileError } = await supabase.from("users").insert([
      {
        id: data.user.id,
        email,
        name,
        role: role || "USER",
      },
    ])

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return { error: "Erro ao criar perfil do usuário" }
    }

    return { success: true, message: "Conta criada com sucesso! Verifique seu email." }
  }

  return { error: "Erro desconhecido" }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/auth/login")
}
