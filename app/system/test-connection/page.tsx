"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Shield, Globe } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TestResult {
  name: string
  status: "pass" | "fail" | "testing"
  message: string
  details?: any
}

export default function TestConnectionPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [overallStatus, setOverallStatus] = useState<"healthy" | "warning" | "critical">("healthy")

  const runConnectionTests = async () => {
    setIsRunning(true)
    const testResults: TestResult[] = []

    // Test 1: Environment Variables
    testResults.push({
      name: "Variáveis de Ambiente",
      status: "testing",
      message: "Verificando configuração...",
    })
    setResults([...testResults])

    const envTest = await testEnvironmentVariables()
    testResults[0] = envTest
    setResults([...testResults])

    // Test 2: Database Connection
    testResults.push({
      name: "Conexão com Banco de Dados",
      status: "testing",
      message: "Testando conexão...",
    })
    setResults([...testResults])

    const dbTest = await testDatabaseConnection()
    testResults[1] = dbTest
    setResults([...testResults])

    // Test 3: Authentication System
    testResults.push({
      name: "Sistema de Autenticação",
      status: "testing",
      message: "Verificando auth...",
    })
    setResults([...testResults])

    const authTest = await testAuthenticationSystem()
    testResults[2] = authTest
    setResults([...testResults])

    // Test 4: Tables Structure
    testResults.push({
      name: "Estrutura das Tabelas",
      status: "testing",
      message: "Verificando tabelas...",
    })
    setResults([...testResults])

    const tablesTest = await testTablesStructure()
    testResults[3] = tablesTest
    setResults([...testResults])

    // Determine overall status
    const failures = testResults.filter(r => r.status === "fail")
    if (failures.length > 0) {
      setOverallStatus("critical")
    } else {
      setOverallStatus("healthy")
    }

    setIsRunning(false)
  }

  const testEnvironmentVariables = async (): Promise<TestResult> => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        return {
          name: "Variáveis de Ambiente",
          status: "fail",
          message: "Variáveis NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas",
          details: {
            url_configured: !!supabaseUrl,
            key_configured: !!supabaseKey,
          }
        }
      }

      if (supabaseUrl.includes("your-project") || supabaseKey.includes("your-anon-key")) {
        return {
          name: "Variáveis de Ambiente",
          status: "fail",
          message: "Variáveis contêm valores padrão. Configure com valores reais do Supabase.",
          details: {
            url: supabaseUrl,
            key_is_default: supabaseKey.includes("your-anon-key"),
          }
        }
      }

      return {
        name: "Variáveis de Ambiente",
        status: "pass",
        message: "Variáveis configuradas corretamente",
        details: {
          url: supabaseUrl,
          key_length: supabaseKey.length,
        }
      }
    } catch (error) {
      return {
        name: "Variáveis de Ambiente",
        status: "fail",
        message: `Erro ao verificar variáveis: ${error}`,
      }
    }
  }

  const testDatabaseConnection = async (): Promise<TestResult> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1)

      if (error) {
        return {
          name: "Conexão com Banco de Dados",
          status: "fail",
          message: `Erro na conexão: ${error.message}`,
          details: error
        }
      }

      return {
        name: "Conexão com Banco de Dados",
        status: "pass",
        message: "Conexão estabelecida com sucesso",
        details: { response: data }
      }
    } catch (error) {
      return {
        name: "Conexão com Banco de Dados",
        status: "fail",
        message: `Erro de conexão: ${error instanceof Error ? error.message : String(error)}`,
        details: error
      }
    }
  }

  const testAuthenticationSystem = async (): Promise<TestResult> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        return {
          name: "Sistema de Autenticação",
          status: "fail",
          message: `Erro no sistema de auth: ${error.message}`,
          details: error
        }
      }

      return {
        name: "Sistema de Autenticação",
        status: "pass",
        message: "Sistema de autenticação funcionando",
        details: {
          has_session: !!data.session,
          session_info: data.session ? "Usuário logado" : "Nenhuma sessão ativa"
        }
      }
    } catch (error) {
      return {
        name: "Sistema de Autenticação",
        status: "fail",
        message: `Erro no auth: ${error instanceof Error ? error.message : String(error)}`,
        details: error
      }
    }
  }

  const testTablesStructure = async (): Promise<TestResult> => {
    try {
      const supabase = createClient()
      const requiredTables = ["users", "events", "streams", "translation_channels", "polls"]
      const tableResults = []

      for (const table of requiredTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select("*")
            .limit(1)

          tableResults.push({
            table,
            exists: !error,
            error: error?.message,
            record_count: data?.length || 0
          })
        } catch (err) {
          tableResults.push({
            table,
            exists: false,
            error: err instanceof Error ? err.message : String(err)
          })
        }
      }

      const missingTables = tableResults.filter(t => !t.exists)

      if (missingTables.length === 0) {
        return {
          name: "Estrutura das Tabelas",
          status: "pass",
          message: `Todas as ${requiredTables.length} tabelas necessárias existem`,
          details: tableResults
        }
      } else {
        return {
          name: "Estrutura das Tabelas",
          status: "fail",
          message: `${missingTables.length} tabelas faltando: ${missingTables.map(t => t.table).join(", ")}`,
          details: tableResults
        }
      }
    } catch (error) {
      return {
        name: "Estrutura das Tabelas",
        status: "fail",
        message: `Erro ao verificar tabelas: ${error instanceof Error ? error.message : String(error)}`,
        details: error
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "fail":
        return <XCircle className="w-5 h-5 text-red-400" />
      case "testing":
        return <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return <Badge className="bg-green-500/20 text-green-300">✓ Aprovado</Badge>
      case "fail":
        return <Badge className="bg-red-500/20 text-red-300">✗ Falhou</Badge>
      case "testing":
        return <Badge className="bg-yellow-500/20 text-yellow-300">⏳ Testando</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-300">? Desconhecido</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Teste de Conexão do Sistema</h1>
            <p className="text-gray-300">Verificação completa das configurações e conectividade</p>
          </div>

          {/* Overall Status */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  overallStatus === "healthy" ? "bg-green-500/20" :
                  overallStatus === "warning" ? "bg-yellow-500/20" : "bg-red-500/20"
                }`}>
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
                    {overallStatus === "healthy" ? "Sistema Funcionando" :
                     overallStatus === "warning" ? "Atenção Necessária" : "Problemas Detectados"}
                  </h3>
                  <p className="text-gray-300">
                    {results.filter(r => r.status === "pass").length} de {results.length} testes aprovados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Button */}
          <div className="text-center">
            <Button 
              onClick={runConnectionTests} 
              disabled={isRunning}
              className="bg-purple-600 hover:bg-purple-700 px-8 py-3"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testando Conexões...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Executar Teste de Conexão
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          {results.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Resultados dos Testes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-start justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <p className="text-white font-medium">{result.name}</p>
                          <p className="text-gray-400 text-sm">{result.message}</p>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                                Ver detalhes
                              </summary>
                              <pre className="text-xs text-gray-400 mt-2 p-2 bg-black/20 rounded overflow-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <h3 className="text-white font-medium mb-2">Painel Admin</h3>
                <p className="text-gray-400 text-sm mb-3">Acessar painel administrativo</p>
                <Button 
                  onClick={() => window.location.href = '/admin'}
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/20"
                >
                  Ir para Admin
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <Globe className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h3 className="text-white font-medium mb-2">Validação Completa</h3>
                <p className="text-gray-400 text-sm mb-3">Executar validação de produção</p>
                <Button 
                  onClick={() => window.location.href = '/system/validation'}
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/20"
                >
                  Validação Completa
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <Database className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <h3 className="text-white font-medium mb-2">Setup Admin</h3>
                <p className="text-gray-400 text-sm mb-3">Criar super administrador</p>
                <Button 
                  onClick={() => window.location.href = '/setup/create-admin'}
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/20"
                >
                  Setup Admin
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Instruções de Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-300">
              <div>
                <strong className="text-white">1. Configure o .env.local:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>NEXT_PUBLIC_SUPABASE_URL: URL do seu projeto Supabase</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: Chave pública anon do Supabase</li>
                  <li>SUPABASE_SERVICE_ROLE_KEY: Chave service_role (secreta)</li>
                </ul>
              </div>
              <div>
                <strong className="text-white">2. Execute os scripts SQL:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>01_create_database_schema.sql</li>
                  <li>02_insert_demo_data.sql</li>
                  <li>03_v5_demo_data.sql</li>
                </ul>
              </div>
              <div>
                <strong className="text-white">3. Crie o super admin:</strong>
                <p className="ml-4 mt-1">Acesse /setup/create-admin para criar o primeiro administrador</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}