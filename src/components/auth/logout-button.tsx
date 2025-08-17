"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { useAuthStore } from "@/store/auth"

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  className?: string
}

export default function LogoutButton({ variant = "ghost", size = "sm", className }: LogoutButtonProps) {
  const navigate = useNavigate()
  const supabase = createClient()
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logout realizado com sucesso")
      navigate("/auth/login")
    } catch (error) {
      toast.error("Erro ao fazer logout")
    }
  }

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Sair
    </Button>
  )
}