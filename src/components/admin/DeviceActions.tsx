'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MoreHorizontal, Edit, Ticket, Trash2, Power } from 'lucide-react'
import Link from 'next/link'

interface DeviceActionsProps {
  deviceId: string
  deviceName: string
  currentStatus: string
  variant?: 'dropdown' | 'buttons'
}

export function DeviceActions({ deviceId, deviceName, currentStatus, variant = 'dropdown' }: DeviceActionsProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/hardware/${deviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to delete device' }))
        throw new Error(data.error || 'Failed to delete device')
      }

      toast.success('Device deleted successfully')
      setDeleteOpen(false)
      router.push('/hardware')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete device')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setLoading(true)
    try {
      const response = await fetch(`/api/hardware/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to update status' }))
        throw new Error(data.error || 'Failed to update status')
      }

      toast.success(`Device marked as ${newStatus}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'buttons') {
    return (
      <>
        <div className="flex gap-2">
          <Link href={`/hardware/${deviceId}/edit`}>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={handleToggleStatus} disabled={loading}>
            <Power className="h-4 w-4 mr-2" />
            {currentStatus === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)} disabled={loading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Device</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{deviceName}</strong>? This action cannot be undone.
                All associated tickets and records will remain but will no longer be linked to this device.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete Device'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/hardware/${deviceId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Device
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/tickets/new?hardware=${deviceId}`}>
              <Ticket className="h-4 w-4 mr-2" />
              Report Issue
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleStatus} disabled={loading}>
            <Power className="h-4 w-4 mr-2" />
            {currentStatus === 'active' ? 'Mark Inactive' : 'Mark Active'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Device
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deviceName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete Device'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
