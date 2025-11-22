'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Location } from '@/types/database'
import { Building2, MapPin, User, FileText, Shield } from 'lucide-react'

interface LocationFormProps {
  location?: Location
  orgId?: string
  isPlatformAdmin?: boolean
  allOrgs?: Array<{ id: string; name: string }>
  platformAdmins?: Array<{ id: string; first_name: string; last_name: string }>
}

export function LocationForm({ location, orgId, isPlatformAdmin, allOrgs, platformAdmins }: LocationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState(orgId || '')

  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || '',
    city: location?.city || '',
    state: location?.state || '',
    zip_code: location?.zip_code || '',
    country: location?.country || 'USA',
    manager_name: location?.manager_name || '',
    manager_phone: location?.manager_phone || '',
    manager_email: location?.manager_email || '',
    store_hours: location?.store_hours || '',
    timezone: location?.timezone || 'America/New_York',
    internal_notes: location?.internal_notes || '',
    default_assigned_to: (location as any)?.default_assigned_to || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation for Platform Admin
    if (isPlatformAdmin && !selectedOrgId) {
      setError('Please select an organization')
      setLoading(false)
      return
    }

    try {
      const url = location
        ? `/api/locations/${location.id}`
        : '/api/locations'
      
      const method = location ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          org_id: selectedOrgId || orgId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save location')
      }

      const data = await response.json()
      router.push(`/locations/${data.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Organization Selection (Platform Admin Only) */}
      {isPlatformAdmin && allOrgs && (
        <Card>
           <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-accent" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="org_id" className="badge-text text-muted-foreground">
                Client Organization *
              </Label>
              <Select
                value={selectedOrgId}
                onValueChange={setSelectedOrgId}
                required
              >
                <SelectTrigger className="border-2 h-11">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {allOrgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-accent" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Store #123"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Las Vegas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="NV"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                placeholder="89101"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              placeholder="America/New_York"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store_hours">Store Hours</Label>
            <Input
              id="store_hours"
              value={formData.store_hours}
              onChange={(e) => setFormData({ ...formData, store_hours: e.target.value })}
              placeholder="Mon-Fri: 9am-5pm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Manager Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-accent" />
            Manager Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager_name">Manager Name</Label>
            <Input
              id="manager_name"
              value={formData.manager_name}
              onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager_phone">Manager Phone</Label>
            <Input
              id="manager_phone"
              type="tel"
              value={formData.manager_phone}
              onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager_email">Manager Email</Label>
            <Input
              id="manager_email"
              type="email"
              value={formData.manager_email}
              onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
              placeholder="manager@company.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Default Technician Assignment */}
      {isPlatformAdmin && platformAdmins && platformAdmins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-accent" />
              Default Assigned Technician
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="default_assigned_to">Auto-Assign Tickets To</Label>
            <Select
              value={formData.default_assigned_to}
              onValueChange={(value) => setFormData({ ...formData, default_assigned_to: value })}
            >
              <SelectTrigger className="border-2 h-11">
                <SelectValue placeholder="No default assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No default assignment</SelectItem>
                {platformAdmins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.first_name} {admin.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Tickets created for this location will automatically be assigned to this technician
            </p>
          </CardContent>
        </Card>
      )}

      {/* Internal Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-accent" />
            Internal Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="internal_notes"
            value={formData.internal_notes}
            onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
            placeholder="Internal notes about this location..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent-dark">
          {loading ? 'Saving...' : location ? 'Update Location' : 'Create Location'}
        </Button>
      </div>
    </form>
  )
}
