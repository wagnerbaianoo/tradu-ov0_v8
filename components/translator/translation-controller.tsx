"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Volume2, Play, Square } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TranslationControllerProps {
  isConnected: boolean
  isTransmitting: boolean
  onConnectionChange: (connected: boolean) => void
  onTransmissionChange: (transmitting: boolean) => void
  onAudioLevelChange: (level: number) => void
  sourceLanguage: string
  targetLanguage: string
  targetChannel: string
}

export function TranslationController({
  isConnected,
  isTransmitting,
  onConnectionChange,
  onTransmissionChange,
  onAudioLevelChange,
  sourceLanguage,
  targetLanguage,
  targetChannel,
}: TranslationControllerProps) {
  const [micGain, setMicGain] = useState([75])
  const [outputGain, setOutputGain] = useState([80])
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [isRecording, setIsRecording] = useState(false)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Get available audio devices
  useEffect(() => {
    async function getDevices() {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = deviceList.filter((device) => device.kind === "audioinput")
        setDevices(audioInputs)
        if (audioInputs.length > 0 && !selectedDevice) {
          setSelectedDevice(audioInputs[0].deviceId)
        }
      } catch (error) {
        console.error("[v0] Error getting devices:", error)
      }
    }
    getDevices()
  }, [selectedDevice])

  // Audio level monitoring
  useEffect(() => {
    if (!isConnected || !analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    function updateAudioLevel() {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const normalizedLevel = (average / 255) * 100
      onAudioLevelChange(normalizedLevel)

      if (isConnected) {
        requestAnimationFrame(updateAudioLevel)
      }
    }

    updateAudioLevel()
  }, [isConnected, onAudioLevelChange])

  const connectMicrophone = async () => {
    try {
      const constraints = {
        audio: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream

      // Setup audio context for monitoring
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      const gainNode = audioContext.createGain()

      analyser.fftSize = 256
      gainNode.gain.value = micGain[0] / 100

      source.connect(gainNode)
      gainNode.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      onConnectionChange(true)
      console.log("[v0] Microphone connected successfully")
    } catch (error) {
      console.error("[v0] Error connecting microphone:", error)
      alert("Erro ao conectar microfone. Verifique as permissões.")
    }
  }

  const disconnectMicrophone = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    onConnectionChange(false)
    onTransmissionChange(false)
    setIsRecording(false)
    console.log("[v0] Microphone disconnected")
  }

  const startTransmission = async () => {
    if (!mediaStreamRef.current || !targetChannel) {
      alert("Conecte o microfone e selecione um canal primeiro")
      return
    }

    try {
      // Setup MediaRecorder for streaming
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Here we would send the audio data to the translation channel
          console.log("[v0] Sending audio data to channel:", targetChannel)
          // TODO: Implement WebRTC streaming to translation channel
        }
      }

      mediaRecorder.start(100) // Capture every 100ms
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      onTransmissionChange(true)

      console.log("[v0] Translation transmission started")
    } catch (error) {
      console.error("[v0] Error starting transmission:", error)
    }
  }

  const stopTransmission = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
      setIsRecording(false)
      onTransmissionChange(false)
      console.log("[v0] Translation transmission stopped")
    }
  }

  // Update gain in real-time
  useEffect(() => {
    if (audioContextRef.current) {
      const gainNodes = audioContextRef.current.createGain()
      gainNodes.gain.value = micGain[0] / 100
    }
  }, [micGain])

  return (
    <div className="space-y-6">
      {/* Device Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Dispositivo de Áudio</label>
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="w-full p-2 rounded-md bg-white/10 border border-white/20 text-white"
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId} className="text-black">
              {device.label || `Microfone ${device.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </div>

      {/* Connection Controls */}
      <div className="flex gap-3">
        <Button
          onClick={isConnected ? disconnectMicrophone : connectMicrophone}
          variant={isConnected ? "destructive" : "default"}
          className="flex-1"
        >
          {isConnected ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
          {isConnected ? "Desconectar" : "Conectar Microfone"}
        </Button>
      </div>

      {/* Gain Controls */}
      {isConnected && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Ganho do Microfone: {micGain[0]}%
            </label>
            <Slider value={micGain} onValueChange={setMicGain} max={150} min={0} step={5} className="w-full" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Ganho de Saída: {outputGain[0]}%
            </label>
            <Slider value={outputGain} onValueChange={setOutputGain} max={150} min={0} step={5} className="w-full" />
          </div>
        </div>
      )}

      {/* Translation Status */}
      {isConnected && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">Status da Tradução:</span>
                <Badge variant={isTransmitting ? "destructive" : "outline"}>
                  {isTransmitting ? "Transmitindo" : "Parado"}
                </Badge>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <div>Origem: {sourceLanguage}</div>
                <div>Destino: {targetLanguage}</div>
                <div>Canal: {targetChannel || "Nenhum selecionado"}</div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={startTransmission}
                  disabled={isTransmitting || !targetChannel}
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Transmitir Tradução
                </Button>

                <Button
                  onClick={stopTransmission}
                  disabled={!isTransmitting}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Parar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
