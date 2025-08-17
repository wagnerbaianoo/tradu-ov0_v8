import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EventsList from "@/components/events/events-list"
import LogoutButton from "@/components/auth/logout-button" // Import the LogoutButton component

export default async function EventsPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Eventos Disponíveis</h1>
            <p className="text-gray-300">Participe de eventos de tradução simultânea</p>
          </div>
          <div className="flex items-center gap-4">
            <LogoutButton /> {/* Use the imported LogoutButton component */}
          </div>
        </div>

        <EventsList />
      </div>
    </div>
  )
}
