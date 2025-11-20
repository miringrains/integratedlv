'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2 } from 'lucide-react'

export default function NewOrganizationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    org_name: '',
    admin_email: '',
    admin_first_name: '',
    admin_last_name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create organization
      const orgResponse = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.org_name }),
      })

      if (!orgResponse.ok) throw new Error('Failed to create organization')

      const org = await orgResponse.json()

      // Create invitation for org admin
      const inviteResponse = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.admin_email,
          org_id: org.id,
          role: 'org_admin',
          first_name: formData.admin_first_name,
          last_name: formData.admin_last_name,
        }),
      })

      if (!inviteResponse.ok) throw new Error('Failed to send invitation')

      const invitation = await inviteResponse.json()

      toast.success('Organization created!', {
        description: `Invitation sent to ${formData.admin_email}`,
      })

      router.push('/admin/organizations')
    } catch (error) {
      toast.error('Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add Client Organization</h1>
        <p className="text-muted-foreground mt-2">
          Create a new client organization and invite an admin
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org_name" className="badge-text text-muted-foreground">
                Organization Name *
              </Label>
              <Input
                id="org_name"
                value={formData.org_name}
                onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                placeholder="Acme Corporation"
                required
                className="border-2 h-11"
              />
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-3">Organization Administrator</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_first_name" className="badge-text text-muted-foreground">
                    First Name *
                  </Label>
                  <Input
                    id="admin_first_name"
                    value={formData.admin_first_name}
                    onChange={(e) => setFormData({ ...formData, admin_first_name: e.target.value })}
                    required
                    className="border-2 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_last_name" className="badge-text text-muted-foreground">
                    Last Name *
                  </Label>
                  <Input
                    id="admin_last_name"
                    value={formData.admin_last_name}
                    onChange={(e) => setFormData({ ...formData, admin_last_name: e.target.value })}
                    required
                    className="border-2 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="admin_email" className="badge-text text-muted-foreground">
                  Email Address *
                </Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  placeholder="admin@client.com"
                  required
                  className="border-2 h-11"
                />
                <p className="text-xs text-muted-foreground">
                  An invitation email will be sent to this address
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent hover:bg-accent-dark"
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

