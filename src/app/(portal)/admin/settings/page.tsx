import { requirePlatformAdmin, getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Building2, Shield, ArrowRight } from 'lucide-react'

export default async function AdminSettingsPage() {
  await requirePlatformAdmin()
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()

  // Get platform admin stats
  const { data: platformAdmins, count: adminCount } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, admin_level', { count: 'exact' })
    .eq('is_platform_admin', true)
    .order('first_name')

  // Get organization count
  const { count: orgCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })

  // Get total tickets
  const { count: ticketCount } = await supabase
    .from('care_log_tickets')
    .select('*', { count: 'exact', head: true })

  const adminLevelLabels: Record<string, string> = {
    'super_admin': 'Super Admin',
    'technician': 'Technician',
    'read_only': 'Read Only'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage platform administrators, organizations, and system settings
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Admins</p>
                <p className="text-3xl font-bold">{adminCount || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Organizations</p>
                <p className="text-3xl font-bold">{orgCount || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold">{ticketCount || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Platform Admins Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Internal Technicians</CardTitle>
                <CardDescription>Platform administrators and support staff</CardDescription>
              </div>
              <Link href="/admin/platform-admins">
                <Button size="sm" variant="outline">
                  Manage <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {platformAdmins?.slice(0, 5).map((admin) => (
                <div key={admin.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                      {admin.first_name?.[0]?.toUpperCase() || admin.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {admin.first_name} {admin.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {adminLevelLabels[admin.admin_level || 'technician']}
                  </Badge>
                </div>
              ))}
            </div>
            {(adminCount || 0) > 5 && (
              <div className="p-4 border-t text-center">
                <Link href="/admin/platform-admins" className="text-sm text-accent hover:underline">
                  View all {adminCount} administrators
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Navigate to common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/organizations" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manage Organizations</p>
                    <p className="text-sm text-muted-foreground">View and edit client organizations</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>

            <Link href="/admin/platform-admins" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Platform Admins</p>
                    <p className="text-sm text-muted-foreground">Add or remove internal technicians</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>

            <Link href="/admin/analytics" className="block">
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Analytics & Reports</p>
                    <p className="text-sm text-muted-foreground">View performance metrics and export reports</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Access Levels Info */}
      <Card>
        <CardHeader>
          <CardTitle>Access Levels</CardTitle>
          <CardDescription>Understanding platform admin permission levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border">
              <Badge className="bg-accent mb-2">Super Admin</Badge>
              <p className="text-sm text-muted-foreground">
                Full platform access. Can manage all organizations, users, settings, and system configuration.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <Badge variant="secondary" className="mb-2">Technician</Badge>
              <p className="text-sm text-muted-foreground">
                Ticket management access. Can work tickets, add comments, and view client information.
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <Badge variant="outline" className="mb-2">Read Only</Badge>
              <p className="text-sm text-muted-foreground">
                View-only access. Can view tickets and reports but cannot make changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
