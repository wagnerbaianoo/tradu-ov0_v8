"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Globe, Radio, Clock, Activity, Mic, MicOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TranslationRoomProps {
  sourceLanguage: string
  targetLanguage: string
  isActive: boolean
  channelId: string
}

interface Translator {
  id: string
  name: string
  language_pair: string
  is_active: boolean
  session_duration: number
}

export function TranslationRoom({ sourceLanguage, targetLanguage, isActive, channelId }: TranslationRoomProps) {
  const [roomInfo, setRoomInfo] = useState({
    roomId: "",
    participantCount: 0,
    sessionDuration: 0,
  })
  const [otherTranslators, setOtherTranslators] = useState<Translator[]>([])
  const [roomStats, setRoomStats] = useState({
    totalWords: 0,
    avgLatency: 0,
    qualityScore: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    if (channelId) {
      initializeRoom()
      loadOtherTranslators()
      startStatsUpdates()
    }
  }, [channelId, sourceLanguage, targetLanguage])

  const initializeRoom = () => {
    const roomId = `${sourceLanguage}-${targetLanguage}-${channelId.slice(0, 8)}`
    setRoomInfo((prev) => ({
      ...prev,
      roomId,
      participantCount: 1 + Math.floor(Math.random() * 3), // Simulate other participants
    }))
  }

  const loadOtherTranslators = async () => {
    // Simulate other translators in similar language pairs
    const mockTranslators: Translator[] = [
      {
        id: "1",
        name: "Maria Silva",
        language_pair: "pt-BR → en-US",
        is_active: true,
        session_duration: 45,
      },
      {
        id: "2",
        name: "John Smith",
        language_pair: "en-US → es-ES",
        is_active: false,
        session_duration: 23,
      },
      {
        id: "3",
        name: "Carlos Rodriguez",
        language_pair: "es-ES → pt-BR",
        is_active: true,
        session_duration: 67,
      },
    ]

    // Filter translators working on different language pairs
    const relevantTranslators = mockTranslators.filter(
      (t) => t.language_pair !== `${sourceLanguage} → ${targetLanguage}`,
    )

    setOtherTranslators(relevantTranslators)
  }

  const startStatsUpdates = () => {
    const intervalId = setInterval(() => {
      setRoomInfo((prev) => ({
        ...prev,
        sessionDuration: prev.sessionDuration + 1,
      }))

      setRoomStats((prev) => ({
        totalWords: prev.totalWords + (isActive ? Math.floor(Math.random() * 5) : 0),
        avgLatency: 40 + Math.floor(Math.random() * 30),
        qualityScore: 85 + Math.floor(Math.random() * 15),
      }))
    }, 5000)

    return () => clearInterval(intervalId)
  }

  const getLanguageDisplay = (code: string) => {
    const languages: Record<string, { name: string; flag: string }> = {
      "pt-BR": { name: "Português", flag: "🇧🇷" },
      "en-US": { name: "English", flag: "🇺🇸" },
      "es-ES": { name: "Español", flag: "🇪🇸" },
      "fr-FR": { name: "Français", flag: "🇫🇷" },
      libras: { name: "Libras", flag: "🤟" },
    }
    return languages[code] || { name: code, flag: "🌐" }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-4">
      {/* Room Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-white">
          <span>{getLanguageDisplay(sourceLanguage).flag}</span>
          <span>{getLanguageDisplay(sourceLanguage).name}</span>
          <span className="text-gray-400">→</span>
          <span>{getLanguageDisplay(targetLanguage).flag}</span>
          <span>{getLanguageDisplay(targetLanguage).name}</span>
        </div>
        <div className="text-sm text-gray-400 font-mono">Sala: {roomInfo.roomId}</div>
      </div>

      {/* Room Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Participantes</p>
                <p className="text-lg font-bold text-white">{roomInfo.participantCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Sessão</p>
                <p className="text-lg font-bold text-white">{formatDuration(roomInfo.sessionDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs text-gray-400">Palavras</p>
                <p className="text-lg font-bold text-white">{roomStats.totalWords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-xs text-gray-400">Qualidade</p>
                <p className="text-lg font-bold text-white">{roomStats.qualityScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">Status da Sala</span>
            <Badge variant={isActive ? "destructive" : "outline"} className="gap-1">
              {isActive ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
              {isActive ? "Traduzindo" : "Aguardando"}
            </Badge>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <div>Latência média: {roomStats.avgLatency}ms</div>
            <div>Canal: {channelId || "Nenhum selecionado"}</div>
            <div>Modo: Tradução simultânea</div>
          </div>
        </CardContent>
      </Card>

      {/* Other Translators */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-white">Outros Tradutores Online</div>
        <div className="space-y-2">
          {otherTranslators.map((translator) => (
            <Card key={translator.id} className="bg-white/5 border-white/10">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${translator.is_active ? "bg-green-500" : "bg-gray-500"}`} />
                    <span className="text-sm text-white">{translator.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">{translator.language_pair}</div>
                    <div className="text-xs text-gray-500">{formatDuration(translator.session_duration)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Room Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10">
          <Radio className="w-4 h-4 mr-2" />
          Configurações da Sala
        </Button>
      </div>
    </div>
  )
}
