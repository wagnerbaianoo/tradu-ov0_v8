import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import EventInterface from "@/components/event-interface"

interface EventPageProps {
  params: {
    id: string
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const supabase = createClient()

  // Get event details
  const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", params.id).single()

  if (eventError || !event) {
    notFound()
  }

  // Get streams for this event
  const { data: streams } = await supabase
    .from("streams")
    .select("*")
    .eq("event_id", params.id)
    .eq("enabled", true)
    .order("is_original", { ascending: false })

  // Get active polls
  const { data: polls } = await supabase.from("polls").select("*").eq("event_id", params.id).eq("status", "ACTIVE")

  return <EventInterface event={event} streams={streams || []} polls={polls || []} />
}
