"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function signIn(prevState: any, formData: FormData) {
  const supabase = createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" }
  }

  console.log("[v0] Attempting login for:", email)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    });

  if (error) {
    console.log("[v0] Login error:", error.message)
    return { error: error.message }
  }

  if (data.user) {
    console.log("[v0] User authenticated:", data.user.id)

    const { data: userData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle()

    if (roleError) {
      console.log("[v0] Role check error:", roleError.message)
      // Se não encontrar o usuário na tabela, criar o perfil
      const { error: insertError } = await supabase.from("users").insert([
        {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split("@")[0],
          role: "USER",
        },
      ])

      if (insertError) {
        console.log("[v0] Profile creation error:", insertError.message)
        return { error: "Erro ao criar perfil do usuário" }
      }
    }

    const cookieStore = cookies()
    if (data.session) {
      cookieStore.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.session.expires_in,
      })
      cookieStore.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    revalidatePath("/", "layout")

    console.log("[v0] User role:", userData?.role)

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

  console.log("[v0] Creating user:", email, "with role:", role)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        name: name,
      },
    },
  })

  if (error) {
    console.log("[v0] Signup error:", error.message)
    return { error: error.message }
  }

  if (data.user) {
    console.log("[v0] User created in Auth:", data.user.id)

    const { error: profileError } = await supabase.from("users").insert([
      {
        id: data.user.id,
        email,
        name,
        role: role || "USER",
      },
    ])

    if (profileError) {
      console.error("[v0] Profile creation error:", profileError)
      // Tentar deletar o usuário do Auth se falhou criar o perfil
      try {
        await supabase.auth.admin.deleteUser(data.user.id)
      } catch (deleteError) {
        console.error("[v0] Failed to cleanup user:", deleteError)
      }
      return { error: "Erro ao criar perfil do usuário" }
    }

    console.log("[v0] User profile created successfully")
    return { success: true, message: "Conta criada com sucesso! Verifique seu email." }
  }

  return { error: "Erro desconhecido" }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/auth/login")
}
