"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Radio, Activity, Globe, Settings, Mic } from "lucide-react"
import { EventManagement } from "@/components/admin/event-management"
import { StreamManagement } from "@/components/admin/stream-management"
import { AudioCaptureManager } from "@/components/admin/audio-capture-manager"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { UserManagement } from "@/components/admin/user-management"
import { SystemSettings } from "@/components/admin/system-settings"
import { RealTimeMonitor } from "@/components/admin/real-time-monitor"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 12,
    activeEvents: 3,
    totalStreams: 8,
    activeTranslators: 5,
    totalUsers: 247,
  })
  const [loading, setLoading] = useState(false)

  const currentUser = {
    name: "Administrador Demo",
    role: "SUPER_ADMIN",
    email: "admin@demo.com",
  }

  const loadDashboardStats = async () => {
    // Dados de demonstração - sem necessidade de carregar do banco
    setStats({
      totalEvents: 12 + Math.floor(Math.random() * 5),
      activeEvents: 3 + Math.floor(Math.random() * 3),
      totalStreams: 8 + Math.floor(Math.random() * 4),
      activeTranslators: 5 + Math.floor(Math.random() * 8),
      totalUsers: 247 + Math.floor(Math.random() * 50),
    })
  }

  useEffect(() => {
    loadDashboardStats()
    const interval = setInterval(loadDashboardStats, 30000) // Atualiza a cada 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-gray-300">TranslateEvent V5 - Sistema de Gestão (Modo Demo)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-white font-medium">{currentUser.name}</p>
                  <p className="text-gray-400 text-sm">{currentUser.role}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500/20 text-green-300">
                <Activity className="w-3 h-3 mr-1" />
                Sistema Online
              </Badge>
              <a href="/" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">
                Voltar ao Início
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Eventos</p>
                  <p className="text-2xl font-bold text-white">{loading ? "..." : stats.totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Eventos Ativos</p>
                  <p className="text-2xl font-bold text-white">{loading ? "..." : stats.activeEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Radio className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Streams</p>
                  <p className="text-2xl font-bold text-white">{loading ? "..." : stats.totalStreams}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Globe className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Tradutores Ativos</p>
                  <p className="text-2xl font-bold text-white">{loading ? "..." : stats.activeTranslators}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Usuários</p>
                  <p className="text-2xl font-bold text-white">{loading ? "..." : stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-black/40 border-white/20">
            <TabsTrigger value="events" className="text-white data-[state=active]:bg-purple-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="streams" className="text-white data-[state=active]:bg-purple-600">
              <Radio className="w-4 h-4 mr-2" />
              Streams
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-white data-[state=active]:bg-purple-600">
              <Mic className="w-4 h-4 mr-2" />
              Áudio
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-purple-600">
              <Activity className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-600">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-purple-600">
              <Settings className="w-4 h-4 mr-2" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="monitor" className="text-white data-[state=active]:bg-purple-600">
              <Activity className="w-4 h-4 mr-2" />
              Monitor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-6">
            <EventManagement onStatsUpdate={loadDashboardStats} />
          </TabsContent>

          <TabsContent value="streams" className="mt-6">
            <StreamManagement onStatsUpdate={loadDashboardStats} />
          </TabsContent>

          <TabsContent value="audio" className="mt-6">
            <AudioCaptureManager />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement onStatsUpdate={loadDashboardStats} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="monitor" className="mt-6">
            <RealTimeMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
