"use server"

import { createClient } from "@/lib/supabase/client"

export async function createSuperAdmin(data: {
  email: string
  password: string
  name: string
}) {
  try {
    const supabase = createClient()

    // 1. Create user using regular signUp (will need email confirmation)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      console.error('[Setup Auth Error]:', authError)
      return { error: `Erro na autenticação: ${authError.message}` }
    }

    if (!authData.user) {
      return { error: "Usuário não foi criado no sistema de autenticação" }
    }

    // 2. Create user profile in database
    const { error: profileError } = await supabase.from("users").insert([
      {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: "SUPER_ADMIN",
        created_at: new Date().toISOString(),
      },
    ])

    if (profileError) {
      return { error: `Erro ao criar perfil: ${profileError.message}` }
    }

    return {
      success: true,
      message:
        "Super Administrador criado com sucesso! Verifique seu email para confirmar a conta antes de fazer login.",
    }
  } catch (error) {
    console.error("Setup error:", error)
    return { error: "Erro interno do servidor" }
  }
}

export async function checkSuperAdminExists() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("users").select("id").eq("role", "SUPER_ADMIN").limit(1)

    if (error) {
      return { error: error.message }
    }

    return { exists: data && data.length > 0 }
  } catch (error) {
    return { error: "Erro ao verificar super admin" }
  }
}
