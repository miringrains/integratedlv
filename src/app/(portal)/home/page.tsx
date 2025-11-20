import Link from 'next/link'
import { getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Cpu, Ticket, AlertCircle, Building2, ArrowRight, Plus } from 'lucide-react'

export default async function HomePage() {
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  const isPlatformAdmin = profile?.is_platform_admin === true

  // Platform Admin Dashboard - Clean Workspace View
  if (isPlatformAdmin) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    const orgsWithStats = await Promise.all(
      (orgs || []).map(async (org) => {
        const { count: activeTickets } = await supabase
          .from('care_log_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id)
          .in('status', ['open', 'in_progress'])

        const { count: urgentTickets } = await supabase
          .from('care_log_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id)
          .eq('priority', 'urgent')
          .in('status', ['open', 'in_progress'])

        const { count: locations } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id)

        const { count: hardware } = await supabase
          .from('hardware')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id)

        return {
          ...org,
          active_tickets: activeTickets || 0,
          urgent_tickets: urgentTickets || 0,
          location_count: locations || 0,
          hardware_count: hardware || 0,
        }
      })
    )

    return (
      <div className="space-y-6">
        {/* Clean Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Client Organizations</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {orgsWithStats.length} active client{orgsWithStats.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href="/admin/organizations/new">
            <Button className="bg-accent hover:bg-accent-dark">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </Link>
        </div>

        {/* Clean Organization List */}
        <div className="space-y-3">
          {orgsWithStats.map((org) => (
            <Link key={org.id} href={`/admin/organizations/${org.id}`}>
              <Card className="card-hover group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    {/* Left: Org Info */}
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                          {org.name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{org.location_count} locations</span>
                          <span>•</span>
                          <span>{org.hardware_count} devices</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Stats & Action */}
                    <div className="flex items-center gap-6">
                      {/* Ticket Stats */}
                      <div className="flex items-center gap-6">
                        {org.urgent_tickets > 0 && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-accent">{org.urgent_tickets}</div>
                            <div className="text-xs text-muted-foreground">urgent</div>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-2xl font-bold">{org.active_tickets}</div>
                          <div className="text-xs text-muted-foreground">active</div>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
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
    <div className="space-y-6">
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Locations</p>
                <p className="text-2xl font-bold">{locationsCount || 0}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Hardware</p>
                <p className="text-2xl font-bold">{hardwareCount || 0}</p>
              </div>
              <Cpu className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Open Tickets</p>
                <p className="text-2xl font-bold">{openTicketsCount || 0}</p>
              </div>
              <Ticket className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Urgent</p>
                <p className="text-2xl font-bold text-accent">{urgentTicketsCount || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-accent/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/tickets/new">
          <Card className="card-hover group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-accent transition-colors">
                    Create Ticket
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Report a hardware issue
                  </p>
                </div>
                <Ticket className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tickets">
          <Card className="card-hover group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    View Tickets
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    See all support requests
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
