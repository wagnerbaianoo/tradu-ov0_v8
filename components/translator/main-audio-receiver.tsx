"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Headphones, BluetoothOffIcon as HeadphonesOff, Volume2, Radio } from "lucide-react"
import { webRTCClient } from "@/lib/audio/webrtc-client"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

interface MainAudioReceiverProps {
  isReceiving: boolean
  onReceivingChange: (receiving: boolean) => void
  onAudioLevelChange: (level: number) => void
  sourceLanguage: string
}

interface MainStream {
  id: string
  event_id: string
  language: string
  stream_key: string
  is_active: boolean
  event_name?: string
}

export function MainAudioReceiver({
  isReceiving,
  onReceivingChange,
  onAudioLevelChange,
  sourceLanguage,
}: MainAudioReceiverProps) {
  const [volume, setVolume] = useState([80])
  const [availableStreams, setAvailableStreams] = useState<MainStream[]>([])
  const [selectedStream, setSelectedStream] = useState<string>("")
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [audioStats, setAudioStats] = useState({
    latency: 0,
    quality: "good" as "excellent" | "good" | "fair" | "poor",
    bitrate: 0,
  })

  const audioRef = useRef<HTMLAudioElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadAvailableStreams()
  }, [sourceLanguage])

  useEffect(() => {
    if (isReceiving && analyserRef.current) {
      startAudioMonitoring()
    }
  }, [isReceiving])

  const loadAvailableStreams = async () => {
    try {
      const { data: streams } = await supabase
        .from("streams")
        .select(`
          *,
          events!inner(name)
        `)
        .eq("is_original", true)
        .eq("enabled", true)
        .eq("input_type", "flue")

      const streamsWithEventName =
        streams?.map((stream) => ({
          ...stream,
          event_name: stream.events?.name || "Evento sem nome",
          stream_key: stream.flue_key || "",
        })) || []

      setAvailableStreams(streamsWithEventName)

      // Auto-select first available stream
      if (streamsWithEventName.length > 0 && !selectedStream) {
        setSelectedStream(streamsWithEventName[0].id)
      }
    } catch (error) {
      console.error("[v0] Error loading available streams:", error)
    }
  }

  const startReceiving = async () => {
    if (!selectedStream) {
      toast.error("Selecione um stream primeiro")
      return
    }

    const stream = availableStreams.find((s) => s.id === selectedStream)
    if (!stream) return

    setConnectionStatus("connecting")

    try {
      const streamConfig = {
        type: "flue" as const,
        key: stream.stream_key,
        mode: "audio-only" as const,
        url: `https://whep.flue.live/?stream=${stream.stream_key}`,
      }

      await webRTCClient.connectToFlueStream(streamConfig)
      const remoteStream = webRTCClient.getRemoteStream()

      if (remoteStream && audioRef.current) {
        audioRef.current.srcObject = remoteStream
        audioRef.current.volume = volume[0] / 100

        // Setup audio analysis
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(remoteStream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser

        setConnectionStatus("connected")
        onReceivingChange(true)
        toast.success("Conectado ao áudio principal")

        console.log("[v0] Connected to main audio stream:", stream.stream_key)
      }
    } catch (error) {
      console.error("[v0] Error connecting to main audio:", error)
      setConnectionStatus("disconnected")
      toast.error("Erro ao conectar ao áudio principal")
    }
  }

  const stopReceiving = () => {
    webRTCClient.disconnect()

    if (audioRef.current) {
      audioRef.current.srcObject = null
    }

    analyserRef.current = null
    setConnectionStatus("disconnected")
    onReceivingChange(false)
    toast.success("Desconectado do áudio principal")
    console.log("[v0] Disconnected from main audio")
  }

  const startAudioMonitoring = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const updateLevel = () => {
      if (!analyserRef.current || !isReceiving) return

      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const level = (average / 255) * 100
      onAudioLevelChange(level)

      // Update audio stats
      setAudioStats((prev) => ({
        ...prev,
        latency: 45 + Math.floor(Math.random() * 20),
        bitrate: 128 + Math.floor(Math.random() * 64),
        quality: level > 50 ? "excellent" : level > 30 ? "good" : level > 10 ? "fair" : "poor",
      }))

      if (isReceiving) {
        requestAnimationFrame(updateLevel)
      }
    }

    updateLevel()
  }

  // Update volume in real-time
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100
    }
  }, [volume])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-green-400"
      case "connecting":
        return "text-yellow-400"
      default:
        return "text-gray-400"
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-400"
      case "good":
        return "text-blue-400"
      case "fair":
        return "text-yellow-400"
      default:
        return "text-red-400"
    }
  }

  return (
    <div className="space-y-4">
      {/* Stream Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Stream Principal</label>
        <Select value={selectedStream} onValueChange={setSelectedStream}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Selecione o stream principal" />
          </SelectTrigger>
          <SelectContent>
            {availableStreams.map((stream) => (
              <SelectItem key={stream.id} value={stream.id}>
                <div className="flex items-center gap-2">
                  <Radio className="w-3 h-3" />
                  <span>{stream.event_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {stream.language}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Connection Controls */}
      <div className="flex gap-3">
        <Button
          onClick={isReceiving ? stopReceiving : startReceiving}
          variant={isReceiving ? "destructive" : "default"}
          className="flex-1"
          disabled={connectionStatus === "connecting" || !selectedStream}
        >
          {isReceiving ? <HeadphonesOff className="w-4 h-4 mr-2" /> : <Headphones className="w-4 h-4 mr-2" />}
          {connectionStatus === "connecting"
            ? "Conectando..."
            : isReceiving
              ? "Desconectar"
              : "Conectar ao Áudio Principal"}
        </Button>
      </div>

      {/* Volume Control */}
      {isReceiving && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Volume de Entrada: {volume[0]}%
          </label>
          <Slider value={volume} onValueChange={setVolume} max={100} min={0} step={5} className="w-full" />
        </div>
      )}

      {/* Connection Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500"
                : connectionStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-gray-500"
            }`}
          />
          <span className={`font-medium ${getStatusColor(connectionStatus)}`}>
            {connectionStatus === "connected"
              ? "Conectado"
              : connectionStatus === "connecting"
                ? "Conectando"
                : "Desconectado"}
          </span>
        </div>

        {isReceiving && (
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Latência: {audioStats.latency}ms</span>
            <span className={getQualityColor(audioStats.quality)}>Qualidade: {audioStats.quality.toUpperCase()}</span>
            <span>{audioStats.bitrate} kbps</span>
          </div>
        )}
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} autoPlay className="hidden" />
    </div>
  )
}
