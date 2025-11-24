'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TicketEditForm } from './TicketEditForm'
import { Edit2 } from 'lucide-react'

interface TicketDetailsClientProps {
  ticket: {
    id: string
    title: string
    description: string
    priority: string
  }
  canEdit: boolean
}

export function TicketDetailsClient({ ticket, canEdit }: TicketDetailsClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentTicket, setCurrentTicket] = useState(ticket)
  const router = useRouter()

  const handleSave = () => {
    setIsEditing(false)
    router.refresh()
  }

  if (isEditing) {
    return (
      <Card className="border-primary overflow-hidden">
        <CardHeader className="bg-primary py-3">
          <CardTitle className="text-sm text-primary-foreground font-semibold uppercase tracking-wider">
            Edit Ticket Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          <TicketEditForm
            ticket={currentTicket}
            onCancel={() => setIsEditing(false)}
            onSave={handleSave}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Description */}
      <Card className="border-primary overflow-hidden">
        <CardHeader className="bg-primary py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-primary-foreground font-semibold uppercase tracking-wider">
              Description
            </CardTitle>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
            {currentTicket.description}
          </p>
        </CardContent>
      </Card>
    </>
  )
}

