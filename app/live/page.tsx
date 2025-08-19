"use client"

import { LiveStreamDashboard } from "@/components/live-stream-dashboard"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LivePage() {
  // Show configuration message if Supabase is not set up
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <div className="text-yellow-400 mb-4 text-4xl">📺</div>
            <h2 className="text-2xl font-bold text-white mb-4">Stream ao Vivo - Modo Demo</h2>
            <p className="text-gray-300 mb-6">
              Para acessar streams reais, configure o Supabase com suas credenciais.
            </p>
            <div className="text-left text-sm text-gray-400 bg-black/20 p-4 rounded mb-6">
              <div className="mb-2 font-semibold text-gray-300">Variáveis necessárias no .env.local:</div>
              <div>NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=SEU_ANON_KEY</div>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Voltar ao Início
              </Button>
              <Button 
                onClick={() => window.location.href = '/system/test-connection'}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Testar Configuração
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <LiveStreamDashboard />
}
