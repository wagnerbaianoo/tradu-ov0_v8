"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Users, Globe, QrCode, Camera, X } from "lucide-react"

export default function EventAccessForm() {
  const [accessCode, setAccessCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt">("prompt")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Check if event exists with this access code
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("access_code", accessCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (eventError || !event) {
        setError("Código de acesso inválido ou evento não encontrado")
        return
      }

      // Create user session
      const sessionId = crypto.randomUUID()
      await supabase.from("user_sessions").insert({
        user_id: sessionId,
        event_id: event.id,
      })

      // Store session in localStorage for PWA
      localStorage.setItem(
        "translateEvent_session",
        JSON.stringify({
          sessionId,
          eventId: event.id,
          eventName: event.name,
          accessCode: accessCode.toUpperCase(),
          joinedAt: new Date().toISOString(),
        }),
      )

      // Redirect to event page
      router.push(`/event/${event.id}`)
    } catch (err) {
      setError("Erro ao acessar evento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const startQRScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      setCameraPermission("granted")
      setShowQRScanner(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Start QR code detection
      scanQRCode()
    } catch (error) {
      console.error("[v0] Camera access denied:", error)
      setCameraPermission("denied")
      setError("Acesso à câmera negado. Use o código manual.")
    }
  }

  const stopQRScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setShowQRScanner(false)
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Simple QR code detection (in production, use a proper QR library like jsQR)
        try {
          // This is a simplified QR detection - in real implementation use jsQR
          const qrCode = detectQRCode(imageData)
          if (qrCode) {
            setAccessCode(qrCode)
            stopQRScanner()
            // Auto-submit if valid format
            if (qrCode.match(/^[A-Z0-9]{4,10}$/)) {
              handleSubmit(new Event("submit") as any)
            }
          }
        } catch (error) {
          console.log("[v0] QR detection error:", error)
        }
      }

      if (showQRScanner) {
        requestAnimationFrame(scan)
      }
    }

    scan()
  }

  // Simplified QR detection (replace with jsQR in production)
  const detectQRCode = (imageData: ImageData): string | null => {
    // This is a placeholder - in production use jsQR library
    // For demo purposes, we'll simulate QR detection
    const mockQRCodes = ["TECH2025", "MED2025", "CONF2025"]

    // Simulate random QR detection for demo
    if (Math.random() > 0.95) {
      return mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)]
    }

    return null
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Acessar Evento</CardTitle>
        <CardDescription className="text-gray-300">Escaneie o QR Code ou digite o código de acesso</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/40 border-white/20">
            <TabsTrigger value="manual" className="text-white data-[state=active]:bg-purple-600">
              <Globe className="w-4 h-4 mr-2" />
              Código Manual
            </TabsTrigger>
            <TabsTrigger value="qr" className="text-white data-[state=active]:bg-purple-600">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded">{error}</div>
              )}

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Ex: TECH2025"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-center text-lg font-mono uppercase"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !accessCode.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Acessando...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Entrar no Evento
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="qr" className="mt-6">
            <div className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded">{error}</div>
              )}

              {!showQRScanner ? (
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-white/10 rounded-lg flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                  <p className="text-gray-300 text-sm">Posicione o QR Code do evento na frente da câmera</p>
                  <Button
                    onClick={startQRScanner}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                    disabled={cameraPermission === "denied"}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {cameraPermission === "denied" ? "Câmera Indisponível" : "Abrir Câmera"}
                  </Button>
                  {cameraPermission === "denied" && (
                    <p className="text-red-300 text-xs">Permissão de câmera negada. Use a aba "Código Manual".</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video ref={videoRef} className="w-full h-64 bg-black rounded-lg object-cover" playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* QR Scanner Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white/50 rounded-lg">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                      </div>
                    </div>

                    <Button onClick={stopQRScanner} size="sm" variant="destructive" className="absolute top-2 right-2">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-center text-gray-300 text-sm">
                    Posicione o QR Code dentro do quadrado para escanear
                  </p>

                  {accessCode && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-300 px-4 py-3 rounded text-center">
                      Código detectado: <span className="font-mono font-bold">{accessCode}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm mb-4">Evento de demonstração disponível:</p>
          <Button
            variant="outline"
            onClick={() => setAccessCode("TECH2025")}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <Users className="mr-2 h-4 w-4" />
            Tech Summit 2025
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
