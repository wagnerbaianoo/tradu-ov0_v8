import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Create admin client
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create regular client
    const regularClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Configurada" : "✗ Não configurada",
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Configurada" : "✗ Não configurada",
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Configurada" : "✗ Não configurada",
      },
      database: {},
      auth: {},
      syncAnalysis: {},
      recommendations: [] as string[],
    }

    // Check database connection and users table
    try {
      const { data: users, error: usersError } = await regularClient
        .from("users")
        .select("id, email, role, created_at")
        .eq("role", "SUPER_ADMIN")

      diagnostic.database = {
        connection: usersError ? `✗ Erro: ${usersError.message}` : "✓ Conectado",
        superAdmins: users ? users.length : 0,
        superAdminData: users || [],
      }
    } catch (error) {
      diagnostic.database = {
        connection: `✗ Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      }
    }

    // Check auth users
    let superAdminAuth = null
    try {
      const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()

      if (authError) {
        diagnostic.auth = {
          connection: `✗ Erro: ${authError.message}`,
        }
      } else {
        superAdminAuth = authUsers.users.find((u) => u.email === "superadmin@translateevent.com")
        diagnostic.auth = {
          connection: "✓ Conectado",
          totalUsers: authUsers.users.length,
          superAdminExists: superAdminAuth ? "✓ Existe" : "✗ Não existe",
          superAdminData: superAdminAuth
            ? {
                id: superAdminAuth.id,
                email: superAdminAuth.email,
                emailConfirmed: superAdminAuth.email_confirmed_at ? "✓ Confirmado" : "✗ Não confirmado",
                createdAt: superAdminAuth.created_at,
                lastSignIn: superAdminAuth.last_sign_in_at,
              }
            : null,
        }
      }
    } catch (error) {
      diagnostic.auth = {
        connection: `✗ Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      }
    }

    const dbHasAdmin = diagnostic.database.superAdmins > 0
    const authHasAdmin = !!superAdminAuth

    diagnostic.syncAnalysis = {
      databaseHasAdmin: dbHasAdmin,
      authHasAdmin: authHasAdmin,
      inSync: dbHasAdmin === authHasAdmin,
      issue:
        !dbHasAdmin && !authHasAdmin
          ? "Nenhum admin existe"
          : dbHasAdmin && !authHasAdmin
            ? "Admin existe no DB mas não no Auth"
            : !dbHasAdmin && authHasAdmin
              ? "Admin existe no Auth mas não no DB"
              : "Sistemas sincronizados",
    }

    // Test login attempt
    try {
      const { data: loginData, error: loginError } = await regularClient.auth.signInWithPassword({
        email: "superadmin@translateevent.com",
        password: "TranslateEvent2024!",
      })

      diagnostic.loginTest = {
        result: loginError ? `✗ Erro: ${loginError.message}` : "✓ Login bem-sucedido",
        userId: loginData.user?.id || null,
        errorCode: loginError?.message?.includes("Invalid login credentials") ? "INVALID_CREDENTIALS" : null,
      }

      // Sign out immediately if login was successful
      if (loginData.user) {
        await regularClient.auth.signOut()
      }
    } catch (error) {
      diagnostic.loginTest = {
        result: `✗ Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      }
    }

    if (!diagnostic.syncAnalysis.inSync) {
      if (!dbHasAdmin && !authHasAdmin) {
        diagnostic.recommendations.push("Execute 'Criar Super Admin' para criar o primeiro administrador")
      } else if (dbHasAdmin && !authHasAdmin) {
        diagnostic.recommendations.push(
          "Execute 'Resetar e Recriar Admin' - usuário existe no banco mas não no sistema de autenticação",
        )
      } else if (!dbHasAdmin && authHasAdmin) {
        diagnostic.recommendations.push(
          "Execute 'Resetar e Recriar Admin' - usuário existe no sistema de autenticação mas não no banco",
        )
      }
    } else if (diagnostic.loginTest.errorCode === "INVALID_CREDENTIALS") {
      diagnostic.recommendations.push(
        "Execute 'Resetar e Recriar Admin' - credenciais inválidas mesmo com usuário existente",
      )
    } else if (diagnostic.loginTest.result.includes("✓")) {
      diagnostic.recommendations.push("Sistema funcionando corretamente! Você pode fazer login normalmente")
    }

    return NextResponse.json(diagnostic)
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    })
  }
}
