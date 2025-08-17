"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Tag, Sync, SyncOff, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Fuse from "fuse.js"

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
  synced: boolean
}

export function EnhancedNotesWidget() {
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" })
  const [searchQuery, setSearchQuery] = useState("")
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle")
  const fuseRef = useRef<Fuse<Note> | null>(null)
  const supabase = createClient()

  // Initialize Fuse.js for fuzzy search
  useEffect(() => {
    fuseRef.current = new Fuse(notes, {
      keys: ["title", "content", "tags"],
      threshold: 0.3,
      includeScore: true,
    })
    setFilteredNotes(notes)
  }, [notes])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineNotes()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Load notes from IndexedDB and Supabase
  useEffect(() => {
    loadNotes()
  }, [])

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes)
      return
    }

    if (fuseRef.current) {
      const results = fuseRef.current.search(searchQuery)
      setFilteredNotes(results.map((result) => result.item))
    }
  }, [searchQuery, notes])

  const loadNotes = async () => {
    try {
      // Load from IndexedDB first (offline support)
      const offlineNotes = await getNotesFromIndexedDB()
      setNotes(offlineNotes)

      // Then sync with Supabase if online
      if (isOnline) {
        const { data: onlineNotes, error } = await supabase
          .from("notes")
          .select("*")
          .order("updated_at", { ascending: false })

        if (!error && onlineNotes) {
          const mergedNotes = mergeNotes(offlineNotes, onlineNotes)
          setNotes(mergedNotes)
          await saveNotesToIndexedDB(mergedNotes)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading notes:", error)
    }
  }

  const saveNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return

    const note: Note = {
      id: crypto.randomUUID(),
      title: newNote.title,
      content: newNote.content,
      tags: newNote.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
    }

    try {
      // Save to IndexedDB immediately
      const updatedNotes = [note, ...notes]
      setNotes(updatedNotes)
      await saveNotesToIndexedDB(updatedNotes)

      // Try to sync with Supabase if online
      if (isOnline) {
        const { error } = await supabase.from("notes").insert({
          id: note.id,
          user_id: getUserId(),
          title: note.title,
          content: note.content,
          tags: note.tags,
        })

        if (!error) {
          note.synced = true
          setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)))
        }
      }

      // Clear form
      setNewNote({ title: "", content: "", tags: "" })
    } catch (error) {
      console.error("[v0] Error saving note:", error)
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      const updatedNotes = notes.filter((note) => note.id !== noteId)
      setNotes(updatedNotes)
      await saveNotesToIndexedDB(updatedNotes)

      // Delete from Supabase if online
      if (isOnline) {
        await supabase.from("notes").delete().eq("id", noteId)
      }
    } catch (error) {
      console.error("[v0] Error deleting note:", error)
    }
  }

  const syncOfflineNotes = async () => {
    if (!isOnline) return

    setSyncStatus("syncing")
    try {
      const unsyncedNotes = notes.filter((note) => !note.synced)

      for (const note of unsyncedNotes) {
        const { error } = await supabase.from("notes").upsert({
          id: note.id,
          user_id: getUserId(),
          title: note.title,
          content: note.content,
          tags: note.tags,
          created_at: note.created_at,
          updated_at: note.updated_at,
        })

        if (!error) {
          note.synced = true
        }
      }

      setNotes([...notes])
      await saveNotesToIndexedDB(notes)
      setSyncStatus("idle")
    } catch (error) {
      console.error("[v0] Error syncing notes:", error)
      setSyncStatus("error")
    }
  }

  // IndexedDB operations
  const getNotesFromIndexedDB = async (): Promise<Note[]> => {
    return new Promise((resolve) => {
      const request = indexedDB.open("TranslateEventDB", 1)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains("notes")) {
          db.createObjectStore("notes", { keyPath: "id" })
        }
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(["notes"], "readonly")
        const store = transaction.objectStore("notes")
        const getAllRequest = store.getAll()

        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result || [])
        }

        getAllRequest.onerror = () => {
          resolve([])
        }
      }

      request.onerror = () => {
        resolve([])
      }
    })
  }

  const saveNotesToIndexedDB = async (notesToSave: Note[]) => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.open("TranslateEventDB", 1)

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(["notes"], "readwrite")
        const store = transaction.objectStore("notes")

        // Clear existing notes
        store.clear()

        // Add all notes
        notesToSave.forEach((note) => {
          store.add(note)
        })

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => resolve()
      }

      request.onerror = () => resolve()
    })
  }

  const mergeNotes = (offline: Note[], online: any[]): Note[] => {
    const merged = new Map<string, Note>()

    // Add offline notes
    offline.forEach((note) => merged.set(note.id, note))

    // Merge online notes (prefer newer timestamps)
    online.forEach((onlineNote) => {
      const offlineNote = merged.get(onlineNote.id)
      if (!offlineNote || new Date(onlineNote.updated_at) > new Date(offlineNote.updated_at)) {
        merged.set(onlineNote.id, {
          ...onlineNote,
          synced: true,
        })
      }
    })

    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
  }

  const getUserId = () => {
    const session = localStorage.getItem("translateEvent_session")
    return session ? JSON.parse(session).sessionId : "anonymous"
  }

  const unsyncedCount = notes.filter((note) => !note.synced).length

  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Notas Pessoais
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge variant="destructive" className="text-xs">
                <SyncOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            {unsyncedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unsyncedCount} não sincronizadas
              </Badge>
            )}
            {syncStatus === "syncing" && (
              <Badge variant="outline" className="text-xs">
                <Sync className="w-3 h-3 mr-1 animate-spin" />
                Sincronizando
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>

        {/* New Note Form */}
        <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
          <Input
            placeholder="Título da nota"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
          <Textarea
            placeholder="Conteúdo da nota..."
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[80px]"
          />
          <Input
            placeholder="Tags (separadas por vírgula)"
            value={newNote.tags}
            onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
          <Button onClick={saveNote} className="w-full bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Nota
          </Button>
        </div>

        {/* Notes List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNotes.map((note) => (
            <div key={note.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-white">{note.title}</h4>
                <div className="flex items-center gap-2">
                  {!note.synced && <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Não sincronizada" />}
                  <Button
                    onClick={() => deleteNote(note.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-3">{note.content}</p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-gray-500 text-xs">{new Date(note.updated_at).toLocaleString("pt-BR")}</p>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              {searchQuery ? "Nenhuma nota encontrada" : "Nenhuma nota ainda"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
