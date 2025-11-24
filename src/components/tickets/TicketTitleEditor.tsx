'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Edit2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface TicketTitleEditorProps {
  ticketId: string
  initialTitle: string
}

export function TicketTitleEditor({ ticketId, initialTitle }: TicketTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title cannot be empty')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update title' }))
        throw new Error(errorData.error || 'Failed to update title')
      }

      setIsEditing(false)
      router.refresh()
      toast.success('Title updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update title')
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold h-auto py-2"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave()
            } else if (e.key === 'Escape') {
              setTitle(initialTitle)
              setIsEditing(false)
            }
          }}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={loading}
          className="bg-accent hover:bg-accent-dark"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setTitle(initialTitle)
            setIsEditing(false)
          }}
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      <h1 className="text-2xl font-bold text-foreground flex-1">
        {title}
      </h1>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="h-8 w-8 p-0"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

