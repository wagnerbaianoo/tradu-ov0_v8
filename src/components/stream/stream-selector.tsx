"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Radio, Volume2, Video, Headphones, Wifi, WifiOff } from "lucide-react"
import { webRTCClient, type StreamConfig } from "@/lib/audio/webrtc-client"

interface Stream {
  id: string
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
}

interface StreamSelectorProps {
  streams: Stream[]
  selectedStream: Stream | null
  onStreamChange: (stream: Stream) => void
  onConnectionChange: (connected: boolean) => void
}

export function StreamSelector({ streams, selectedStream, onStreamChange, onConnectionChange }: StreamSelectorProps) {
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [audioMode, setAudioMode] = useState<"auto" | "webrtc" | "hls">("auto")
  const [streamStats, setStreamStats] = useState<any>(null)

  useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      const isConnected = webRTCClient.isStreamConnected()
      setConnectionStatus(isConnected ? "connected" : "disconnected")
      onConnectionChange(isConnected)
    }

    const interval = setInterval(checkConnection, 1000)
    return () => clearInterval(interval)
  }, [onConnectionChange])

  useEffect(() => {
    // Get stream statistics
    const getStats = async () => {
      const stats = await webRTCClient.getStats()
      if (stats) {
        setStreamStats(stats)
      }
    }

    if (connectionStatus === "connected") {
      const interval = setInterval(getStats, 5000)
      return () => clearInterval(interval)
    }
  }, [connectionStatus])

  const connectToStream = async (stream: Stream) => {
    if (!stream) return

    try {
      setConnectionStatus("connecting")

      const config: StreamConfig = {
        type: stream.input_type,
        key: stream.flue_key,
        mode: stream.mode,
        url: stream.url,
      }

      await webRTCClient.connectToFlueStream(config)
      onStreamChange(stream)
      console.log("[v0] Connected to stream:", stream.language)
    } catch (error) {
      console.error("[v0] Failed to connect to stream:", error)
      setConnectionStatus("disconnected")
      alert(`Erro ao conectar com ${stream.language}: ${error}`)
    }
  }

  const disconnectStream = () => {
    webRTCClient.disconnect()
    setConnectionStatus("disconnected")
    setStreamStats(null)
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

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "EXCELLENT":
        return "bg-green-500"
      case "GOOD":
        return "bg-yellow-500"
      case "FAIR":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getInputTypeDisplay = (inputType: string, flueKey?: string) => {
    if (inputType === "flue" && flueKey) {
      return `Flue.live (${flueKey})`
    }
    return inputType === "direct" ? "Direto" : "WebRTC"
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {connectionStatus === "connected" ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            Status da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Badge
              variant={
                connectionStatus === "connected"
                  ? "default"
                  : connectionStatus === "connecting"
                    ? "secondary"
                    : "destructive"
              }
            >
              {connectionStatus === "connected"
                ? "Conectado"
                : connectionStatus === "connecting"
                  ? "Conectando..."
                  : "Desconectado"}
            </Badge>
            {connectionStatus === "connected" && (
              <Button onClick={disconnectStream} variant="outline" size="sm">
                Desconectar
              </Button>
            )}
          </div>

          {selectedStream && (
            <div className="text-sm text-slate-300 space-y-1">
              <div>
                Stream: {selectedStream.language} {selectedStream.flag}
              </div>
              <div>Tipo: {getInputTypeDisplay(selectedStream.input_type, selectedStream.flue_key)}</div>
              <div>Modo: {selectedStream.mode}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Mode Selection */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Modo de Áudio</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={audioMode} onValueChange={(value: any) => setAudioMode(value)}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (WebRTC → HLS)</SelectItem>
              <SelectItem value="webrtc">WebRTC Apenas</SelectItem>
              <SelectItem value="hls">HLS Apenas</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400 mt-2">
            Auto-switch entre WebRTC (baixa latência) e HLS (Flue.live) conforme disponibilidade
          </p>
        </CardContent>
      </Card>

      {/* Stream Selection */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Streams Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {streams
              .filter((stream) => stream.enabled)
              .map((stream) => (
                <button
                  key={stream.id}
                  onClick={() => connectToStream(stream)}
                  disabled={connectionStatus === "connecting"}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedStream?.id === stream.id
                      ? "bg-purple-500/20 border-purple-400"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  } ${connectionStatus === "connecting" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stream.flag}</span>
                      <div>
                        <div className="font-medium text-white">{stream.language}</div>
                        <div className="text-xs text-slate-300">
                          {getInputTypeDisplay(stream.input_type, stream.flue_key)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStreamIcon(stream.stream_type)}
                      <Badge variant={stream.is_original ? "default" : "secondary"} className="text-xs">
                        {stream.is_original ? "Original" : "Tradução"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getQualityColor(stream.quality)}`} />
                      <span>{stream.quality}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      <span>{stream.mode}</span>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Stream Statistics */}
      {connectionStatus === "connected" && streamStats && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-sm">Estatísticas da Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-300 space-y-1">
              <div>Latência: ~50ms</div>
              <div>Qualidade: {selectedStream?.quality}</div>
              <div>Protocolo: {audioMode.toUpperCase()}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
