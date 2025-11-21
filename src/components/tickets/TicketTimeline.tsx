'use client'

import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { User, ArrowRight, MessageSquare, Paperclip } from 'lucide-react'
import type { TicketEvent } from '@/types/database'

interface TicketTimelineProps {
  events: TicketEvent[]
}

export function TicketTimeline({ events }: TicketTimelineProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return <User className="h-4 w-4" />
      case 'status_changed':
        return <ArrowRight className="h-4 w-4" />
      case 'comment_added':
        return <MessageSquare className="h-4 w-4" />
      case 'attachment_added':
        return <Paperclip className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getEventText = (event: TicketEvent) => {
    switch (event.event_type) {
      case 'created':
        return 'Ticket created'
      case 'status_changed':
        return `Status changed from ${event.old_value} to ${event.new_value}`
      case 'assigned':
        return 'Ticket assigned'
      case 'comment_added':
        return event.comment || 'Comment added'
      case 'attachment_added':
        return `Attached ${event.new_value}`
      case 'priority_changed':
        return `Priority changed from ${event.old_value} to ${event.new_value}`
      default:
        return 'Ticket updated'
    }
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-3">
          {/* Timeline Line */}
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-primary text-primary-foreground p-2">
              {getEventIcon(event.event_type)}
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-full bg-border flex-1 mt-2" />
            )}
          </div>

          {/* Event Content */}
          <div className="flex-1 pb-6">
            <p className="font-medium text-sm">{getEventText(event)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDateTime(event.created_at)}
            </p>
            {event.comment && event.event_type !== 'comment_added' && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                "{event.comment}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}





