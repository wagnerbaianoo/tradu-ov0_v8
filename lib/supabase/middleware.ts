import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, just continue without auth
  if (!isSupabaseConfigured) {
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return request.cookies.getAll()
        },
        async setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/callback"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth pages, redirect based on role
  if (user && (pathname === "/auth/login" || pathname === "/auth/register")) {
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    const url = request.nextUrl.clone()

    if (userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN") {
      url.pathname = "/admin"
    } else if (userData?.role === "TRANSLATOR") {
      url.pathname = "/translator"
    } else {
      url.pathname = "/events"
    }

    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (user) {
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    // Admin routes protection
    if (pathname.startsWith("/admin") && userData?.role !== "ADMIN" && userData?.role !== "SUPER_ADMIN") {
      const url = request.nextUrl.clone()
      url.pathname = "/events"
      return NextResponse.redirect(url)
    }

    // Translator routes protection
    if (pathname.startsWith("/translator") && userData?.role !== "TRANSLATOR") {
      const url = request.nextUrl.clone()
      url.pathname = "/events"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
