"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserCheck, Shield, Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  name: string
  role: "USER" | "ADMIN" | "SUPER_ADMIN" | "TRANSLATOR"
  created_at: string
  updated_at: string
}

interface UserManagementProps {
  onStatsUpdate: () => void
}

export function UserManagement({ onStatsUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("[v0] Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId)

      if (error) throw error

      await loadUsers()
      onStatsUpdate()
      setEditingUser(null)
    } catch (error) {
      console.error("[v0] Error updating user role:", error)
      alert("Erro ao atualizar função do usuário")
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId)
      if (error) throw error

      await loadUsers()
      onStatsUpdate()
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      alert("Erro ao excluir usuário")
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "destructive"
      case "ADMIN":
        return "default"
      case "TRANSLATOR":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return <Shield className="w-3 h-3" />
      case "TRANSLATOR":
        return <UserCheck className="w-3 h-3" />
      default:
        return <Users className="w-3 h-3" />
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleStats = {
    total: users.length,
    admins: users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length,
    translators: users.filter((u) => u.role === "TRANSLATOR").length,
    users: users.filter((u) => u.role === "USER").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h2>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-300">Total</p>
                <p className="text-2xl font-bold text-white">{roleStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm text-gray-300">Admins</p>
                <p className="text-2xl font-bold text-white">{roleStats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-300">Tradutores</p>
                <p className="text-2xl font-bold text-white">{roleStats.translators}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-300">Usuários</p>
                <p className="text-2xl font-bold text-white">{roleStats.users}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Funções</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="TRANSLATOR">Tradutor</SelectItem>
                <SelectItem value="USER">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Carregando usuários...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Nenhum usuário encontrado</div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{user.name || "Nome não informado"}</h3>
                      <p className="text-gray-300">{user.email}</p>
                      <p className="text-gray-500 text-sm">
                        Criado em: {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={getRoleColor(user.role) as any} className="gap-1">
                      {getRoleIcon(user.role)}
                      {user.role === "SUPER_ADMIN"
                        ? "Super Admin"
                        : user.role === "ADMIN"
                          ? "Admin"
                          : user.role === "TRANSLATOR"
                            ? "Tradutor"
                            : "Usuário"}
                    </Badge>

                    {editingUser?.id === user.id ? (
                      <div className="flex gap-2">
                        <Select value={user.role} onValueChange={(value) => updateUserRole(user.id, value)}>
                          <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">Usuário</SelectItem>
                            <SelectItem value="TRANSLATOR">Tradutor</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={() => setEditingUser(null)} size="sm" variant="outline">
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={() => setEditingUser(user)} size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => deleteUser(user.id)} size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
