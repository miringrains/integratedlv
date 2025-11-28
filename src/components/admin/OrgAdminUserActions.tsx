'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, MapPin } from 'lucide-react'

interface OrgAdminUserActionsProps {
  userId: string
  userEmail: string
  userName: string
  orgId: string
  currentRole: 'org_admin' | 'employee'
  locations: Array<{ id: string; name: string }>
}

export function OrgAdminUserActions({ userId, userEmail, userName, orgId, currentRole, locations }: OrgAdminUserActionsProps) {
  const router = useRouter()
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [changeRoleOpen, setChangeRoleOpen] = useState(false)
  const [manageLocationsOpen, setManageLocationsOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'org_admin' | 'employee'>(currentRole)
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword, org_id: orgId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      toast.success('Password reset successfully')
      setResetPasswordOpen(false)
      setNewPassword('')
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async () => {
    if (newRole === currentRole) {
      toast.info('User already has this role')
      setChangeRoleOpen(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, role: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change role')
      }

      toast.success(`User role changed to ${newRole === 'org_admin' ? 'Organization Admin' : 'Employee'}`)
      setChangeRoleOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error changing role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to change role')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove user')
      }

      toast.success('User removed from organization')
      setRemoveOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error removing user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove user')
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentLocations = async () => {
    setLoadingLocations(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/locations`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load current locations')
      }

      setSelectedLocationIds(data.location_ids || [])
      setManageLocationsOpen(true)
    } catch (error) {
      console.error('Error loading locations:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load locations')
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleSaveLocations = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/locations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, location_ids: selectedLocationIds }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update location assignments')
      }

      toast.success('Location assignments updated successfully')
      setManageLocationsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating locations:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update locations')
    } finally {
      setLoading(false)
    }
  }

  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds(prev => 
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={loadCurrentLocations}>
            <MapPin className="h-4 w-4 mr-2" />
            Manage Locations
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetPasswordOpen(true)}>
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setChangeRoleOpen(true)}>
            Change Role
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => setRemoveOpen(true)}>
            Remove from Organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {userName} ({userEmail})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={loading || !newPassword}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleOpen} onOpenChange={setChangeRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change the role for {userName} ({userEmail})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as 'org_admin' | 'employee')} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org_admin">Organization Admin</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Organization Admins have full control over their organization and staff.
                Employees can view tickets and submit requests.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={loading}>
              {loading ? 'Changing...' : 'Change Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Locations Dialog */}
      <Dialog open={manageLocationsOpen} onOpenChange={setManageLocationsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Locations</DialogTitle>
            <DialogDescription>
              Select which locations {userName} ({userEmail}) can access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {loadingLocations ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading locations...
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No locations available for this organization
              </div>
            ) : (
              <div className="space-y-3">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`location-${location.id}`}
                      checked={selectedLocationIds.includes(location.id)}
                      onCheckedChange={() => toggleLocation(location.id)}
                      disabled={loading}
                    />
                    <Label
                      htmlFor={`location-${location.id}`}
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {location.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageLocationsOpen(false)} disabled={loading || loadingLocations}>
              Cancel
            </Button>
            <Button onClick={handleSaveLocations} disabled={loading || loadingLocations}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove from Organization Dialog */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {userName} ({userEmail}) from this organization?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={loading}>
              {loading ? 'Removing...' : 'Remove User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

