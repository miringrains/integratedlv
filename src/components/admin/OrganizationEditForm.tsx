'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Building2, MapPin, Clock, Shield, User, Save } from 'lucide-react'

interface OrganizationEditFormProps {
  organization: {
    id: string
    name: string
    business_address: string | null
    business_city: string | null
    business_state: string | null
    business_zip: string | null
    business_country: string | null
    business_hours: Record<string, string> | null
    account_service_manager_id: string | null
    sla_response_time_normal: number | null
    sla_response_time_high: number | null
    sla_response_time_urgent: number | null
    sla_resolution_time_normal: number | null
    sla_resolution_time_high: number | null
    sla_resolution_time_urgent: number | null
  }
  platformAdmins: Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }>
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 
  'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 
  'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export function OrganizationEditForm({ organization, platformAdmins }: OrganizationEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: organization.name || '',
    business_address: organization.business_address || '',
    business_city: organization.business_city || '',
    business_state: organization.business_state || '',
    business_zip: organization.business_zip || '',
    business_country: organization.business_country || 'USA',
    account_service_manager_id: organization.account_service_manager_id || 'none',
    sla_response_time_normal: organization.sla_response_time_normal || 1440,
    sla_response_time_high: organization.sla_response_time_high || 240,
    sla_response_time_urgent: organization.sla_response_time_urgent || 60,
    sla_resolution_time_normal: organization.sla_resolution_time_normal || 2880,
    sla_resolution_time_high: organization.sla_resolution_time_high || 480,
    sla_resolution_time_urgent: organization.sla_resolution_time_urgent || 120,
  })

  const [businessHours, setBusinessHours] = useState<Record<string, string>>(
    organization.business_hours || {
      monday: '9:00 AM - 5:00 PM',
      tuesday: '9:00 AM - 5:00 PM',
      wednesday: '9:00 AM - 5:00 PM',
      thursday: '9:00 AM - 5:00 PM',
      friday: '9:00 AM - 5:00 PM',
      saturday: 'Closed',
      sunday: 'Closed',
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          business_hours: businessHours,
          account_service_manager_id: formData.account_service_manager_id === 'none' ? null : formData.account_service_manager_id || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update organization' }))
        throw new Error(errorData.error || 'Failed to update organization')
      }

      toast.success('Organization updated successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update organization')
    } finally {
      setLoading(false)
    }
  }

  const formatMinutesToDisplay = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    if (minutes < 1440) return `${minutes / 60} hr`
    return `${minutes / 1440} day${minutes >= 2880 ? 's' : ''}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Business Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business_address">Street Address</Label>
            <Input
              id="business_address"
              value={formData.business_address}
              onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
              placeholder="123 Main Street"
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label htmlFor="business_city">City</Label>
              <Input
                id="business_city"
                value={formData.business_city}
                onChange={(e) => setFormData({ ...formData, business_city: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="business_state">State</Label>
              <Select
                value={formData.business_state}
                onValueChange={(value) => setFormData({ ...formData, business_state: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="business_zip">ZIP Code</Label>
              <Input
                id="business_zip"
                value={formData.business_zip}
                onChange={(e) => setFormData({ ...formData, business_zip: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <Label className="w-24 capitalize">{day}</Label>
                <Input
                  value={businessHours[day] || ''}
                  onChange={(e) => setBusinessHours({ ...businessHours, [day]: e.target.value })}
                  placeholder="9:00 AM - 5:00 PM or Closed"
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Service Manager
          </CardTitle>
          <CardDescription>
            Assign a platform admin as the primary contact for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.account_service_manager_id}
            onValueChange={(value) => setFormData({ ...formData, account_service_manager_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No manager assigned</SelectItem>
              {platformAdmins.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.first_name} {admin.last_name} ({admin.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* SLA Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SLA Settings
          </CardTitle>
          <CardDescription>
            Configure response and resolution time targets by priority (in minutes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Response Times */}
            <div>
              <h4 className="font-medium mb-3">Response Time Targets</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Normal Priority</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={formData.sla_response_time_normal}
                      onChange={(e) => setFormData({ ...formData, sla_response_time_normal: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({formatMinutesToDisplay(formData.sla_response_time_normal)})
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">High Priority</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={formData.sla_response_time_high}
                      onChange={(e) => setFormData({ ...formData, sla_response_time_high: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({formatMinutesToDisplay(formData.sla_response_time_high)})
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Urgent Priority</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={formData.sla_response_time_urgent}
                      onChange={(e) => setFormData({ ...formData, sla_response_time_urgent: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({formatMinutesToDisplay(formData.sla_response_time_urgent)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Resolution Times */}
            <div>
              <h4 className="font-medium mb-3">Resolution Time Targets</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Normal Priority</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={formData.sla_resolution_time_normal}
                      onChange={(e) => setFormData({ ...formData, sla_resolution_time_normal: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({formatMinutesToDisplay(formData.sla_resolution_time_normal)})
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">High Priority</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={formData.sla_resolution_time_high}
                      onChange={(e) => setFormData({ ...formData, sla_resolution_time_high: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({formatMinutesToDisplay(formData.sla_resolution_time_high)})
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Urgent Priority</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={formData.sla_resolution_time_urgent}
                      onChange={(e) => setFormData({ ...formData, sla_resolution_time_urgent: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({formatMinutesToDisplay(formData.sla_resolution_time_urgent)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent-dark">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
