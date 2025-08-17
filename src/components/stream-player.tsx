"use client"

import React from "react"
import { useEffect, useRef, useState } from "react"
import { Play, Pause, Volume2, VolumeX, Settings, Maximize, Minimize, RotateCcw, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { webRTCClient } from "@/lib/audio/webrtc-client"

interface StreamPlayerProps {
  stream: any
  isPlaying: boolean
  onPlayingChange?: (playing: boolean) => void
  autoPlay?: boolean
  showControls?: boolean
}

const StreamPlayer = React.memo(function StreamPlayer({
  stream,
  isPlaying,
  onPlayingChange,
  autoPlay = false,
  showControls = true,
}: StreamPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [volume, setVolume] = useState([80])
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [connectionType, setConnectionType] = useState<"webrtc" | "hls" | "none">("none")
  const [streamUrl, setStreamUrl] = useState<string>("")
  const [quality, setQuality] = useState<"auto" | "1080p" | "720p" | "480p" | "360p">("auto")
  const [isBuffering, setIsBuffering] = useState(false)
  const [streamStats, setStreamStats] = useState({
    latency: 0,
    bitrate: 0,
    fps: 0,
    resolution: "",
    packetsLost: 0,
  })
  const [retryCount, setRetryCount] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (!stream) return

    const setupStream = async () => {
      try {
        setIsBuffering(true)

        if (stream.input_type === "flue" && stream.flue_key) {
          try {
            const streamConfig = {
              type: "flue" as const,
              key: stream.flue_key,
              mode:
                stream.stream_type === "VIDEO" || stream.stream_type === "LIBRAS"
                  ? ("video" as const)
                  : ("audio-only" as const),
              url: `https://whep.flue.live/?stream=${stream.flue_key}`,
            }

            await webRTCClient.connectToFlueStream(streamConfig)
            const remoteStream = webRTCClient.getRemoteStream()

            if (remoteStream) {
              setConnectionType("webrtc")
              const mediaElement =
                stream.stream_type === "VIDEO" || stream.stream_type === "LIBRAS" ? videoRef.current : audioRef.current

              if (mediaElement) {
                mediaElement.srcObject = remoteStream
                if (autoPlay) {
                  await mediaElement.play()
                  onPlayingChange?.(true)
                }
              }

              // Start monitoring stream stats
              startStatsMonitoring()
              setIsBuffering(false)
              return
            }
          } catch (error) {
            console.log("[v0] WebRTC failed, falling back to HLS:", error)
            setRetryCount((prev) => prev + 1)
          }

          const qualityParam = quality !== "auto" ? `&quality=${quality}` : ""
          const hlsUrl = `https://whep.flue.live/?stream=${stream.flue_key}${qualityParam}`
          setStreamUrl(hlsUrl)
          setConnectionType("hls")
        } else {
          // Direct stream URL
          setStreamUrl(stream.url)
          setConnectionType("hls")
        }

        setIsBuffering(false)
      } catch (error) {
        console.error("[v0] Error setting up stream:", error)
        setConnectionType("none")
        setIsBuffering(false)
      }
    }

    setupStream()
  }, [stream, quality, autoPlay])

  const startStatsMonitoring = () => {
    const interval = setInterval(async () => {
      if (connectionType === "webrtc") {
        const stats = await webRTCClient.getStats()
        if (stats) {
          let latency = 0
          let bitrate = 0
          let packetsLost = 0
          let fps = 0
          let resolution = ""

          stats.forEach((report) => {
            if (report.type === "inbound-rtp") {
              bitrate = report.bytesReceived ? Math.round((report.bytesReceived * 8) / 1000) : 0
              packetsLost = report.packetsLost || 0
              fps = report.framesPerSecond || 0
            }
            if (report.type === "candidate-pair" && report.state === "succeeded") {
              latency = report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) : 0
            }
            if (report.type === "track" && report.kind === "video") {
              resolution = `${report.frameWidth}x${report.frameHeight}`
            }
          })

          setStreamStats({ latency, bitrate, fps, resolution, packetsLost })
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }

  useEffect(() => {
    const mediaElement =
      stream?.stream_type === "VIDEO" || stream?.stream_type === "LIBRAS" ? videoRef.current : audioRef.current

    if (mediaElement) {
      if (isPlaying) {
        mediaElement.play().catch(console.error)
      } else {
        mediaElement.pause()
      }
    }
  }, [isPlaying, stream])

  useEffect(() => {
    const mediaElement =
      stream?.stream_type === "VIDEO" || stream?.stream_type === "LIBRAS" ? videoRef.current : audioRef.current

    if (mediaElement) {
      mediaElement.volume = isMuted ? 0 : volume[0] / 100
    }
  }, [volume, isMuted, stream])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const togglePlay = () => {
    const newPlaying = !isPlaying
    onPlayingChange?.(newPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }
  }

  const retryConnection = async () => {
    setRetryCount((prev) => prev + 1)
    setConnectionType("none")

    // Retry setup after a short delay
    setTimeout(() => {
      if (stream) {
        // Trigger re-setup by updating a dependency
        setIsBuffering(true)
      }
    }, 1000)
  }

  if (!stream) {
    return (
      <div className="aspect-video bg-black/60 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📺</div>
          <p className="text-gray-400">Selecione um stream para começar</p>
        </div>
      </div>
    )
  }

  const isVideoStream = stream.stream_type === "VIDEO" || stream.stream_type === "LIBRAS"

  return (
    <div ref={containerRef} className="space-y-4">
      <div
        className={`${isVideoStream ? "aspect-video" : "aspect-[4/3]"} bg-black/60 rounded-lg flex items-center justify-center relative overflow-hidden`}
      >
        {isVideoStream ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              loop
              playsInline
              src={connectionType === "hls" ? streamUrl : undefined}
              onLoadStart={() => setIsBuffering(true)}
              onCanPlay={() => setIsBuffering(false)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
            />

            {stream.stream_type === "LIBRAS" && (
              <div className="absolute top-4 left-4 bg-black/70 rounded-lg p-3">
                <div className="text-white text-sm font-medium flex items-center gap-2">
                  <span className="text-lg">🤟</span>
                  Intérprete de Libras
                </div>
                <div className="text-gray-300 text-xs">Avatar Ana - Profissional</div>
                <div className="text-gray-400 text-xs mt-1">
                  {connectionType === "webrtc" ? "Baixa Latência" : "HLS"}
                </div>
              </div>
            )}

            {/* Connection status indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Badge
                variant={
                  connectionType === "webrtc" ? "default" : connectionType === "hls" ? "secondary" : "destructive"
                }
                className="text-xs"
              >
                {connectionType === "webrtc" && <Wifi className="w-3 h-3 mr-1" />}
                {connectionType === "hls" && <Wifi className="w-3 h-3 mr-1" />}
                {connectionType === "none" && <WifiOff className="w-3 h-3 mr-1" />}
                {connectionType === "webrtc" ? "WebRTC" : connectionType === "hls" ? "HLS" : "Offline"}
              </Badge>

              {connectionType === "webrtc" && streamStats.latency > 0 && (
                <Badge variant="outline" className="text-xs bg-black/50">
                  {streamStats.latency}ms
                </Badge>
              )}
            </div>

            {/* Buffering indicator */}
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}

            {showControls && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                {connectionType === "none" && (
                  <Button onClick={retryConnection} size="sm" variant="secondary" className="bg-black/70">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  size="sm"
                  variant="secondary"
                  className="bg-black/70"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button onClick={toggleFullscreen} size="sm" variant="secondary" className="bg-black/70">
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">{stream.flag}</div>
            <p className="text-white text-xl font-medium">{stream.language}</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              {isPlaying ? <Pause className="h-6 w-6 text-green-400" /> : <Play className="h-6 w-6 text-gray-400" />}
              <span className="text-gray-400">{isPlaying ? "Reproduzindo" : "Pausado"}</span>
            </div>

            {/* Connection status for audio */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge
                variant={
                  connectionType === "webrtc" ? "default" : connectionType === "hls" ? "secondary" : "destructive"
                }
                className="text-xs"
              >
                {connectionType === "webrtc"
                  ? "WebRTC (Baixa Latência)"
                  : connectionType === "hls"
                    ? "HLS (Flue.live)"
                    : "Desconectado"}
              </Badge>
              {connectionType === "webrtc" && streamStats.latency > 0 && (
                <Badge variant="outline" className="text-xs">
                  {streamStats.latency}ms
                </Badge>
              )}
            </div>

            {/* Buffering for audio */}
            {isBuffering && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                <p className="text-gray-400 text-sm mt-2">Carregando...</p>
              </div>
            )}
          </div>
        )}

        {/* Audio element for audio streams */}
        {!isVideoStream && (
          <audio
            ref={audioRef}
            loop
            className="hidden"
            src={connectionType === "hls" ? streamUrl : undefined}
            onLoadStart={() => setIsBuffering(true)}
            onCanPlay={() => setIsBuffering(false)}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
          />
        )}
      </div>

      {showControls && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button onClick={togglePlay} size="sm" variant="outline" className="bg-white/10 border-white/20">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <Button onClick={toggleMute} size="sm" variant="outline" className="bg-white/10 border-white/20">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-2 min-w-[120px]">
                <Volume2 className="h-4 w-4 text-gray-400" />
                <Slider value={volume} onValueChange={setVolume} max={100} min={0} step={5} className="flex-1" />
                <span className="text-xs text-gray-400 w-8">{volume[0]}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {connectionType === "none" && (
                <Button onClick={retryConnection} size="sm" variant="outline" className="bg-white/10 border-white/20">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={() => setShowSettings(!showSettings)}
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Qualidade</label>
                      <Select value={quality} onValueChange={(value: any) => setQuality(value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                          <SelectItem value="720p">720p (HD)</SelectItem>
                          <SelectItem value="480p">480p (SD)</SelectItem>
                          <SelectItem value="360p">360p (Baixa)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Protocolo</label>
                      <div className="text-sm text-gray-300">
                        {connectionType === "webrtc"
                          ? "WebRTC (Baixa Latência)"
                          : connectionType === "hls"
                            ? "HLS (Compatibilidade)"
                            : "Desconectado"}
                      </div>
                    </div>
                  </div>

                  {/* Stream Statistics */}
                  {connectionType === "webrtc" && (
                    <div className="border-t border-white/10 pt-4">
                      <div className="text-sm font-medium text-white mb-2">Estatísticas da Stream</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-300">
                        <div>
                          <div className="text-gray-400">Latência</div>
                          <div className="font-medium">{streamStats.latency}ms</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Bitrate</div>
                          <div className="font-medium">{streamStats.bitrate} kbps</div>
                        </div>
                        {isVideoStream && (
                          <>
                            <div>
                              <div className="text-gray-400">FPS</div>
                              <div className="font-medium">{streamStats.fps}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Resolução</div>
                              <div className="font-medium">{streamStats.resolution || "N/A"}</div>
                            </div>
                          </>
                        )}
                      </div>
                      {streamStats.packetsLost > 0 && (
                        <div className="text-xs text-yellow-400 mt-2">Pacotes perdidos: {streamStats.packetsLost}</div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stream Info */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span>Qualidade: {quality}</span>
              <span>{stream.is_original ? "Original" : "Tradução"}</span>
              <span>Modo: {stream.mode}</span>
              {retryCount > 0 && <span className="text-yellow-400">Tentativas: {retryCount}</span>}
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionType === "webrtc"
                    ? "bg-green-500"
                    : connectionType === "hls"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              <span className="text-xs">
                {connectionType === "webrtc" ? "WebRTC" : connectionType === "hls" ? "HLS" : "Offline"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
})

export default StreamPlayer
