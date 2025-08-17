"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Radio, Users, Globe, Headphones } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ChannelRouterProps {
  selectedChannel: string
  onChannelChange: (channel: string) => void
  targetLanguage: string
}

interface TranslationChannel {
  id: string
  event_id: string
  base_language: string
  target_language: string
  stream_url: string
  is_active: boolean
  event_name?: string
}

export function ChannelRouter({ selectedChannel, onChannelChange, targetLanguage }: ChannelRouterProps) {
  const [channels, setChannels] = useState<TranslationChannel[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchChannels() {
      try {
        const { data, error } = await supabase
          .from("translation_channels")
          .select(`
            *,
            events!inner(name)
          `)
          .eq("is_active", true)
          .eq("target_language", targetLanguage)

        if (error) throw error

        const channelsWithEventName =
          data?.map((channel) => ({
            ...channel,
            event_name: channel.events?.name || "Evento sem nome",
          })) || []

        setChannels(channelsWithEventName)
      } catch (error) {
        console.error("[v0] Error fetching translation channels:", error)
      } finally {
        setLoading(false)
      }
    }

    if (targetLanguage) {
      fetchChannels()
    }
  }, [targetLanguage, supabase])

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

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/10 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4 text-center">
          <Headphones className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-300 text-sm">
            Nenhum canal disponível para {getLanguageDisplay(targetLanguage).flag}{" "}
            {getLanguageDisplay(targetLanguage).name}
          </p>
          <p className="text-slate-400 text-xs mt-1">Verifique se há eventos ativos com tradução habilitada</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-300 mb-3">
        Canais disponíveis para {getLanguageDisplay(targetLanguage).flag} {getLanguageDisplay(targetLanguage).name}
      </div>

      {channels.map((channel) => (
        <button
          key={channel.id}
          onClick={() => onChannelChange(channel.id)}
          className={`w-full p-4 rounded-lg border text-left transition-all ${
            selectedChannel === channel.id
              ? "bg-green-500/20 border-green-400"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${selectedChannel === channel.id ? "text-green-400" : "text-slate-400"}`} />
              <span className="font-medium text-white text-sm">{channel.event_name}</span>
            </div>
            <Badge variant={channel.is_active ? "default" : "secondary"} className="text-xs">
              {channel.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </div>

          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3" />
              <span>
                {getLanguageDisplay(channel.base_language).flag} {getLanguageDisplay(channel.base_language).name}
                {" → "}
                {getLanguageDisplay(channel.target_language).flag} {getLanguageDisplay(channel.target_language).name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3" />
              <span className="font-mono text-xs opacity-75">{channel.stream_url}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
