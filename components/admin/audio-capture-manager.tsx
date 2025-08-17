"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Mic,
  MicOff,
  Volume2,
  Settings,
  Radio,
  Activity,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Headphones,
  BarChart3,
} from "lucide-react"
import { webRTCClient } from "@/lib/audio/webrtc-client"
import { AudioVisualizer } from "@/components/translator/audio-visualizer"
import { toast } from "react-hot-toast"

interface AudioDevice {
  deviceId: string
  label: string
  kind: "audioinput" | "audiooutput"
}

interface AudioStats {
  inputLevel: number
  outputLevel: number
  latency: number
  sampleRate: number
  bitrate: number
  packetsLost: number
  jitter: number
}

export function AudioCaptureManager() {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedInputDevice, setSelectedInputDevice] = useState<string>("")
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>("")
  const [isCapturing, setIsCapturing] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [audioStats, setAudioStats] = useState<AudioStats>({
    inputLevel: 0,
    outputLevel: 0,
    latency: 0,
    sampleRate: 48000,
    bitrate: 128,
    packetsLost: 0,
    jitter: 0,
  })

  // Audio settings
  const [settings, setSettings] = useState({
    inputGain: [75],
    outputGain: [80],
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false,
    highPassFilter: true,
    compressor: false,
    streamKey: "",
    streamQuality: "high",
  })

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadAudioDevices()
    return () => {
      stopCapture()
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
      }
    }
  }, [])

  const loadAudioDevices = async () => {
    try {
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true })

      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = deviceList
        .filter((device) => device.kind === "audioinput" || device.kind === "audiooutput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
          kind: device.kind as "audioinput" | "audiooutput",
        }))

      setDevices(audioDevices)

      // Set default devices
      const defaultInput = audioDevices.find((d) => d.kind === "audioinput")
      const defaultOutput = audioDevices.find((d) => d.kind === "audiooutput")

      if (defaultInput && !selectedInputDevice) {
        setSelectedInputDevice(defaultInput.deviceId)
      }
      if (defaultOutput && !selectedOutputDevice) {
        setSelectedOutputDevice(defaultOutput.deviceId)
      }
    } catch (error) {
      console.error("[v0] Error loading audio devices:", error)
      toast.error("Erro ao carregar dispositivos de áudio")
    }
  }

  const startCapture = async () => {
    try {
      const constraints = {
        audio: {
          deviceId: selectedInputDevice ? { exact: selectedInputDevice } : undefined,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
          sampleRate: 48000,
          channelCount: 2,
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream

      // Setup audio context and processing
      const audioContext = new AudioContext({ sampleRate: 48000 })
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      const gainNode = audioContext.createGain()

      // Configure analyser
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8

      // Configure gain
      gainNode.gain.value = settings.inputGain[0] / 100

      // Audio processing chain
      let currentNode = source

      // High-pass filter
      if (settings.highPassFilter) {
        const highPassFilter = audioContext.createBiquadFilter()
        highPassFilter.type = "highpass"
        highPassFilter.frequency.value = 80
        currentNode.connect(highPassFilter)
        currentNode = highPassFilter
      }

      // Compressor
      if (settings.compressor) {
        const compressor = audioContext.createDynamicsCompressor()
        compressor.threshold.value = -24
        compressor.knee.value = 30
        compressor.ratio.value = 12
        compressor.attack.value = 0.003
        compressor.release.value = 0.25
        currentNode.connect(compressor)
        currentNode = compressor
      }

      // Connect processing chain
      currentNode.connect(gainNode)
      gainNode.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      gainNodeRef.current = gainNode

      setIsCapturing(true)
      startStatsMonitoring()
      toast.success("Captura de áudio iniciada")

      console.log("[v0] Audio capture started with settings:", settings)
    } catch (error) {
      console.error("[v0] Error starting audio capture:", error)
      toast.error("Erro ao iniciar captura de áudio")
    }
  }

  const stopCapture = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    gainNodeRef.current = null
    setIsCapturing(false)
    setIsStreaming(false)

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = null
    }

    toast.success("Captura de áudio parada")
    console.log("[v0] Audio capture stopped")
  }

  const startStreaming = async () => {
    if (!mediaStreamRef.current || !settings.streamKey) {
      toast.error("Configure a chave de stream primeiro")
      return
    }

    try {
      const streamConfig = {
        type: "flue" as const,
        key: settings.streamKey,
        mode: "audio-only" as const,
        url: `https://whip.flue.live/?stream=${settings.streamKey}`,
      }

      await webRTCClient.publishToFlueStream(streamConfig, mediaStreamRef.current)
      setIsStreaming(true)
      toast.success("Streaming iniciado")

      console.log("[v0] Audio streaming started to:", settings.streamKey)
    } catch (error) {
      console.error("[v0] Error starting stream:", error)
      toast.error("Erro ao iniciar streaming")
    }
  }

  const stopStreaming = () => {
    webRTCClient.disconnect()
    setIsStreaming(false)
    toast.success("Streaming parado")
    console.log("[v0] Audio streaming stopped")
  }

  const startStatsMonitoring = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
    }

    statsIntervalRef.current = setInterval(() => {
      if (!analyserRef.current || !audioContextRef.current) return

      // Get audio level
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const inputLevel = (average / 255) * 100

      // Get WebRTC stats if streaming
      let latency = 0
      let packetsLost = 0
      let jitter = 0

      if (isStreaming) {
        webRTCClient.getStats().then((stats) => {
          if (stats) {
            stats.forEach((report) => {
              if (report.type === "outbound-rtp" && report.mediaType === "audio") {
                packetsLost = report.packetsLost || 0
                jitter = report.jitter || 0
              }
              if (report.type === "candidate-pair" && report.state === "succeeded") {
                latency = report.currentRoundTripTime || 0
              }
            })
          }
        })
      }

      setAudioStats((prev) => ({
        ...prev,
        inputLevel,
        latency: latency * 1000, // Convert to ms
        packetsLost,
        jitter,
        sampleRate: audioContextRef.current?.sampleRate || 48000,
      }))
    }, 100)
  }

  // Update gain in real-time
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = settings.inputGain[0] / 100
    }
  }, [settings.inputGain])

  const inputDevices = devices.filter((d) => d.kind === "audioinput")
  const outputDevices = devices.filter((d) => d.kind === "audiooutput")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gerenciamento de Captura de Áudio</h2>
        <div className="flex items-center gap-2">
          <Badge variant={isCapturing ? "default" : "secondary"}>{isCapturing ? "Capturando" : "Parado"}</Badge>
          <Badge variant={isStreaming ? "destructive" : "outline"}>{isStreaming ? "Transmitindo" : "Offline"}</Badge>
        </div>
      </div>

      {/* Device Selection */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            Seleção de Dispositivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Dispositivo de Entrada</label>
              <Select value={selectedInputDevice} onValueChange={setSelectedInputDevice}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecione o microfone" />
                </SelectTrigger>
                <SelectContent>
                  {inputDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Dispositivo de Saída</label>
              <Select value={selectedOutputDevice} onValueChange={setSelectedOutputDevice}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Selecione o alto-falante" />
                </SelectTrigger>
                <SelectContent>
                  {outputDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={loadAudioDevices} variant="outline" size="sm">
            Atualizar Dispositivos
          </Button>
        </CardContent>
      </Card>

      {/* Audio Controls */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Controles de Áudio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Controls */}
          <div className="flex gap-3">
            <Button
              onClick={isCapturing ? stopCapture : startCapture}
              variant={isCapturing ? "destructive" : "default"}
              className="flex-1"
              disabled={!selectedInputDevice}
            >
              {isCapturing ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
              {isCapturing ? "Parar Captura" : "Iniciar Captura"}
            </Button>

            <Button
              onClick={isStreaming ? stopStreaming : startStreaming}
              variant={isStreaming ? "destructive" : "default"}
              className="flex-1"
              disabled={!isCapturing || !settings.streamKey}
            >
              {isStreaming ? <Radio className="w-4 h-4 mr-2" /> : <Wifi className="w-4 h-4 mr-2" />}
              {isStreaming ? "Parar Stream" : "Iniciar Stream"}
            </Button>
          </div>

          {/* Gain Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Ganho de Entrada: {settings.inputGain[0]}%
              </label>
              <Slider
                value={settings.inputGain}
                onValueChange={(value) => setSettings({ ...settings, inputGain: value })}
                max={200}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Ganho de Saída: {settings.outputGain[0]}%
              </label>
              <Slider
                value={settings.outputGain}
                onValueChange={(value) => setSettings({ ...settings, outputGain: value })}
                max={200}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Stream Configuration */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Chave de Stream (Flue.live)</label>
                <input
                  type="text"
                  value={settings.streamKey}
                  onChange={(e) => setSettings({ ...settings, streamKey: e.target.value })}
                  className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white font-mono"
                  placeholder="MAIN001"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Qualidade do Stream</label>
                <Select
                  value={settings.streamQuality}
                  onValueChange={(value) => setSettings({ ...settings, streamQuality: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa (64 kbps)</SelectItem>
                    <SelectItem value="medium">Média (128 kbps)</SelectItem>
                    <SelectItem value="high">Alta (256 kbps)</SelectItem>
                    <SelectItem value="ultra">Ultra (320 kbps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Processing Settings */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Processamento de Áudio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.echoCancellation}
                onCheckedChange={(checked) => setSettings({ ...settings, echoCancellation: checked })}
              />
              <label className="text-sm font-medium text-white">Cancelamento de Eco</label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.noiseSuppression}
                onCheckedChange={(checked) => setSettings({ ...settings, noiseSuppression: checked })}
              />
              <label className="text-sm font-medium text-white">Supressão de Ruído</label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.autoGainControl}
                onCheckedChange={(checked) => setSettings({ ...settings, autoGainControl: checked })}
              />
              <label className="text-sm font-medium text-white">Controle Automático de Ganho</label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.highPassFilter}
                onCheckedChange={(checked) => setSettings({ ...settings, highPassFilter: checked })}
              />
              <label className="text-sm font-medium text-white">Filtro Passa-Alta</label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.compressor}
                onCheckedChange={(checked) => setSettings({ ...settings, compressor: checked })}
              />
              <label className="text-sm font-medium text-white">Compressor</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audio Visualization and Stats */}
      {isCapturing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audio Visualizer */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Visualização de Áudio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AudioVisualizer audioLevel={audioStats.inputLevel} isListening={isCapturing} />
            </CardContent>
          </Card>

          {/* Audio Stats */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estatísticas de Áudio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-300">Nível de Entrada</p>
                    <p className="text-lg font-bold text-white">{Math.round(audioStats.inputLevel)}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-300">Taxa de Amostragem</p>
                    <p className="text-lg font-bold text-white">{audioStats.sampleRate / 1000}kHz</p>
                  </div>
                </div>

                {isStreaming && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-300">Latência</p>
                      <p className="text-lg font-bold text-white">{Math.round(audioStats.latency)}ms</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-300">Pacotes Perdidos</p>
                      <p className="text-lg font-bold text-white">{audioStats.packetsLost}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {audioStats.inputLevel > 5 ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  )}
                  <span className="text-sm text-white">
                    {audioStats.inputLevel > 5 ? "Sinal detectado" : "Nenhum sinal"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
