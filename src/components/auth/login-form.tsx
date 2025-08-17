"use client"

import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, Eye, EyeOff, User, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "react-hot-toast"
import { useAuthStore } from "@/store/auth"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const supabase = createClient()
  const { setUser } = useAuthStore()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('[Supabase Login Error]:', error)
        toast.error(error.message)
        return
      }

      if (data.user) {
        // Get user role from database
        const { data: userData } = await supabase.from("users").select("role, name").eq("id", data.user.id).single()

        if (userData) {
          // Update auth store
          setUser({
            id: data.user.id,
            email: data.user.email!,
            name: userData.name,
            role: userData.role
          })

          toast.success(`Bem-vindo, ${userData.name || "Usuário"}!`)

          // Redirect based on role
          switch (userData.role) {
            case "ADMIN":
            case "SUPER_ADMIN":
              navigate("/admin")
              break
            case "TRANSLATOR":
              navigate("/translator")
              break
            default:
              navigate("/events")
          }
        } else {
          setUser({
            id: data.user.id,
            email: data.user.email!,
            role: 'USER'
          })
          navigate("/events")
        }
      }
    } catch (error) {
      toast.error("Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-black/20 backdrop-blur-sm border-white/10">
      <CardHeader className="space-y-1 pb-4">
        <h2 className="text-xl font-light text-white text-center">Entrar</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2.5 transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/auth/register")}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Não tem conta? Cadastre-se
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}