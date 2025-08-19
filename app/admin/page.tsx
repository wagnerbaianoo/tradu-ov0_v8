'use client';

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Radio, Activity, Globe, Settings, Mic } from "lucide-react";

// Componentes estáticos
import { EventManagement } from "@/components/admin/event-management";
import { StreamManagement } from "@/components/admin/stream-management";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { UserManagement } from "@/components/admin/user-management";
import { SystemSettings } from "@/components/admin/system-settings";
import { isSupabaseConfigured } from "@/lib/supabase/client";

// Componentes dinâmicos COM tratamento de erro
const AudioCaptureManager = dynamic(
  () => import("@/components/admin/audio-capture-manager")
    .then(mod => mod.AudioCaptureManager)
    .catch(err => {
      console.error("Failed to load AudioCaptureManager", err);
      return () => <div className="text-red-500">Erro ao carregar módulo de áudio</div>;
    }),
  { 
    ssr: false,
    loading: () => <div className="text-white p-4">Carregando controle de áudio...</div>
  }
);

const RealTimeMonitor = dynamic(
  () => import("@/components/admin/real-time-monitor")
    .then(mod => mod.RealTimeMonitor)
    .catch(err => {
      console.error("Failed to load RealTimeMonitor", err);
      return () => <div className="text-red-500">Erro ao carregar monitor</div>;
    }),
  { 
    ssr: false,
    loading: () => <div className="text-white p-4">Carregando monitor em tempo real...</div>
  }
);

export default function AdminPage() {
  const [isClient, setIsClient] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 12,
    activeEvents: 3,
    totalStreams: 8,
    activeTranslators: 5,
    totalUsers: 247,
  });

  useEffect(() => {
    setIsClient(true);
    if (isSupabaseConfigured) {
      loadDashboardStats();
      const interval = setInterval(loadDashboardStats, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const loadDashboardStats = async () => {
    setStats({
      totalEvents: 12 + Math.floor(Math.random() * 5),
      activeEvents: 3 + Math.floor(Math.random() * 3),
      totalStreams: 8 + Math.floor(Math.random() * 4),
      activeTranslators: 5 + Math.floor(Math.random() * 8),
      totalUsers: 247 + Math.floor(Math.random() * 50),
    });
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando dashboard...</div>
      </div>
    );
  }

  // Show configuration message if Supabase is not configured
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-8 text-center">
            <div className="text-yellow-400 mb-4 text-4xl">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Configuração do Supabase Necessária</h3>
            <p className="text-gray-300 mb-4">Configure as variáveis de ambiente no arquivo .env.local</p>
            <div className="text-left text-sm text-gray-400 bg-black/20 p-3 rounded">
              <div>NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=SEU_ANON_KEY</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header e Stats Cards */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Painel Administrativo</h1>
          <p className="text-gray-300">TranslateEvent V5 - Sistema de Tradução Simultânea</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Eventos</p>
                  <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Radio className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Eventos Ativos</p>
                  <p className="text-2xl font-bold text-white">{stats.activeEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Globe className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Streams</p>
                  <p className="text-2xl font-bold text-white">{stats.totalStreams}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Mic className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Tradutores</p>
                  <p className="text-2xl font-bold text-white">{stats.activeTranslators}</p>
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
                  <p className="text-sm text-gray-300">Usuários</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-black/40 border-white/20">
            <TabsTrigger value="events" className="text-white data-[state=active]:bg-purple-600">
              <Activity className="h-4 w-4 mr-2" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="streams" className="text-white data-[state=active]:bg-purple-600">
              <Radio className="h-4 w-4 mr-2" />
              Streams
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-white data-[state=active]:bg-purple-600">
              <Mic className="h-4 w-4 mr-2" />
              Áudio
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-purple-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-600">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-purple-600">
              <Settings className="h-4 w-4 mr-2" />
              Config
            </TabsTrigger>
            <TabsTrigger value="monitor" className="text-white data-[state=active]:bg-purple-600">
              <Globe className="h-4 w-4 mr-2" />
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
  );
}