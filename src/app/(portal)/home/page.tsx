import Link from 'next/link'
import { getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Cpu, Ticket, AlertCircle, Building2, Users } from 'lucide-react'

export default async function HomePage() {
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  const isPlatformAdmin = profile?.is_platform_admin === true

  // Platform Admin Dashboard - Workspace Selector
  if (isPlatformAdmin) {
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

        const { data: adminMembership } = await supabase
          .from('org_memberships')
          .select('profiles(first_name, last_name)')
          .eq('org_id', org.id)
          .eq('role', 'org_admin')
          .limit(1)
          .single()

        return {
          ...org,
          active_tickets: ticketCount || 0,
          location_count: locationCount || 0,
          admin: adminMembership ? (adminMembership as any).profiles : null,
        }
      })
    )

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Client Workspaces
          </h1>
          <p className="text-muted-foreground mt-2">
            Select a client organization to manage their locations, hardware, SOPs, and tickets
          </p>
        </div>

        {/* Organization Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {orgsWithStats.map((org) => (
            <Card key={org.id} className="card-hover group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {org.name}
                    </CardTitle>
                    {org.admin && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Admin: {org.admin.first_name} {org.admin.last_name}
                      </p>
                    )}
                  </div>
                  <Building2 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ticket className="h-4 w-4" />
                      <span>Active Tickets</span>
                    </div>
                    <span className="text-2xl font-bold text-accent">{org.active_tickets}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Locations</span>
                    </div>
                    <span className="text-xl font-bold">{org.location_count}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/tickets?org=${org.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Tickets
                    </Button>
                  </Link>
                  <Link href={`/locations?org=${org.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Locations
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Link href="/admin/organizations">
            <Card className="card-hover group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      All Organizations
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage clients, add new organizations
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/organizations/new">
            <Card className="card-hover group border-2 border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-accent transition-colors">
                      Add New Client
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create organization and invite admin
                    </p>
                  </div>
                  <Plus className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    )
  }

  // Regular Dashboard for Org Admins/Employees
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href="/tickets/new">
              <Button className="w-full bg-accent hover:bg-accent-dark">
                <Ticket className="h-4 w-4 mr-2" />
                Create Support Ticket
              </Button>
            </Link>
            <Link href="/tickets">
              <Button variant="outline" className="w-full">
                <Ticket className="h-4 w-4 mr-2" />
                View All Tickets
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
