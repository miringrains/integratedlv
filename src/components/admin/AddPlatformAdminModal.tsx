'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, UserPlus } from 'lucide-react'

export function AddPlatformAdminModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    admin_level: 'technician',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/platform-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create admin' }))
        throw new Error(error.error || 'Failed to create admin')
      }

      toast.success('Administrator created successfully!', {
        description: `Welcome email sent to ${formData.email}`,
      })

      setOpen(false)
      setFormData({ email: '', first_name: '', last_name: '', admin_level: 'technician' })
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create administrator')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent-dark">
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-accent" />
            Add Platform Administrator
          </DialogTitle>
          <DialogDescription>
            Create a new admin account for an Integrated LV team member
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin_first_name">First Name *</Label>
              <Input
                id="admin_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                className="border-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin_last_name">Last Name *</Label>
              <Input
                id="admin_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                className="border-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_email">Email Address *</Label>
            <Input
              id="admin_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@integratedlv.com"
              required
              className="border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_level">Access Level *</Label>
            <Select
              value={formData.admin_level}
              onValueChange={(value) => setFormData({ ...formData, admin_level: value })}
            >
              <SelectTrigger className="border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin - Full system access</SelectItem>
                <SelectItem value="technician">Technician - Manage tickets & clients</SelectItem>
                <SelectItem value="read_only">Read Only - View-only access</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              A welcome email with login credentials will be sent automatically
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent-dark">
              {loading ? 'Creating...' : 'Create Admin'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
