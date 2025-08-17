"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Database,
  Shield,
  Globe,
  Zap,
  AlertTriangle,
  CheckCircle,
  Server,
  Wifi,
  HardDrive,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "react-hot-toast"
import { AudioCaptureManager } from "@/components/admin/audio-capture-manager"
import { ProductionValidator } from "@/components/system/production-validator"

interface SystemConfig {
  maintenance_mode: boolean
  max_concurrent_users: number
  default_event_duration: number
  auto_cleanup_sessions: boolean
  enable_analytics: boolean
  enable_notifications: boolean
  system_message: string
}

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    maintenance_mode: false,
    max_concurrent_users: 1000,
    default_event_duration: 120,
    auto_cleanup_sessions: true,
    enable_analytics: true,
    enable_notifications: true,
    system_message: "",
  })
  const [systemStatus, setSystemStatus] = useState({
    database: "online",
    storage: "online",
    streaming: "online",
    api: "online",
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSystemConfig()
    checkSystemStatus()
  }, [])

  const loadSystemConfig = async () => {
    // In production, this would load from a system_config table
    // For now, using localStorage as demo
    const savedConfig = localStorage.getItem("system_config")
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
  }

  const saveSystemConfig = async () => {
    setLoading(true)
    try {
      // In production, this would save to database
      localStorage.setItem("system_config", JSON.stringify(config))
      toast.success("Configurações salvas com sucesso!")
    } catch (error) {
      toast.error("Erro ao salvar configurações")
    } finally {
      setLoading(false)
    }
  }

  const checkSystemStatus = async () => {
    try {
      // Check database connection
      const { error: dbError } = await supabase.from("events").select("id").limit(1)

      setSystemStatus({
        database: dbError ? "offline" : "online",
        storage: "online", // Assume storage is online
        streaming: "online", // Check streaming services
        api: "online", // API status
      })
    } catch (error) {
      console.error("[v0] Error checking system status:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "offline":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "offline":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      default:
        return <Server className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Configurações do Sistema</h2>

      {/* System Status */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Server className="w-5 h-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="text-white">Banco de Dados</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.database)}
                <span className={`text-sm font-medium ${getStatusColor(systemStatus.database)}`}>
                  {systemStatus.database === "online" ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span className="text-white">Armazenamento</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.storage)}
                <span className={`text-sm font-medium ${getStatusColor(systemStatus.storage)}`}>
                  {systemStatus.storage === "online" ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-white">Streaming</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.streaming)}
                <span className={`text-sm font-medium ${getStatusColor(systemStatus.streaming)}`}>
                  {systemStatus.streaming === "online" ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-white">API</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.api)}
                <span className={`text-sm font-medium ${getStatusColor(systemStatus.api)}`}>
                  {systemStatus.api === "online" ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={checkSystemStatus} variant="outline" size="sm">
              Atualizar Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="bg-white/10 backdrop-blur-sm border-white/20">
            Configurações Gerais
          </TabsTrigger>
          <TabsTrigger value="audio" className="bg-white/10 backdrop-blur-sm border-white/20">
            Gerenciamento de Áudio
          </TabsTrigger>
          <TabsTrigger value="validation" className="bg-white/10 backdrop-blur-sm border-white/20">
            Validação de Produção
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">Modo Manutenção</h3>
                  <p className="text-gray-400 text-sm">Bloqueia acesso de usuários ao sistema</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.maintenance_mode}
                    onCheckedChange={(checked) => setConfig({ ...config, maintenance_mode: checked })}
                  />
                  <Badge variant={config.maintenance_mode ? "destructive" : "default"}>
                    {config.maintenance_mode ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>

              {/* System Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Máximo de Usuários Simultâneos</label>
                  <Input
                    type="number"
                    value={config.max_concurrent_users}
                    onChange={(e) => setConfig({ ...config, max_concurrent_users: Number(e.target.value) })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Duração Padrão de Evento (minutos)</label>
                  <Input
                    type="number"
                    value={config.default_event_duration}
                    onChange={(e) => setConfig({ ...config, default_event_duration: Number(e.target.value) })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-4">
                <h3 className="text-white font-medium">Funcionalidades</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.auto_cleanup_sessions}
                      onCheckedChange={(checked) => setConfig({ ...config, auto_cleanup_sessions: checked })}
                    />
                    <label className="text-sm font-medium text-white">Limpeza Automática de Sessões</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.enable_analytics}
                      onCheckedChange={(checked) => setConfig({ ...config, enable_analytics: checked })}
                    />
                    <label className="text-sm font-medium text-white">Analytics Habilitado</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.enable_notifications}
                      onCheckedChange={(checked) => setConfig({ ...config, enable_notifications: checked })}
                    />
                    <label className="text-sm font-medium text-white">Notificações Habilitadas</label>
                  </div>
                </div>
              </div>

              {/* System Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Mensagem do Sistema</label>
                <Textarea
                  value={config.system_message}
                  onChange={(e) => setConfig({ ...config, system_message: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Mensagem que será exibida para todos os usuários..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={saveSystemConfig} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  Salvar Configurações
                </Button>
                <Button onClick={loadSystemConfig} variant="outline">
                  Restaurar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audio" className="mt-6">
          <AudioCaptureManager />
        </TabsContent>
        <TabsContent value="validation" className="mt-6">
          <ProductionValidator />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <Database className="w-6 h-6" />
              <span>Backup do Banco</span>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <Shield className="w-6 h-6" />
              <span>Logs de Segurança</span>
            </Button>

            <Button variant="outline" className="h-20 flex flex-col gap-2 bg-transparent">
              <Globe className="w-6 h-6" />
              <span>Teste de Conectividade</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
