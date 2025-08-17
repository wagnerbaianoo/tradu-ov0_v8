"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Radio, Users, Eye, Activity, Volume2, Video, Headphones, Globe, TrendingUp } from "lucide-react"
import StreamPlayer from "@/components/stream-player"
import { StreamSelector } from "@/components/stream/stream-selector"
import { createClient } from "@/lib/supabase/client"

interface LiveStream {
  id: string
  event_id: string
  language: string
  language_code: string
  flag: string
  stream_type: "AUDIO" | "VIDEO" | "LIBRAS" | "TRANSLATION"
  url: string
  is_original: boolean
  quality: "EXCELLENT" | "GOOD" | "FAIR"
  enabled: boolean
  input_type: "direct" | "flue"
  flue_key?: string
  mode: "audio-only" | "video"
  viewer_count?: number
  is_live?: boolean
}

interface LiveEvent {
  id: string
  name: string
  description: string
  is_active: boolean
  translation_enabled: boolean
  viewer_count: number
  start_time: string
}

export function LiveStreamDashboard() {
  const [activeEvent, setActiveEvent] = useState<LiveEvent | null>(null)
  const [availableStreams, setAvailableStreams] = useState<LiveStream[]>([])
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({
    totalViewers: 0,
    activeStreams: 0,
    avgLatency: 0,
    totalEvents: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    loadActiveEvent()
    loadDashboardStats()

    // Set up real-time updates
    const interval = setInterval(() => {
      loadDashboardStats()
      updateViewerCounts()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeEvent) {
      loadEventStreams()
    }
  }, [activeEvent])

  const loadActiveEvent = async () => {
    try {
      const { data: events } = await supabase.from("events").select("*").eq("is_active", true).limit(1)

      if (events && events.length > 0) {
        const event = events[0]
        setActiveEvent({
          ...event,
          viewer_count: Math.floor(Math.random() * 500) + 50, // Simulate viewer count
        })
      }
    } catch (error) {
      console.error("[v0] Error loading active event:", error)
    }
  }

  const loadEventStreams = async () => {
    if (!activeEvent) return

    try {
      const { data: streams } = await supabase
        .from("streams")
        .select("id, event_id, language, language_code, flag, stream_type, url, is_original, quality, enabled, input_type, flue_key, mode")
        .eq("event_id", activeEvent.id)
        .eq("enabled", true)

      const enhancedStreams =
        streams?.map((stream) => ({
          ...stream,
          viewer_count: Math.floor(Math.random() * 200) + 10,
          is_live: Math.random() > 0.2, // 80% chance of being live
        })) || []

      setAvailableStreams(enhancedStreams)

      // Auto-select first available stream
      if (enhancedStreams.length > 0 && !selectedStream) {
        setSelectedStream(enhancedStreams[0])
      }
    } catch (error) {
      console.error("[v0] Error loading event streams:", error)
    }
  }

  const loadDashboardStats = async () => {
    try {
      const [eventsResult, streamsResult] = await Promise.all([
        supabase.from("events").select("id, is_active"),
        supabase.from("streams").select("id, enabled"),
      ])

      const events = eventsResult.data || []
      const streams = streamsResult.data || []

      setDashboardStats({
        totalViewers: Math.floor(Math.random() * 1000) + 200,
        activeStreams: streams.filter((s) => s.enabled).length,
        avgLatency: 45 + Math.floor(Math.random() * 30),
        totalEvents: events.filter((e) => e.is_active).length,
      })
    } catch (error) {
      console.error("[v0] Error loading dashboard stats:", error)
    }
  }

  const updateViewerCounts = () => {
    setAvailableStreams((prev) =>
      prev.map((stream) => ({
        ...stream,
        viewer_count: Math.max(1, (stream.viewer_count || 0) + Math.floor(Math.random() * 10) - 5),
      })),
    )

    if (activeEvent) {
      setActiveEvent((prev) =>
        prev
          ? {
              ...prev,
              viewer_count: Math.max(1, prev.viewer_count + Math.floor(Math.random() * 20) - 10),
            }
          : null,
      )
    }
  }

  const getStreamIcon = (streamType: string) => {
    switch (streamType) {
      case "VIDEO":
        return <Video className="w-4 h-4" />
      case "LIBRAS":
        return <span className="text-sm">🤟</span>
      case "TRANSLATION":
        return <Headphones className="w-4 h-4" />
      default:
        return <Volume2 className="w-4 h-4" />
    }
  }

  const getStreamTypeLabel = (streamType: string) => {
    switch (streamType) {
      case "VIDEO":
        return "Vídeo Principal"
      case "LIBRAS":
        return "Intérprete Libras"
      case "TRANSLATION":
        return "Tradução"
      default:
        return "Áudio"
    }
  }

  if (!activeEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8">
          <CardContent className="text-center">
            <Radio className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Nenhum Evento Ativo</h2>
            <p className="text-gray-400">Aguardando eventos ao vivo...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{activeEvent.name}</h1>
              <p className="text-gray-300">{activeEvent.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="default" className="bg-red-500/20 text-red-300 gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                AO VIVO
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Users className="w-3 h-3" />
                {activeEvent.viewer_count} espectadores
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Eye className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Espectadores</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.totalViewers}</p>
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
                  <p className="text-sm text-gray-300">Streams Ativos</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.activeStreams}</p>
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
                  <p className="text-sm text-gray-300">Latência Média</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.avgLatency}ms</p>
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
                  <p className="text-sm text-gray-300">Idiomas</p>
                  <p className="text-2xl font-bold text-white">{availableStreams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stream Player */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {selectedStream && getStreamIcon(selectedStream.stream_type)}
                  {selectedStream
                    ? `${selectedStream.language} - ${getStreamTypeLabel(selectedStream.stream_type)}`
                    : "Player de Stream"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StreamPlayer
                  stream={selectedStream}
                  isPlaying={isPlaying}
                  onPlayingChange={setIsPlaying}
                  autoPlay={true}
                  showControls={true}
                />
              </CardContent>
            </Card>

            {/* Stream List */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Streams Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableStreams.map((stream) => (
                    <button
                      key={stream.id}
                      onClick={() => setSelectedStream(stream)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedStream?.id === stream.id
                          ? "bg-purple-500/20 border-purple-400"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{stream.flag}</span>
                          <div>
                            <div className="font-medium text-white text-sm">{stream.language}</div>
                            <div className="text-xs text-gray-400">{getStreamTypeLabel(stream.stream_type)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStreamIcon(stream.stream_type)}
                          {stream.is_live && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          <span>{stream.viewer_count} espectadores</span>
                        </div>
                        <Badge variant={stream.is_original ? "default" : "secondary"} className="text-xs">
                          {stream.is_original ? "Original" : "Tradução"}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stream Selector */}
            <StreamSelector
              streams={availableStreams}
              selectedStream={selectedStream}
              onStreamChange={setSelectedStream}
              onConnectionChange={setIsConnected}
            />

            {/* Live Stats */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Estatísticas ao Vivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Pico de Espectadores</span>
                    <span className="text-white font-medium">{Math.floor(dashboardStats.totalViewers * 1.3)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Tempo de Transmissão</span>
                    <span className="text-white font-medium">2h 34m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Qualidade Média</span>
                    <Badge variant="default" className="text-xs">
                      Excelente
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Conexões WebRTC</span>
                    <span className="text-green-400 font-medium">{Math.floor(dashboardStats.totalViewers * 0.7)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
