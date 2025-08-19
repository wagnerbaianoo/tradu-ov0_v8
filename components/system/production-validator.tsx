"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ValidationCheck {
  name: string
  status: "pass" | "fail" | "warning" | "checking"
  message: string
  critical: boolean
}

export function ProductionValidator() {
  const [checks, setChecks] = useState<ValidationCheck[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [overallStatus, setOverallStatus] = useState<"healthy" | "warning" | "critical">("healthy")

  const supabase = createClient()

  useEffect(() => {
    runValidation()
  }, [])

  const runValidation = async () => {
    setIsRunning(true)
    const validationChecks: ValidationCheck[] = []

    try {
      // Check database connection
      validationChecks.push(await checkDatabaseConnection())

      // Check authentication system
      validationChecks.push(await checkAuthenticationSystem())

      // Check required tables
      validationChecks.push(await checkRequiredTables())

      // Check environment variables
      validationChecks.push(await checkEnvironmentVariables())

      // Check system permissions
      validationChecks.push(await checkSystemPermissions())

      // Check WebRTC configuration
      validationChecks.push(await checkWebRTCConfiguration())

      // Check stream services
      validationChecks.push(await checkStreamServices())

      setChecks(validationChecks)

      // Determine overall status
      const criticalFailures = validationChecks.filter((c) => c.critical && c.status === "fail")
      const warnings = validationChecks.filter((c) => c.status === "warning")

      if (criticalFailures.length > 0) {
        setOverallStatus("critical")
      } else if (warnings.length > 0) {
        setOverallStatus("warning")
      } else {
        setOverallStatus("healthy")
      }
    } catch (error) {
      console.error("[v0] Validation error:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const checkDatabaseConnection = async (): Promise<ValidationCheck> => {
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1)

      if (error) throw error

      return {
        name: "Conexão com Banco de Dados",
        status: "pass",
        message: "Conexão estabelecida com sucesso",
        critical: true,
      }
    } catch (error) {
      return {
        name: "Conexão com Banco de Dados",
        status: "fail",
        message: `Falha na conexão: ${error}`,
        critical: true,
      }
    }
  }

  const checkAuthenticationSystem = async (): Promise<ValidationCheck> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      return {
        name: "Sistema de Autenticação",
        status: session ? "pass" : "warning",
        message: session ? "Sistema funcionando corretamente" : "Nenhuma sessão ativa (normal para admin)",
        critical: false,
      }
    } catch (error) {
      return {
        name: "Sistema de Autenticação",
        status: "fail",
        message: `Erro no sistema de auth: ${error}`,
        critical: true,
      }
    }
  }

  const checkRequiredTables = async (): Promise<ValidationCheck> => {
    try {
      const requiredTables = ["users", "events", "streams", "translation_channels", "user_sessions"]
      const tableChecks = await Promise.all(
        requiredTables.map(async (table) => {
          const { error } = await supabase.from(table).select("*").limit(1)
          return { table, exists: !error }
        }),
      )

      const missingTables = tableChecks.filter((t) => !t.exists).map((t) => t.table)

      if (missingTables.length === 0) {
        return {
          name: "Tabelas do Banco",
          status: "pass",
          message: "Todas as tabelas necessárias existem",
          critical: true,
        }
      } else {
        return {
          name: "Tabelas do Banco",
          status: "fail",
          message: `Tabelas faltando: ${missingTables.join(", ")}`,
          critical: true,
        }
      }
    } catch (error) {
      return {
        name: "Tabelas do Banco",
        status: "fail",
        message: `Erro ao verificar tabelas: ${error}`,
        critical: true,
      }
    }
  }

  const checkEnvironmentVariables = async (): Promise<ValidationCheck> => {
    const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

    const missingVars = requiredEnvVars.filter((varName) => {
      return !process.env[varName]
    })

    if (missingVars.length === 0) {
      return {
        name: "Variáveis de Ambiente",
        status: "pass",
        message: "Todas as variáveis necessárias estão configuradas",
        critical: true,
      }
    } else {
      return {
        name: "Variáveis de Ambiente",
        status: "fail",
        message: `Variáveis faltando: ${missingVars.join(", ")}`,
        critical: true,
      }
    }
  }

  const checkSystemPermissions = async (): Promise<ValidationCheck> => {
    try {
      // Test basic CRUD operations
      const now = new Date().toISOString()
      const testData = {
        name: "Test Event",
        description: "System validation test",
        start_time: now,
        end_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        is_active: false,
      }

      const { data, error } = await supabase.from("events").insert(testData).select().single()

      if (error) throw error

      // Clean up test data
      await supabase.from("events").delete().eq("id", data.id)

      return {
        name: "Permissões do Sistema",
        status: "pass",
        message: "Operações CRUD funcionando corretamente",
        critical: true,
      }
    } catch (error) {
      return {
        name: "Permissões do Sistema",
        status: "fail",
        message: `Erro nas permissões: ${error}`,
        critical: true,
      }
    }
  }

  const checkWebRTCConfiguration = async (): Promise<ValidationCheck> => {
    try {
      // Check if WebRTC is supported
      const hasWebRTC = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection)

      if (hasWebRTC) {
        return {
          name: "Configuração WebRTC",
          status: "pass",
          message: "WebRTC suportado pelo navegador",
          critical: false,
        }
      } else {
        return {
          name: "Configuração WebRTC",
          status: "warning",
          message: "WebRTC não suportado neste navegador",
          critical: false,
        }
      }
    } catch (error) {
      return {
        name: "Configuração WebRTC",
        status: "fail",
        message: `Erro ao verificar WebRTC: ${error}`,
        critical: false,
      }
    }
  }

  const checkStreamServices = async (): Promise<ValidationCheck> => {
    try {
      const { data: streams } = await supabase.from("streams").select("*").eq("enabled", true)

      return {
        name: "Serviços de Stream",
        status: "pass",
        message: `${streams?.length || 0} streams configurados`,
        critical: false,
      }
    } catch (error) {
      return {
        name: "Serviços de Stream",
        status: "warning",
        message: `Erro ao verificar streams: ${error}`,
        critical: false,
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case "fail":
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return <Badge className="bg-green-500/20 text-green-300">Aprovado</Badge>
      case "warning":
        return <Badge className="bg-yellow-500/20 text-yellow-300">Atenção</Badge>
      case "fail":
        return <Badge className="bg-red-500/20 text-red-300">Falhou</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-300">Verificando</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Validação de Produção</h2>
          <p className="text-gray-300">Verificação de integridade do sistema</p>
        </div>
        <Button onClick={runValidation} disabled={isRunning} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
          {isRunning ? "Verificando..." : "Executar Validação"}
        </Button>
      </div>

      {/* Overall Status */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full ${
                overallStatus === "healthy"
                  ? "bg-green-500/20"
                  : overallStatus === "warning"
                    ? "bg-yellow-500/20"
                    : "bg-red-500/20"
              }`}
            >
              {overallStatus === "healthy" ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : overallStatus === "warning" ? (
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {overallStatus === "healthy"
                  ? "Sistema Saudável"
                  : overallStatus === "warning"
                    ? "Atenção Necessária"
                    : "Problemas Críticos"}
              </h3>
              <p className="text-gray-300">
                {checks.filter((c) => c.status === "pass").length} de {checks.length} verificações aprovadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Resultados da Validação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="text-white font-medium">{check.name}</p>
                    <p className="text-gray-400 text-sm">{check.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {check.critical && (
                    <Badge variant="outline" className="text-xs">
                      Crítico
                    </Badge>
                  )}
                  {getStatusBadge(check.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
