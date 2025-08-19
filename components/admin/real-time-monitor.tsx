"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, CheckCircle, XCircle, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SystemAlert {
  id: string
  type: "error" | "warning" | "info" | "success"
  message: string
  timestamp: Date
  resolved: boolean
}

interface ServiceStatus {
  name: string
  status: "online" | "offline" | "degraded"
  responseTime: number
  uptime: number
}

export function RealTimeMonitor() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [systemHealth, setSystemHealth] = useState({
    overall: "healthy" as "healthy" | "warning" | "critical",
    score: 100,
    activeConnections: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  })

  const supabase = createClient()

  // Check if Supabase is configured
  if (!supabase) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Monitor em Tempo Real</h2>
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-8 text-center">
            <div className="text-yellow-400 mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Configuração do Supabase Necessária</h3>
            <p className="text-gray-300">Configure as variáveis de ambiente do Supabase</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  useEffect(() => {
    loadSystemStatus()

    // Real-time monitoring every 5 seconds
    const interval = setInterval(loadSystemStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadSystemStatus = async () => {
    try {
      await Promise.all([loadSystemAlerts(), loadServiceStatus(), loadSystemHealth()])
    } catch (error) {
      console.error("[v0] Error loading system status:", error)
    }
  }

  const loadSystemAlerts = async () => {
    // Simulate real-time alerts based on system conditions
    const mockAlerts: SystemAlert[] = [
      {
        id: "1",
        type: "success",
        message: "Sistema de tradução funcionando normalmente",
        timestamp: new Date(),
        resolved: true,
      },
      {
        id: "2",
        type: "info",
        message: "Nova sessão de tradução iniciada - Evento: Conferência Tech 2024",
        timestamp: new Date(Date.now() - 300000),
        resolved: true,
      },
    ]

    // Add warning if high latency detected
    const { data: channels } = await supabase.from("translation_channels").select("*").eq("is_active", true)

    if (channels && channels.length > 10) {
      mockAlerts.unshift({
        id: "3",
        type: "warning",
        message: `Alto número de canais ativos (${channels.length}) - Monitorar performance`,
        timestamp: new Date(),
        resolved: false,
      })
    }

    setAlerts(mockAlerts)
  }

  const loadServiceStatus = async () => {
    const mockServices: ServiceStatus[] = [
      {
        name: "WebRTC Gateway",
        status: "online",
        responseTime: 45 + Math.random() * 20,
        uptime: 99.9,
      },
      {
        name: "Translation Engine",
        status: "online",
        responseTime: 120 + Math.random() * 50,
        uptime: 99.8,
      },
      {
        name: "Audio Processing",
        status: "online",
        responseTime: 30 + Math.random() * 15,
        uptime: 99.95,
      },
      {
        name: "Database",
        status: "online",
        responseTime: 15 + Math.random() * 10,
        uptime: 100,
      },
      {
        name: "Stream Server",
        status: Math.random() > 0.1 ? "online" : "degraded",
        responseTime: 80 + Math.random() * 40,
        uptime: 99.7,
      },
    ]

    setServices(mockServices)
  }

  const loadSystemHealth = async () => {
    try {
      const { data: sessions } = await supabase.from("user_sessions").select("*").is("left_at", null)

      const activeConnections = sessions?.length || 0
      const memoryUsage = 45 + Math.random() * 30 // 45-75%
      const cpuUsage = 25 + Math.random() * 40 // 25-65%

      let overall: "healthy" | "warning" | "critical" = "healthy"
      let score = 100

      if (memoryUsage > 80 || cpuUsage > 80) {
        overall = "warning"
        score = 75
      }
      if (memoryUsage > 90 || cpuUsage > 90) {
        overall = "critical"
        score = 50
      }

      setSystemHealth({
        overall,
        score,
        activeConnections,
        memoryUsage,
        cpuUsage,
      })
    } catch (error) {
      console.error("[v0] Error loading system health:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "offline":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      default:
        return <Activity className="w-4 h-4 text-blue-400" />
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Monitor em Tempo Real</h2>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  systemHealth.overall === "healthy"
                    ? "bg-green-500/20"
                    : systemHealth.overall === "warning"
                      ? "bg-yellow-500/20"
                      : "bg-red-500/20"
                }`}
              >
                <Zap
                  className={`w-5 h-5 ${
                    systemHealth.overall === "healthy"
                      ? "text-green-400"
                      : systemHealth.overall === "warning"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm text-gray-300">Saúde do Sistema</p>
                <p className="text-2xl font-bold text-white">{systemHealth.score}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Conexões Ativas</p>
                <p className="text-2xl font-bold text-white">{systemHealth.activeConnections}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Uso de Memória</p>
                <p className="text-2xl font-bold text-white">{systemHealth.memoryUsage.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Uso de CPU</p>
                <p className="text-2xl font-bold text-white">{systemHealth.cpuUsage.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Status */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Status dos Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="text-white font-medium">{service.name}</p>
                      <p className="text-gray-400 text-sm">Uptime: {service.uptime}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{service.responseTime.toFixed(0)}ms</p>
                    <Badge
                      variant={
                        service.status === "online"
                          ? "default"
                          : service.status === "degraded"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {service.status === "online" ? "Online" : service.status === "degraded" ? "Degradado" : "Offline"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Alertas do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-white text-sm">{alert.message}</p>
                    <p className="text-gray-400 text-xs mt-1">{alert.timestamp.toLocaleTimeString()}</p>
                  </div>
                  {alert.resolved && (
                    <Badge variant="outline" className="text-xs">
                      Resolvido
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
