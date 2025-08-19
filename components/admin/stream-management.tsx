"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Radio, TestTube, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Stream {
  id: string
  event_id: string
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
  event_name?: string
}

interface StreamManagementProps {
  onStatsUpdate: () => void
}

export function StreamManagement({ onStatsUpdate }: StreamManagementProps) {
  const [streams, setStreams] = useState<Stream[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStream, setEditingStream] = useState<Stream | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [testingStreams, setTestingStreams] = useState<Set<string>>(new Set())
  const [streamStatus, setStreamStatus] = useState<Record<string, "online" | "offline" | "testing">>({})
  const [formData, setFormData] = useState({
    event_id: "",
    language: "",
    language_code: "",
    flag: "",
    stream_type: "AUDIO" as const,
    url: "",
    is_original: false,
    quality: "GOOD" as const,
    enabled: true,
    input_type: "flue" as const,
    flue_key: "",
    mode: "audio-only" as const,
  })
  const supabase = createClient()

  useEffect(() => {
    loadStreams()
    loadEvents()
  }, [])

  const loadStreams = async () => {
    try {
      const { data, error } = await supabase
        .from("streams")
        .select(`
          *,
          events!inner(name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const streamsWithEventName =
        data?.map((stream) => ({
          ...stream,
          event_name: stream.events?.name || "Evento sem nome",
        })) || []

      setStreams(streamsWithEventName)
    } catch (error) {
      console.error("[v0] Error loading streams:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase.from("events").select("id, name, is_active").eq("is_active", true)

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("[v0] Error loading events:", error)
    }
  }

  const testStreamConnection = async (stream: Stream) => {
    setTestingStreams((prev) => new Set(prev).add(stream.id))
    setStreamStatus((prev) => ({ ...prev, [stream.id]: "testing" }))

    try {
      let testUrl = stream.url

      if (stream.input_type === "flue" && stream.flue_key) {
        testUrl = `https://whep.flue.live/?stream=${stream.flue_key}`
      }

      // Test connection with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(testUrl, {
        method: "HEAD",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const status = response.ok ? "online" : "offline"
      setStreamStatus((prev) => ({ ...prev, [stream.id]: status }))

      console.log(`[v0] Stream ${stream.language} test result:`, status)
    } catch (error) {
      console.error(`[v0] Stream test failed for ${stream.language}:`, error)
      setStreamStatus((prev) => ({ ...prev, [stream.id]: "offline" }))
    } finally {
      setTestingStreams((prev) => {
        const newSet = new Set(prev)
        newSet.delete(stream.id)
        return newSet
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let streamUrl = formData.url

      // Auto-generate Flue.live URL if using flue input type
      if (formData.input_type === "flue" && formData.flue_key) {
        streamUrl = `https://whep.flue.live/?stream=${formData.flue_key}`
      }

      const streamData = {
        ...formData,
        url: streamUrl,
      }

      if (editingStream) {
        const { error } = await supabase.from("streams").update(streamData).eq("id", editingStream.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("streams").insert(streamData)
        if (error) throw error
      }

      await loadStreams()
      onStatsUpdate()
      resetForm()
    } catch (error) {
      console.error("[v0] Error saving stream:", error)
      alert("Erro ao salvar stream")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (stream: Stream) => {
    setEditingStream(stream)
    setFormData({
      event_id: stream.event_id,
      language: stream.language,
      language_code: stream.language_code,
      flag: stream.flag,
      stream_type: stream.stream_type,
      url: stream.url,
      is_original: stream.is_original,
      quality: stream.quality,
      enabled: stream.enabled,
      input_type: stream.input_type,
      flue_key: stream.flue_key || "",
      mode: stream.mode,
    })
    setShowForm(true)
  }

  const handleDelete = async (streamId: string) => {
    if (!confirm("Tem certeza que deseja excluir este stream?")) return

    try {
      const { error } = await supabase.from("streams").delete().eq("id", streamId)
      if (error) throw error

      await loadStreams()
      onStatsUpdate()
    } catch (error) {
      console.error("[v0] Error deleting stream:", error)
      alert("Erro ao excluir stream")
    }
  }

  const resetForm = () => {
    setFormData({
      event_id: "",
      language: "",
      language_code: "",
      flag: "",
      stream_type: "AUDIO",
      url: "",
      is_original: false,
      quality: "GOOD",
      enabled: true,
      input_type: "flue",
      flue_key: "",
      mode: "audio-only",
    })
    setEditingStream(null)
    setShowForm(false)
  }

  const generateFlueKey = () => {
    const key = Math.random().toString(36).substring(2, 8).toUpperCase()
    setFormData({ ...formData, flue_key: key })
  }

  const getStatusIcon = (streamId: string) => {
    const status = streamStatus[streamId]
    const isTesting = testingStreams.has(streamId)

    if (isTesting) {
      return <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
    }

    switch (status) {
      case "online":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "offline":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Radio className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gerenciamento de Streams</h2>
        <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Stream
        </Button>
      </div>

      {/* Stream Form */}
      {showForm && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">{editingStream ? "Editar Stream" : "Criar Nova Stream"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Evento</label>
                  <Select
                    value={formData.event_id}
                    onValueChange={(value) => setFormData({ ...formData, event_id: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Tipo de Stream</label>
                  <Select
                    value={formData.stream_type}
                    onValueChange={(value: any) => setFormData({ ...formData, stream_type: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUDIO">Áudio</SelectItem>
                      <SelectItem value="VIDEO">Vídeo</SelectItem>
                      <SelectItem value="LIBRAS">Libras</SelectItem>
                      <SelectItem value="TRANSLATION">Tradução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Idioma</label>
                  <Input
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Português"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Código do Idioma</label>
                  <Input
                    value={formData.language_code}
                    onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="pt-BR"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Flag</label>
                  <Input
                    value={formData.flag}
                    onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="🇧🇷"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Tipo de Entrada</label>
                  <Select
                    value={formData.input_type}
                    onValueChange={(value: any) => setFormData({ ...formData, input_type: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flue">Flue.live</SelectItem>
                      <SelectItem value="direct">Direto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Modo</label>
                  <Select
                    value={formData.mode}
                    onValueChange={(value: any) => setFormData({ ...formData, mode: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audio-only">Apenas Áudio</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.input_type === "flue" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Chave Flue.live</label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.flue_key}
                      onChange={(e) => setFormData({ ...formData, flue_key: e.target.value })}
                      className="bg-white/10 border-white/20 text-white font-mono"
                      placeholder="PL001"
                      required
                    />
                    <Button type="button" onClick={generateFlueKey} variant="outline" size="sm">
                      Gerar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    URL será gerada automaticamente: https://whep.flue.live/?stream={formData.flue_key}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">URL da Stream</label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="https://example.com/stream"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                  <label className="text-sm font-medium text-white">Stream Habilitada</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_original}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_original: checked })}
                  />
                  <label className="text-sm font-medium text-white">Stream Original</label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Qualidade</label>
                  <Select
                    value={formData.quality}
                    onValueChange={(value: any) => setFormData({ ...formData, quality: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXCELLENT">Excelente</SelectItem>
                      <SelectItem value="GOOD">Boa</SelectItem>
                      <SelectItem value="FAIR">Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {editingStream ? "Atualizar" : "Criar"} Stream
                </Button>
                <Button type="button" onClick={resetForm} variant="outline">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Streams List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Carregando streams...</div>
        ) : streams.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Nenhuma stream encontrada</div>
        ) : (
          streams.map((stream) => (
            <Card key={stream.id} className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{stream.flag}</span>
                      <h3 className="text-xl font-semibold text-white">{stream.language}</h3>
                      <Badge variant={stream.enabled ? "default" : "secondary"}>
                        {stream.enabled ? "Habilitada" : "Desabilitada"}
                      </Badge>
                      <Badge variant={stream.is_original ? "default" : "outline"}>
                        {stream.is_original ? "Original" : "Tradução"}
                      </Badge>
                      <Badge variant="outline">{stream.stream_type}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-400 mb-3">
                      <div>Evento: {stream.event_name}</div>
                      <div>Código: {stream.language_code}</div>
                      <div>Qualidade: {stream.quality}</div>
                      <div>Tipo: {stream.input_type === "flue" ? `Flue.live (${stream.flue_key})` : "Direto"}</div>
                    </div>

                    <div className="text-xs text-gray-500 font-mono break-all">{stream.url}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(stream.id)}
                    <Button
                      onClick={() => testStreamConnection(stream)}
                      size="sm"
                      variant="outline"
                      disabled={testingStreams.has(stream.id)}
                    >
                      <TestTube className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleEdit(stream)} size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleDelete(stream.id)} size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
