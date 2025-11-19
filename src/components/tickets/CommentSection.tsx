'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Lock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { TicketCommentWithUser } from '@/types/database'

interface CommentSectionProps {
  ticketId: string
  comments: TicketCommentWithUser[]
  canManage: boolean
}

export function CommentSection({ ticketId, comments, canManage }: CommentSectionProps) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, is_internal: isInternal }),
      })

      if (!response.ok) throw new Error('Failed to add comment')

      setComment('')
      setIsInternal(false)
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((c) => (
          <Card key={c.id} className={c.is_internal ? 'border-accent/50 bg-accent/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-sm">
                    {c.user.first_name} {c.user.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(c.created_at)}
                  </p>
                </div>
                {c.is_internal && (
                  <div className="flex items-center gap-1 text-xs text-accent">
                    <Lock className="h-3 w-3" />
                    Internal
                  </div>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.comment}</p>
            </CardContent>
          </Card>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet
          </p>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment or note..."
          rows={3}
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          {canManage && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="internal"
                checked={isInternal}
                onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="internal" className="text-sm cursor-pointer">
                Internal note (not visible to client)
              </Label>
            </div>
          )}
          <Button type="submit" disabled={loading || !comment.trim()} className="ml-auto">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </div>
  )
}

