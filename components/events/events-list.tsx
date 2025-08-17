"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Globe, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Event {
  id: string
  name: string
  description: string
  start_time: string
  end_time: string
  access_code: string
  is_active: boolean
  libras_enabled: boolean
  translation_enabled: boolean
  max_participants?: number
}

export default function EventsList() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("start_time", { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("[v0] Error loading events:", error)
    } finally {
      setLoading(false)
    }
  }

  const joinEvent = (eventId: string) => {
    router.push(`/event/${eventId}`)
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Carregando eventos...</div>
  }

  if (events.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum evento ativo</h3>
          <p className="text-gray-400">Não há eventos de tradução disponíveis no momento.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <Card key={event.id} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white mb-2">{event.name}</h3>
              {event.description && <p className="text-gray-300 text-sm mb-3">{event.description}</p>}

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default">Ativo</Badge>
                {event.libras_enabled && <Badge variant="secondary">Libras</Badge>}
                {event.translation_enabled && <Badge variant="outline">Tradução</Badge>}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Início: {new Date(event.start_time).toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Fim: {new Date(event.end_time).toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Máx: {event.max_participants || "Ilimitado"}</span>
              </div>
            </div>

            <Button
              onClick={() => joinEvent(event.id)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Participar do Evento
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
