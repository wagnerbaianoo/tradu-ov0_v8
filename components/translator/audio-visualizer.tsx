"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Volume2, VolumeX } from "lucide-react"

interface AudioVisualizerProps {
  audioLevel: number
  isListening: boolean
}

export function AudioVisualizer({ audioLevel, isListening }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      const width = canvas.width
      const height = canvas.height

      // Clear canvas
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)"
      ctx.fillRect(0, 0, width, height)

      if (isListening) {
        // Draw waveform bars
        const barCount = 32
        const barWidth = width / barCount
        const maxBarHeight = height * 0.8

        for (let i = 0; i < barCount; i++) {
          // Simulate waveform with some randomness based on audio level
          const baseHeight = (audioLevel / 100) * maxBarHeight
          const variation = Math.sin(Date.now() * 0.01 + i * 0.5) * 0.3 + 0.7
          const barHeight = Math.max(2, baseHeight * variation)

          const x = i * barWidth
          const y = height - barHeight

          // Create gradient
          const gradient = ctx.createLinearGradient(0, height, 0, 0)
          gradient.addColorStop(0, "#10b981")
          gradient.addColorStop(0.5, "#34d399")
          gradient.addColorStop(1, "#6ee7b7")

          ctx.fillStyle = gradient
          ctx.fillRect(x, y, barWidth - 2, barHeight)
        }

        // Draw audio level indicator
        const levelWidth = (audioLevel / 100) * width
        ctx.fillStyle = "rgba(16, 185, 129, 0.3)"
        ctx.fillRect(0, height - 4, levelWidth, 4)
      } else {
        // Draw inactive state
        ctx.fillStyle = "rgba(148, 163, 184, 0.3)"
        ctx.fillRect(0, height / 2 - 1, width, 2)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioLevel, isListening])

  return (
    <div className="space-y-4">
      {/* Audio Level Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          {isListening ? (
            <Volume2 className="w-5 h-5 text-green-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-slate-400" />
          )}
          <span className="text-sm">{isListening ? "Monitorando Áudio" : "Áudio Desconectado"}</span>
        </div>
        <div className="text-sm text-slate-300">Nível: {Math.round(audioLevel)}%</div>
      </div>

      {/* Waveform Visualizer */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={120}
            className="w-full h-24 rounded"
            style={{ imageRendering: "pixelated" }}
          />
        </CardContent>
      </Card>

      {/* Audio Level Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Silêncio</span>
          <span>Nível Ideal</span>
          <span>Muito Alto</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-150 ${
              audioLevel < 20
                ? "bg-slate-500"
                : audioLevel < 70
                  ? "bg-green-500"
                  : audioLevel < 90
                    ? "bg-yellow-500"
                    : "bg-red-500"
            }`}
            style={{ width: `${Math.min(audioLevel, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
