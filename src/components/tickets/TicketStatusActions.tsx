'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlayCircle, CheckCircle, XCircle, Lock } from 'lucide-react'

interface TicketStatusActionsProps {
  ticketId: string
  currentStatus: string
  canManage: boolean
}

export function TicketStatusActions({ ticketId, currentStatus, canManage }: TicketStatusActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!canManage) return null

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {currentStatus === 'open' && (
        <Button
          onClick={() => handleStatusChange('in_progress')}
          disabled={loading}
          className="bg-primary hover:bg-primary/90"
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          Start Working
        </Button>
      )}

      {currentStatus === 'in_progress' && (
        <Button
          onClick={() => handleStatusChange('resolved')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark Resolved
        </Button>
      )}

      {currentStatus === 'resolved' && (
        <Button
          onClick={() => handleStatusChange('closed')}
          disabled={loading}
          className="bg-gray-600 hover:bg-gray-700"
        >
          <Lock className="h-4 w-4 mr-2" />
          Close Ticket
        </Button>
      )}

      {['open', 'in_progress'].includes(currentStatus) && (
        <Button
          variant="outline"
          onClick={() => handleStatusChange('cancelled')}
          disabled={loading}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      )}
    </div>
  )
}

