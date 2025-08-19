"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Plus, Save, FileText } from "lucide-react"

export default function NotesWidget() {
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: "Pontos principais da palestra",
      content: "IA generativa está transformando a forma como trabalhamos...",
      timestamp: new Date().toLocaleTimeString(),
    },
  ])
  const [newNote, setNewNote] = useState({ title: "", content: "" })
  const [isAdding, setIsAdding] = useState(false)

  const handleSaveNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      setNotes((prev) => [
        ...prev,
        {
          id: Date.now(),
          title: newNote.title,
          content: newNote.content,
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
      setNewNote({ title: "", content: "" })
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-black/40 backdrop-blur-md border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-white text-lg">Minhas Notas</CardTitle>
          <Button size="sm" onClick={() => setIsAdding(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isAdding && (
            <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Input
                placeholder="Título da nota"
                value={newNote.title}
                onChange={(e) => setNewNote((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <Textarea
                placeholder="Conteúdo da nota..."
                value={newNote.content}
                onChange={(e) => setNewNote((prev) => ({ ...prev, content: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNote} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAdding(false)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {notes.map((note) => (
            <div key={note.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">{note.title}</h4>
                  <p className="text-gray-400 text-xs">{note.timestamp}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">{note.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
