"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { signOut } from "@/lib/actions/auth"

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  className?: string
}

export default function LogoutButton({ variant = "ghost", size = "sm", className }: LogoutButtonProps) {
  return (
    <form action={signOut}>
      <Button type="submit" variant={variant} size={size} className={className}>
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </form>
  )
}
