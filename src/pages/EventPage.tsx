import React from 'react'
import { useParams } from 'react-router-dom'
import EventInterface from '../components/event-interface'

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  
  // For now, show a placeholder since we need to implement client-side data fetching
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Evento {id}</h1>
        <p className="text-gray-300">Carregando interface do evento...</p>
      </div>
    </div>
  )
}