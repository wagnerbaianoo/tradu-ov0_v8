"use server"

import { createClient } from "@/lib/supabase/client"

export async function createSuperAdmin(data: {
  email: string
  password: string
  name: string
}) {
  try {
    const supabase = createClient()

    // Call the Edge Function to create super admin
    const { data: result, error } = await supabase.functions.invoke('create-super-admin', {
      body: {
        email: data.email,
        password: data.password,
        name: data.name
      }
    })

    if (error) {
      console.error('[Setup Edge Function Error]:', error)
      return { error: `Erro na criação: ${error.message}` }
    }

    if (result?.error) {
      return { error: result.error }
    }

    return {
      success: true,
      message: result?.message || "Super Administrador criado com sucesso! Você já pode fazer login."
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
