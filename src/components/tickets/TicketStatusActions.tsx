'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, CheckCircle, XCircle, Lock, Bell, Clock } from 'lucide-react'

interface TicketStatusActionsProps {
  ticketId: string
  currentStatus: string
  canManage: boolean
  acknowledgedAt?: string | null
  slaResponseDueAt?: string | null
  isAssigned?: boolean
}

export function TicketStatusActions({ 
  ticketId, 
  currentStatus, 
  canManage,
  acknowledgedAt,
  slaResponseDueAt,
  isAssigned = false
}: TicketStatusActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [slaTimeRemaining, setSlaTimeRemaining] = useState<string | null>(null)

  // Calculate SLA time remaining
  useEffect(() => {
    if (!slaResponseDueAt) return

    const updateTimer = () => {
      const now = new Date()
      const dueDate = new Date(slaResponseDueAt)
      const diff = dueDate.getTime() - now.getTime()

      if (diff <= 0) {
        setSlaTimeRemaining('Overdue')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        setSlaTimeRemaining(`${hours}h ${minutes}m`)
      } else {
        setSlaTimeRemaining(`${minutes}m`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [slaResponseDueAt])

  const handleAcknowledge = async () => {
    setAcknowledging(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/acknowledge`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to acknowledge ticket' }))
        throw new Error(errorData.error || 'Failed to acknowledge ticket')
      }

      toast.success('Ticket acknowledged', {
        description: 'SLA timer has started.',
      })
      
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to acknowledge ticket')
    } finally {
      setAcknowledging(false)
    }
  }

  if (!canManage) return null

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    const previousStatus = currentStatus
    
    // Optimistically update UI (will be confirmed by refresh)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update status' }))
        throw new Error(errorData.error || 'Failed to update status')
      }

      const statusLabels: Record<string, string> = {
        in_progress: 'started working on',
        resolved: 'resolved',
        closed: 'closed',
        cancelled: 'cancelled',
      }
      
      toast.success(`Ticket ${statusLabels[newStatus] || 'updated'}`, {
        description: 'Status has been updated successfully.',
      })
      
      // Refresh to get updated ticket data
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update ticket status')
      // Status will revert on refresh since we didn't update local state
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = slaResponseDueAt && new Date(slaResponseDueAt) < new Date() && !['resolved', 'closed', 'cancelled'].includes(currentStatus)

  return (
    <div className="space-y-2">
      {/* SLA Timer Display */}
      {slaResponseDueAt && !acknowledgedAt && (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">SLA starts on acknowledgment</span>
        </div>
      )}
      
      {acknowledgedAt && slaResponseDueAt && (
        <div className="flex items-center gap-2">
          <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {isOverdue ? 'Overdue' : `Due in ${slaTimeRemaining || 'calculating...'}`}
          </Badge>
        </div>
      )}

      {/* Acknowledge Button */}
      {!acknowledgedAt && (currentStatus === 'open' || currentStatus === 'in_progress') && (
        <Button
          onClick={handleAcknowledge}
          disabled={acknowledging || loading}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Bell className="h-4 w-4 mr-2" />
          {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
        </Button>
      )}

      {/* Status Action Buttons */}
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
    </div>
  )
}

