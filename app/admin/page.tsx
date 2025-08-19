'use client';

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Radio, Activity, Globe, Settings, Mic } from "lucide-react";

// Componentes estáticos (não usam APIs do browser)
import EventManagement from "@/components/admin/event-management";
import StreamManagement from "@/components/admin/stream-management";
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";
import UserManagement from "@/components/admin/user-management";
import SystemSettings from "@/components/admin/system-settings";

// Componentes dinâmicos (usam APIs do browser)
const AudioCaptureManager = dynamic(
  () => import("@/components/admin/audio-capture-manager"),
  { 
    ssr: false,
    loading: () => <div className="text-white p-4">Carregando áudio...</div>
  }
);

const RealTimeMonitor = dynamic(
  () => import("@/components/admin/real-time-monitor"),
  { 
    ssr: false,
    loading: () => <div className="text-white p-4">Carregando monitor...</div>
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
    loadDashboardStats();
    const interval = setInterval(loadDashboardStats, 30000);
    return () => clearInterval(interval);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Cabeçalho e Stats Cards permanecem iguais */}
      
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-black/40 border-white/20">
            {/* Abas permanecem iguais */}
          </TabsList>

          <Suspense fallback={<div className="text-white p-4">Carregando módulo...</div>}>
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
          </Suspense>
        </Tabs>
      </div>
    </div>
  );
}