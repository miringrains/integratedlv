'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { User, UserPlus } from 'lucide-react'
import type { Profile } from '@/types/database'

interface AssignmentDropdownProps {
  ticketId: string
  currentAssignedId: string | null
  orgMembers: Profile[]
  currentUserId: string
}

export function AssignmentDropdown({ 
  ticketId, 
  currentAssignedId, 
  orgMembers,
  currentUserId 
}: AssignmentDropdownProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAssign = async (userId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: userId }),
      })

      if (!response.ok) throw new Error('Failed to assign ticket')

      const assignedUser = orgMembers.find(m => m.id === userId)
      toast.success('Ticket assigned', {
        description: `Assigned to ${assignedUser?.first_name} ${assignedUser?.last_name}`,
      })
      
      router.refresh()
    } catch (error) {
      toast.error('Failed to assign ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToMe = async () => {
    await handleAssign(currentUserId)
  }

  return (
    <div className="space-y-2">
      <Select
        value={currentAssignedId || 'unassigned'}
        onValueChange={handleAssign}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Unassigned" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">
            <span className="text-muted-foreground">Unassigned</span>
          </SelectItem>
          {orgMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                {member.first_name} {member.last_name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentAssignedId !== currentUserId && (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleAssignToMe}
          disabled={loading}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Assign to Me
        </Button>
      )}
    </div>
  )
}


