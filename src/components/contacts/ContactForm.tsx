'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react'

interface ContactFormProps {
  contact?: any
  orgId: string
  isPlatformAdmin: boolean
  allOrgs: Array<{ id: string; name: string }>
  locations: Array<{ id: string; name: string }>
}

export function ContactForm({ contact, orgId, isPlatformAdmin, allOrgs, locations }: ContactFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState(orgId || '')

  useEffect(() => {
    if (orgId && !selectedOrgId) {
      setSelectedOrgId(orgId)
    }
  }, [orgId])

  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    role: contact?.role || '',
    location_id: contact?.location_id || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Contact name is required')
      setLoading(false)
      return
    }

    if (isPlatformAdmin && !selectedOrgId) {
      setError('Please select an organization')
      setLoading(false)
      return
    }

    try {
      const url = contact ? `/api/contacts/${contact.id}` : '/api/contacts'
      const method = contact ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        org_id: selectedOrgId || orgId,
        location_id: formData.location_id || null,
        email: formData.email || null,
        phone: formData.phone || null,
        role: formData.role || null,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save contact' }))
        throw new Error(errorData.error || `Failed to save contact (${response.status})`)
      }

      const data = await response.json()
      router.push('/contacts')
      router.refresh()
    } catch (err) {
      console.error('Contact save error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Filter locations by selected org
  const filteredLocations = isPlatformAdmin && selectedOrgId
    ? locations.filter(loc => loc.id) // Would need org_id on locations
    : locations

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Organization Selection (Platform Admin Only) */}
      {isPlatformAdmin && allOrgs && allOrgs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-accent" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-accent" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                Role
              </Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Manager, Technician, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_id" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </Label>
              <Select
                value={formData.location_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, location_id: value === 'none' ? '' : value })}
                disabled={isPlatformAdmin && !selectedOrgId}
              >
                <SelectTrigger className="border-2 h-11">
                  <SelectValue placeholder="Select location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No location</SelectItem>
                  {filteredLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 pb-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent-dark">
          {loading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
        </Button>
      </div>
    </form>
  )
}

