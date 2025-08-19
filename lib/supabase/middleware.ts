import { createClient } from "@supabase/supabase-js"
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

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const token = request.cookies.get("sb-access-token")?.value

  let user = null
  if (token) {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser(token)
      user = authUser
    } catch (error) {
      console.error("Auth error:", error)
    }
  }

  const { pathname } = request.nextUrl

  if (pathname === "/setup/create-admin") {
    // Allow access to setup page if no admin exists
    try {
      const { data: adminExists } = await supabase
        .from("users")
        .select("id")
        .in("role", ["ADMIN", "SUPER_ADMIN"])
        .limit(1)
        .single()

      if (!adminExists) {
        return NextResponse.next({ request })
      } else {
        // If admin exists, redirect to login
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // If error checking admin, allow access to setup
      return NextResponse.next({ request })
    }
  }

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
    try {
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
    } catch (error) {
      console.error("Error getting user role:", error)
      return NextResponse.next({ request })
    }
  }

  // Role-based route protection
  if (user) {
    try {
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
    } catch (error) {
      console.error("Error checking user permissions:", error)
    }
  }

  return NextResponse.next({ request })
}
