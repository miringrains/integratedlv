'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Edit2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface PriorityEditorProps {
  ticketId: string
  initialPriority: string
}

export function PriorityEditor({ ticketId, initialPriority }: PriorityEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [priority, setPriority] = useState(initialPriority)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update priority' }))
        throw new Error(errorData.error || 'Failed to update priority')
      }

      setIsEditing(false)
      router.refresh()
      toast.success('Priority updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update priority')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return 'bg-accent text-white'
      case 'high': return 'bg-accent/70 text-white'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Select
          value={priority}
          onValueChange={setPriority}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="bg-accent hover:bg-accent-dark"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPriority(initialPriority)
              setIsEditing(false)
            }}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className={`${getPriorityColor(priority)} rounded-md px-3 py-2 text-center flex-1`}>
        <span className="font-semibold text-xs uppercase tracking-wide">
          {priority}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="h-8 w-8 p-0 ml-2"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

