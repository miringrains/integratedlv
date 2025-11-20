import Link from 'next/link'
import { getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Cpu, Ticket, AlertCircle, Building2, Users } from 'lucide-react'

export default async function HomePage() {
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  const isPlatformAdmin = profile?.is_platform_admin || false

  // If platform admin, show workspace selector
  if (isPlatformAdmin) {
    // Get all organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    const orgsWithStats = await Promise.all(
      (orgs || []).map(async (org) => {
        const { count: ticketCount } = await supabase
          .from('care_log_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id)
          .in('status', ['open', 'in_progress'])

        const { count: locationCount } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id)

        return {
          ...org,
          active_tickets: ticketCount || 0,
          location_count: locationCount || 0,
        }
      })
    )

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Client Workspaces
          </h1>
          <p className="text-muted-foreground mt-2">
            Select a client organization to manage
          </p>
        </div>

        {/* Organization Workspace Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {orgsWithStats.map((org) => (
            <Link key={org.id} href={`/admin/organizations/${org.id}/workspace`}>
              <Card className="card-hover group h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {org.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click to enter workspace
                      </p>
                    </div>
                    <Building2 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Active Tickets</span>
                      </div>
                      <span className="text-xl font-bold text-accent">{org.active_tickets}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Locations</span>
                      </div>
                      <span className="text-xl font-bold">{org.location_count}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Enter Workspace →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Link to All Organizations */}
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Manage All Organizations</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View all clients, add new organizations, manage settings
                </p>
              </div>
              <Link href="/admin/organizations">
                <Button className="bg-accent hover:bg-accent-dark">
                  <Building2 className="h-4 w-4 mr-2" />
                  Organizations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Regular dashboard for org admins/employees

  // Get basic stats
  const { count: locationsCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  const { count: hardwareCount } = await supabase
    .from('hardware')
    .select('*', { count: 'exact', head: true })

  const { count: openTicketsCount } = await supabase
    .from('care_log_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  const { count: urgentTicketsCount } = await supabase
    .from('care_log_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('priority', 'urgent')
    .in('status', ['open', 'in_progress'])

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, {profile?.first_name || 'User'}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your portal activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Locations
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locationsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hardware
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hardwareCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Devices managed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Tickets
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTicketsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Urgent Issues
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{urgentTicketsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Next Steps:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Add your store locations in the Locations section</li>
              <li>Register hardware inventory for each location</li>
              <li>Create SOPs for common troubleshooting procedures</li>
              <li>Submit care log tickets when issues arise</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

