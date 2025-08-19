'use client';

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Radio, Activity, Globe, Settings, Mic } from "lucide-react";

// Importações dinâmicas corretas com export default
const EventManagement = dynamic(
  () => import("@/components/admin/event-management").then(mod => mod.default),
  { ssr: false, loading: () => <div className="text-white">Carregando...</div> }
);
const StreamManagement = dynamic(
  () => import("@/components/admin/stream-management").then(mod => mod.default),
  { ssr: false }
);
const AudioCaptureManager = dynamic(
  () => import("@/components/admin/audio-capture-manager").then(mod => mod.default),
  { ssr: false }
);
const AnalyticsDashboard = dynamic(
  () => import("@/components/admin/analytics-dashboard").then(mod => mod.default),
  { ssr: false }
);
const UserManagement = dynamic(
  () => import("@/components/admin/user-management").then(mod => mod.default),
  { ssr: false }
);
const SystemSettings = dynamic(
  () => import("@/components/admin/system-settings").then(mod => mod.default),
  { ssr: false }
);
const RealTimeMonitor = dynamic(
  () => import("@/components/admin/real-time-monitor").then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <div className="text-white">Carregando monitor...</div>
  }
);

export default function AdminDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 12,
    activeEvents: 3,
    totalStreams: 8,
    activeTranslators: 5,
    totalUsers: 247,
  });
  const [loading, setLoading] = useState(false);

  const currentUser = {
    name: "Administrador Demo",
    role: "SUPER_ADMIN",
    email: "admin@demo.com",
  };

  const loadDashboardStats = async () => {
    setStats({
      totalEvents: 12 + Math.floor(Math.random() * 5),
      activeEvents: 3 + Math.floor(Math.random() * 3),
      totalStreams: 8 + Math.floor(Math.random() * 4),
      activeTranslators: 5 + Math.floor(Math.random() * 8),
      totalUsers: 247 + Math.floor(Math.random() * 50),
    });
  };

  useEffect(() => {
    setIsClient(true);
    loadDashboardStats();
    const interval = setInterval(loadDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Gerenciador</h1>
              <p className="text-gray-300">Plurall Simutâneo v1</p>
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
          {[
            { icon: BarChart3, color: 'blue', label: 'Total Eventos', value: stats.totalEvents },
            { icon: Activity, color: 'green', label: 'Eventos Ativos', value: stats.activeEvents },
            { icon: Radio, color: 'purple', label: 'Total Streams', value: stats.totalStreams },
            { icon: Globe, color: 'orange', label: 'Tradutores Ativos', value: stats.activeTranslators },
            { icon: Users, color: 'cyan', label: 'Total Usuários', value: stats.totalUsers },
          ].map((item, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-${item.color}-500/20 rounded-lg`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">{item.label}</p>
                    <p className="text-2xl font-bold text-white">{loading ? "..." : item.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-black/40 border-white/20">
            {[
              { value: 'events', icon: BarChart3, label: 'Eventos' },
              { value: 'streams', icon: Radio, label: 'Streams' },
              { value: 'audio', icon: Mic, label: 'Áudio' },
              { value: 'analytics', icon: Activity, label: 'Analytics' },
              { value: 'users', icon: Users, label: 'Usuários' },
              { value: 'settings', icon: Settings, label: 'Sistema' },
              { value: 'monitor', icon: Activity, label: 'Monitor' },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value}
                className="text-white data-[state=active]:bg-purple-600"
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
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