"use server"

import { createClient } from "@supabase/supabase-js"

export async function diagnoseSuperAdmin() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const results = {
      database_connection: false,
      user_in_database: false,
      user_in_auth: false,
      login_test: false,
      details: {} as any,
    }

    console.log("[v0] Starting super admin diagnosis...")

    // 1. Test database connection
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1)
      results.database_connection = !error
      results.details.database_error = error?.message
      console.log("[v0] Database connection:", results.database_connection)
    } catch (e) {
      results.details.database_error = e instanceof Error ? e.message : "Unknown error"
      console.log("[v0] Database error:", results.details.database_error)
    }

    // 2. Check if user exists in database
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", "superadmin@translateevent.com")
        .single()
      results.user_in_database = !!data && !error
      results.details.database_user = data
      results.details.database_user_error = error?.message
      console.log("[v0] User in database:", results.user_in_database)
    } catch (e) {
      results.details.database_user_error = e instanceof Error ? e.message : "Unknown error"
    }

    // 3. Check if user exists in Supabase Auth
    try {
      const { data, error } = await supabase.auth.admin.listUsers()
      const authUser = data.users?.find((u) => u.email === "superadmin@translateevent.com")
      results.user_in_auth = !!authUser
      results.details.auth_user = authUser
      results.details.auth_error = error?.message
      console.log("[v0] User in auth:", results.user_in_auth)
    } catch (e) {
      results.details.auth_error = e instanceof Error ? e.message : "Unknown error"
    }

    // 4. Test login
    try {
      const loginClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data, error } = await loginClient.auth.signInWithPassword({
        email: "superadmin@translateevent.com",
        password: "TranslateEvent2024!",
      })
      results.login_test = !!data.user && !error
      results.details.login_error = error?.message
      results.details.login_user = data.user
      console.log("[v0] Login test:", results.login_test)
    } catch (e) {
      results.details.login_error = e instanceof Error ? e.message : "Unknown error"
    }

    return { success: true, results }
  } catch (error) {
    console.log("[v0] Diagnosis error:", error)
    return { error: `Erro no diagnóstico: ${error instanceof Error ? error.message : "Erro desconhecido"}` }
  }
}

export async function resetSuperAdmin() {
  try {
    console.log("[v0] Starting super admin reset...")

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 1. Try to find and delete existing user in Auth
    try {
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users.users?.find((u) => u.email === "superadmin@translateevent.com")

      if (existingUser) {
        console.log("[v0] Deleting existing auth user:", existingUser.id)
        await supabase.auth.admin.deleteUser(existingUser.id)
      }
    } catch (e) {
      console.log("[v0] No existing auth user to delete")
    }

    // 2. Delete from database
    try {
      console.log("[v0] Deleting from database...")
      await supabase.from("users").delete().eq("email", "superadmin@translateevent.com")
    } catch (e) {
      console.log("[v0] No existing database user to delete")
    }

    // 3. Create fresh user
    return await createSuperAdmin({
      email: "superadmin@translateevent.com",
      password: "TranslateEvent2024!",
      name: "Super Administrador",
    })
  } catch (error) {
    console.log("[v0] Reset error:", error)
    return { error: `Erro ao resetar: ${error instanceof Error ? error.message : "Erro desconhecido"}` }
  }
}

export async function createSuperAdmin(data: {
  email: string
  password: string
  name: string
}) {
  try {
    console.log("[v0] Creating super admin:", data.email)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 1. Create user using admin client (no email confirmation needed)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: data.name,
        role: "SUPER_ADMIN",
      },
    })

    if (authError) {
      console.log("[v0] Auth error:", authError.message)
      return { error: `Erro na autenticação: ${authError.message}` }
    }

    if (!authData.user) {
      return { error: "Usuário não foi criado no sistema de autenticação" }
    }

    console.log("[v0] User created in auth:", authData.user.id)

    // 2. Create/update user profile in database
    const { error: profileError } = await supabase.from("users").upsert([
      {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: "SUPER_ADMIN",
        updated_at: new Date().toISOString(),
      },
    ])

    if (profileError) {
      console.log("[v0] Profile error:", profileError.message)
      return { error: `Erro ao criar perfil: ${profileError.message}` }
    }

    console.log("[v0] Super admin created successfully!")

    return {
      success: true,
      message: "Super Administrador criado com sucesso! Você já pode fazer login.",
    }
  } catch (error) {
    console.error("[v0] Setup error:", error)
    return { error: `Erro interno: ${error instanceof Error ? error.message : "Erro desconhecido"}` }
  }
}

export async function checkSuperAdminExists() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data, error } = await supabase.from("users").select("id").eq("role", "SUPER_ADMIN").limit(1)

    if (error) {
      console.log("[v0] Check admin error:", error.message)
      return { error: error.message }
    }

    const exists = data && data.length > 0
    console.log("[v0] Super admin exists:", exists)

    return { exists }
  } catch (error) {
    console.log("[v0] Check admin exception:", error)
    return { error: "Erro ao verificar super admin" }
  }
}
