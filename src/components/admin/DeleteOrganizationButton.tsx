'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteOrganizationButtonProps {
  orgId: string
  orgName: string
}

export function DeleteOrganizationButton({ orgId, orgName }: DeleteOrganizationButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== orgName) return

    setLoading(true)
    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to delete organization' }))
        throw new Error(data.error || 'Failed to delete organization')
      }

      toast.success('Organization deleted', {
        description: `${orgName} has been permanently deleted.`,
      })

      router.push('/admin/organizations')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmText('') }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Organization
          </DialogTitle>
          <DialogDescription className="pt-2 space-y-3">
            <p>
              This will <strong>permanently delete</strong> the organization <strong>{orgName}</strong> and all associated data including:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>All locations and departments</li>
              <li>All devices and hardware records</li>
              <li>All tickets and ticket history</li>
              <li>All contacts and user memberships</li>
              <li>All contracts and SLA configurations</li>
            </ul>
            <p className="font-medium text-red-600">
              This action cannot be undone.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-name" className="text-sm">
            Type <span className="font-mono font-semibold bg-muted px-1.5 py-0.5 rounded">{orgName}</span> to confirm:
          </Label>
          <Input
            id="confirm-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={orgName}
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmText !== orgName}
          >
            {loading ? 'Deleting...' : 'Delete Organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
