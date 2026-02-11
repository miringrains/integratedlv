'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

interface SOPDeleteButtonProps {
  sopId: string
  sopTitle: string
}

export function SOPDeleteButton({ sopId, sopTitle }: SOPDeleteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sops/${sopId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to delete SOP' }))
        throw new Error(data.error || 'Failed to delete SOP')
      }

      toast.success('SOP deleted successfully')
      setOpen(false)
      router.push('/sops')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete SOP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete SOP</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>&quot;{sopTitle}&quot;</strong>? 
              This will permanently remove the troubleshooting procedure and all its hardware associations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete SOP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
