"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Volume2, VolumeX, Users, MessageSquare, FileText, BarChart3 } from "lucide-react"
import StreamPlayer from "@/components/stream-player"
import PollWidget from "@/components/poll-widget"
import NotesWidget from "@/components/notes-widget"

interface EventInterfaceProps {
  event: any
  streams: any[]
  polls: any[]
}

export default function EventInterface({ event, streams, polls }: EventInterfaceProps) {
  const [selectedStream, setSelectedStream] = useState(streams[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [participants, setParticipants] = useState(1247)

  useEffect(() => {
    // Simulate real-time participant count updates
    const interval = setInterval(() => {
      setParticipants((prev) => prev + Math.floor(Math.random() * 5) - 2)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{event.name}</h1>
              <p className="text-gray-300">{event.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <Users className="h-4 w-4" />
                <span className="font-mono">{participants.toLocaleString()}</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                AO VIVO
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stream Player */}
            <Card className="bg-black/40 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Transmissão Principal</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <StreamPlayer stream={selectedStream} isPlaying={isPlaying} />
              </CardContent>
            </Card>

            {/* Language Selection */}
            <Card className="bg-black/40 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Idiomas Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {streams.map((stream) => (
                    <Button
                      key={stream.id}
                      variant={selectedStream?.id === stream.id ? "default" : "outline"}
                      onClick={() => setSelectedStream(stream)}
                      className={`flex flex-col items-center gap-2 h-auto py-4 ${
                        selectedStream?.id === stream.id
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                      }`}
                    >
                      <span className="text-2xl">{stream.flag}</span>
                      <span className="text-sm font-medium">{stream.language}</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getQualityColor(stream.quality)}`} />
                        <span className="text-xs">{stream.quality}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Tabs defaultValue="polls" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black/40 border-white/20">
                <TabsTrigger value="polls" className="text-white data-[state=active]:bg-purple-600">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Enquetes
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-white data-[state=active]:bg-purple-600">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-white data-[state=active]:bg-purple-600">
                  <FileText className="h-4 w-4 mr-1" />
                  Notas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="polls" className="mt-4">
                <div className="space-y-4">
                  {polls.map((poll) => (
                    <PollWidget key={poll.id} poll={poll} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="chat" className="mt-4">
                <Card className="bg-black/40 backdrop-blur-md border-white/20">
                  <CardContent className="p-4">
                    <div className="text-center text-gray-400 py-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                      <p>Chat em tempo real</p>
                      <p className="text-sm">Em desenvolvimento</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <NotesWidget />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
