'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Lock, Paperclip } from 'lucide-react'
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
  const [files, setFiles] = useState<File[]>([])

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

      if (!response.ok) throw new Error('Failed to add reply')

      setComment('')
      setIsInternal(false)
      setFiles([])
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to add reply. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Replies List */}
      <div className="space-y-3">
        {comments.map((c) => (
          <Card key={c.id} className={c.is_internal ? 'border-accent/50 bg-accent/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="h-8 w-8 rounded-full border-2 border-gray-200 bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0">
                  {c.user.avatar_url ? (
                    <img src={c.user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    `${c.user.first_name?.[0] || ''}${c.user.last_name?.[0] || ''}`
                  )}
                </div>
                
                {/* Reply Content */}
                <div className="flex-1 min-w-0">
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
                      <div className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded">
                        <Lock className="h-3 w-3" />
                        Internal
                      </div>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{c.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No replies yet. Be the first to respond.
          </p>
        )}
      </div>

      {/* Add Reply Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a reply..."
          rows={3}
          disabled={loading}
          className="resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {canManage && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="internal"
                  checked={isInternal}
                  onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="internal" className="text-xs cursor-pointer text-muted-foreground">
                  Internal note (not visible to client)
                </Label>
              </div>
            )}
            {/* Future: File attachment button */}
            {/* <Button type="button" variant="ghost" size="sm" disabled>
              <Paperclip className="h-4 w-4 mr-1.5" />
              Attach
            </Button> */}
          </div>
          <Button type="submit" disabled={loading || !comment.trim()} size="sm" className="bg-accent hover:bg-accent-dark h-9">
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : 'Send Reply'}
          </Button>
        </div>
      </form>
    </div>
  )
}
