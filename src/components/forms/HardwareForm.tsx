'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Hardware, Location } from '@/types/database'

interface HardwareFormProps {
  hardware?: Hardware
  orgId: string
  locations: Location[]
  defaultLocationId?: string
}

export function HardwareForm({ hardware, orgId, locations, defaultLocationId }: HardwareFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: hardware?.name || '',
    hardware_type: hardware?.hardware_type || '',
    location_id: hardware?.location_id || defaultLocationId || '',
    manufacturer: hardware?.manufacturer || '',
    model_number: hardware?.model_number || '',
    serial_number: hardware?.serial_number || '',
    status: hardware?.status || 'active',
    installation_date: hardware?.installation_date || '',
    last_maintenance_date: hardware?.last_maintenance_date || '',
    warranty_expiration: hardware?.warranty_expiration || '',
    vendor_url: hardware?.vendor_url || '',
    internal_notes: hardware?.internal_notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = hardware ? `/api/hardware/${hardware.id}` : '/api/hardware'
      const method = hardware ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          org_id: orgId,
        }),
      })

      if (!response.ok) throw new Error('Failed to save hardware')

      const data = await response.json()
      router.push(`/hardware/${data.id}`)
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

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Device Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Camera #1 - Main Entrance"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hardware_type">Hardware Type *</Label>
              <Input
                id="hardware_type"
                value={formData.hardware_type}
                onChange={(e) => setFormData({ ...formData, hardware_type: e.target.value })}
                placeholder="Security Camera, POS Terminal, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_id">Location *</Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Cisco, HP, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model_number">Model Number</Label>
              <Input
                id="model_number"
                value={formData.model_number}
                onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                placeholder="ABC-123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="SN123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installation_date">Installation Date</Label>
              <Input
                id="installation_date"
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_maintenance_date">Last Maintenance</Label>
              <Input
                id="last_maintenance_date"
                type="date"
                value={formData.last_maintenance_date}
                onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_expiration">Warranty Expires</Label>
              <Input
                id="warranty_expiration"
                type="date"
                value={formData.warranty_expiration}
                onChange={(e) => setFormData({ ...formData, warranty_expiration: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor_url">Vendor/Product URL</Label>
            <Input
              id="vendor_url"
              type="url"
              value={formData.vendor_url}
              onChange={(e) => setFormData({ ...formData, vendor_url: e.target.value })}
              placeholder="https://vendor.com/product"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_notes">Internal Notes</Label>
            <Textarea
              id="internal_notes"
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              placeholder="Additional notes about this device..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : hardware ? 'Update Hardware' : 'Add Hardware'}
        </Button>
      </div>
    </form>
  )
}

