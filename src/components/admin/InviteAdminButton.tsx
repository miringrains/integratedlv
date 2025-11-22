'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface InviteAdminButtonProps {
  orgId: string
}

export function InviteAdminButton({ orgId }: InviteAdminButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleInvite = async () => {
    const email = prompt('Email address for new admin:')
    if (!email) return
    
    const firstName = prompt('First name:')
    if (!firstName) return
    
    const lastName = prompt('Last name:')
    if (!lastName) return
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'org_admin',
          org_id: orgId,
          location_ids: []
        })
      })
      
      if (response.ok) {
        toast.success('Admin invited successfully!', {
          description: 'Welcome email sent with login credentials',
        })
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to invite admin')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to invite admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleInvite}
      disabled={loading}
      className="w-full text-xs h-8 bg-accent hover:bg-accent-dark text-white"
    >
      <Plus className="h-3.5 w-3.5 mr-1.5" />
      {loading ? 'Inviting...' : 'Invite Administrator'}
    </Button>
  )
}

