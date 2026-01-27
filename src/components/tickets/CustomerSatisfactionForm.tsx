'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'

interface CustomerSatisfactionFormProps {
  ticketId: string
  currentRating?: number | null
  currentFeedback?: string | null
  canSubmit: boolean
}

export function CustomerSatisfactionForm({ 
  ticketId, 
  currentRating,
  currentFeedback,
  canSubmit 
}: CustomerSatisfactionFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState<number | null>(currentRating || null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [feedback, setFeedback] = useState(currentFeedback || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!rating) {
      toast.error('Please select a rating')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/satisfaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit satisfaction rating' }))
        throw new Error(errorData.error || 'Failed to submit satisfaction rating')
      }

      toast.success('Thank you for your feedback!', {
        description: 'Your satisfaction rating has been recorded.',
      })
      
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit satisfaction rating')
    } finally {
      setLoading(false)
    }
  }

  // If already submitted, show read-only view
  if (currentRating && !canSubmit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Satisfaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">Rating</Label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${
                      i <= (currentRating || 0) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium">{currentRating}/5</span>
              </div>
            </div>
            {currentFeedback && (
              <div>
                <Label className="text-sm text-muted-foreground">Feedback</Label>
                <p className="text-sm mt-1 text-muted-foreground">{currentFeedback}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show form if can submit
  if (!canSubmit) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rate Your Experience</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          How satisfied were you with the resolution of this ticket?
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm">Rating *</Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoveredRating(i)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="focus:outline-none"
                >
                  <Star 
                    className={`h-8 w-8 transition-colors ${
                      (hoveredRating !== null && i <= hoveredRating) || (rating !== null && i <= rating)
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
              {rating && (
                <span className="ml-2 text-sm font-medium">
                  {rating === 1 && 'Very Dissatisfied'}
                  {rating === 2 && 'Dissatisfied'}
                  {rating === 3 && 'Neutral'}
                  {rating === 4 && 'Satisfied'}
                  {rating === 5 && 'Very Satisfied'}
                </span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="feedback" className="text-sm">Additional Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
              className="mt-2"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading || !rating}
            className="w-full sm:w-auto"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
