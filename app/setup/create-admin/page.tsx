"use client"

import { useState } from "react"

import type React from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Shield, Search } from "lucide-react"
import { createSuperAdmin, checkSuperAdminExists } from "@/lib/actions/setup"

export default function CreateAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)
  const [adminExists, setAdminExists] = useState<boolean | null>(null)
  const [diagnostic, setDiagnostic] = useState<any>(null)
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "superadmin@translateevent.com",
    password: "TranslateEvent2024!",
    name: "Super Administrador",
  })

  useEffect(() => {
    checkSuperAdminExists().then((response) => {
      if (response.exists) {
        setAdminExists(true)
        setResult({
          success: true,
          message: "Super Administrador já existe no sistema. Você pode fazer login.",
        })
      } else {
        setAdminExists(false)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await createSuperAdmin(formData)
      setResult(response)
    } catch (error) {
      setResult({ error: "Erro inesperado ao criar super admin" })
    } finally {
      setIsLoading(false)
    }
  }

  const runDiagnostic = async () => {
    setIsDiagnosticLoading(true)
    try {
      const response = await fetch("/api/diagnostic", { method: "POST" })
      const data = await response.json()
      setDiagnostic(data)
    } catch (error) {
      setDiagnostic({ error: "Erro ao executar diagnóstico" })
    } finally {
      setIsDiagnosticLoading(false)
    }
  }

  const handleReset = async () => {
    setIsResetLoading(true)
    setResult(null)
    try {
      const { resetSuperAdmin } = await import("@/lib/actions/setup")
      const response = await resetSuperAdmin()
      setResult(response)
      if (response.success) {
        setAdminExists(true)
      }
    } catch (error) {
      setResult({ error: "Erro ao resetar super admin" })
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Criar Super Administrador</CardTitle>
          <CardDescription className="text-gray-300">
            Configure o primeiro usuário administrativo do sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {adminExists === true ? (
            <div className="space-y-4">
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <CheckCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  Super Administrador já existe no sistema.
                  <br />
                  <strong>Credenciais padrão:</strong>
                  <br />
                  Email: superadmin@translateevent.com
                  <br />
                  Senha: TranslateEvent2024!
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  onClick={runDiagnostic}
                  disabled={isDiagnosticLoading}
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isDiagnosticLoading ? "Verificando..." : "Verificar Sistema"}
                </Button>

                <Button
                  onClick={handleReset}
                  disabled={isResetLoading}
                  variant="destructive"
                  className="w-full bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/30"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {isResetLoading ? "Resetando..." : "Resetar e Recriar Admin"}
                </Button>

                {diagnostic && (
                  <div className="bg-black/20 p-4 rounded-lg text-xs text-gray-300 max-h-96 overflow-y-auto">
                    <pre>{JSON.stringify(diagnostic, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ) : result?.success ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                {result.message}
                <br />
                <strong>Credenciais:</strong>
                <br />
                Email: {formData.email}
                <br />
                Senha: {formData.password}
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Nome
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />
              </div>

              {result?.error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">{result.error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
              >
                {isLoading ? "Criando..." : "Criar Super Admin"}
              </Button>
            </form>
          )}

          <div className="text-center pt-4">
            <p className="text-sm text-gray-400">
              Após criar, acesse{" "}
              <a href="/auth/login" className="text-blue-400 hover:text-blue-300 underline">
                /auth/login
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
