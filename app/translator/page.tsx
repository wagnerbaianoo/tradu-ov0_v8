"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Volume2, Settings, Radio, Headphones, Users, Globe, Activity } from "lucide-react"
import { TranslationController } from "@/components/translator/translation-controller"
import { LanguageSelector } from "@/components/translator/language-selector"
import { ChannelRouter } from "@/components/translator/channel-router"
import { AudioVisualizer } from "@/components/translator/audio-visualizer"
import { MainAudioReceiver } from "@/components/translator/main-audio-receiver"
import { TranslationRoom } from "@/components/translator/translation-room"
import LogoutButton from "@/components/auth/logout-button"
import { createClient } from "@/lib/supabase/client"

export default function TranslatorPanel() {
  const [isConnected, setIsConnected] = useState(false)
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isReceivingMainAudio, setIsReceivingMainAudio] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState({
    source: "pt-BR",
    target: "en-US",
  })
  const [selectedChannel, setSelectedChannel] = useState("")
  const [audioLevel, setAudioLevel] = useState(0)
  const [mainAudioLevel, setMainAudioLevel] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeEvent, setActiveEvent] = useState<any>(null)
  const [translatorStats, setTranslatorStats] = useState({
    sessionDuration: 0,
    wordsTranslated: 0,
    avgLatency: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    loadCurrentUser()
    loadActiveEvent()
    startSessionTimer()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase.from("users").select("name, role").eq("id", user.id).single()
        setCurrentUser({ ...user, ...userData })
      }
    } catch (error) {
      console.error("[v0] Error loading current user:", error)
    }
  }

  const loadActiveEvent = async () => {
    try {
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .eq("translation_enabled", true)
        .limit(1)

      if (events && events.length > 0) {
        setActiveEvent(events[0])
      }
    } catch (error) {
      console.error("[v0] Error loading active event:", error)
    }
  }

  const startSessionTimer = () => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000 / 60) // minutes
      setTranslatorStats((prev) => ({
        ...prev,
        sessionDuration: duration,
        wordsTranslated: prev.wordsTranslated + (isTransmitting ? Math.floor(Math.random() * 3) : 0),
        avgLatency: 45 + Math.floor(Math.random() * 20), // Simulate latency
      }))
    }, 5000)

    return () => clearInterval(interval)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Painel do Tradutor</h1>
              <p className="text-gray-300">Sistema de Tradução Simultânea V5</p>
            </div>
            <div className="flex items-center gap-4">
              {currentUser && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-white font-medium">{currentUser.name || "Tradutor"}</p>
                    <p className="text-gray-400 text-sm">{currentUser.role}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{currentUser.name?.charAt(0).toUpperCase() || "T"}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                  <Radio className="w-3 h-3" />
                  {isConnected ? "Conectado" : "Desconectado"}
                </Badge>
                <Badge variant={isTransmitting ? "destructive" : "outline"} className="gap-1">
                  <Mic className="w-3 h-3" />
                  {isTransmitting ? "Transmitindo" : "Parado"}
                </Badge>
                <Badge variant={isReceivingMainAudio ? "default" : "secondary"} className="gap-1">
                  <Headphones className="w-3 h-3" />
                  {isReceivingMainAudio ? "Recebendo" : "Sem Áudio"}
                </Badge>
              </div>
              <LogoutButton variant="outline" />
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
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Sessão</p>
                  <p className="text-xl font-bold text-white">{translatorStats.sessionDuration}min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Globe className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Palavras</p>
                  <p className="text-xl font-bold text-white">{translatorStats.wordsTranslated}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Radio className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Latência</p>
                  <p className="text-xl font-bold text-white">{translatorStats.avgLatency}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Evento</p>
                  <p className="text-sm font-bold text-white">{activeEvent?.name || "Nenhum"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Language Selection */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuração de Idiomas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LanguageSelector selectedLanguages={selectedLanguages} onLanguageChange={setSelectedLanguages} />
              </CardContent>
            </Card>

            {/* Channel Router */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5" />
                  Canal de Destino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChannelRouter
                  selectedChannel={selectedChannel}
                  onChannelChange={setSelectedChannel}
                  targetLanguage={selectedLanguages.target}
                />
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Audio Control */}
          <div className="space-y-6">
            {/* Main Audio Receiver */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Áudio Principal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MainAudioReceiver
                  isReceiving={isReceivingMainAudio}
                  onReceivingChange={setIsReceivingMainAudio}
                  onAudioLevelChange={setMainAudioLevel}
                  sourceLanguage={selectedLanguages.source}
                />
              </CardContent>
            </Card>

            {/* Audio Visualizer */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Monitoramento de Áudio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-300">Áudio Principal (Entrada)</div>
                  <AudioVisualizer audioLevel={mainAudioLevel} isListening={isReceivingMainAudio} />

                  <div className="text-sm text-gray-300 mt-6">Seu Microfone (Saída)</div>
                  <AudioVisualizer audioLevel={audioLevel} isListening={isConnected} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Translation Control */}
          <div className="space-y-6">
            {/* Translation Room */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Sala de Tradução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TranslationRoom
                  sourceLanguage={selectedLanguages.source}
                  targetLanguage={selectedLanguages.target}
                  isActive={isTransmitting}
                  channelId={selectedChannel}
                />
              </CardContent>
            </Card>

            {/* Translation Controller */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Controle de Tradução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TranslationController
                  isConnected={isConnected}
                  isTransmitting={isTransmitting}
                  onConnectionChange={setIsConnected}
                  onTransmissionChange={setIsTransmitting}
                  onAudioLevelChange={setAudioLevel}
                  sourceLanguage={selectedLanguages.source}
                  targetLanguage={selectedLanguages.target}
                  targetChannel={selectedChannel}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
