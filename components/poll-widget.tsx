"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase/client"

interface PollWidgetProps {
  poll: any
}

export default function PollWidget({ poll }: PollWidgetProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [results, setResults] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const handleVote = async (option: string) => {
    if (hasVoted || loading) return

    setLoading(true)
    try {
      // In a real app, you'd get the actual user ID
      const userId = `guest-${Math.random().toString(36).substr(2, 9)}`

      const { error } = await supabase.from("poll_responses").insert({
        poll_id: poll.id,
        user_id: userId,
        option: option,
      })

      if (!error) {
        setSelectedOption(option)
        setHasVoted(true)
        // Update local results
        setResults((prev) => ({
          ...prev,
          [option]: (prev[option] || 0) + 1,
        }))
      }
    } catch (err) {
      console.error("Error voting:", err)
    } finally {
      setLoading(false)
    }
  }

  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0)

  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white text-lg">{poll.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {poll.options.map((option: string, index: number) => {
          const votes = results[option] || Math.floor(Math.random() * 50) + 10
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : Math.random() * 100

          return (
            <div key={index} className="space-y-2">
              <Button
                variant={selectedOption === option ? "default" : "outline"}
                onClick={() => handleVote(option)}
                disabled={hasVoted || loading}
                className={`w-full justify-start text-left h-auto py-3 ${
                  selectedOption === option
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                }`}
              >
                <span className="flex-1">{option}</span>
                {hasVoted && <span className="text-sm opacity-75">{percentage.toFixed(1)}%</span>}
              </Button>

              {hasVoted && <Progress value={percentage} className="h-2 bg-white/10" />}
            </div>
          )
        })}

        {hasVoted && (
          <p className="text-center text-sm text-gray-400 mt-4">Total de votos: {totalVotes.toLocaleString()}</p>
        )}
      </CardContent>
    </Card>
  )
}
