import { requirePlatformAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Building2, Users, MapPin, Ticket } from 'lucide-react'

export default async function OrganizationsPage() {
  await requirePlatformAdmin()
  
  const supabase = await createClient()

  // Get all organizations with stats
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  const orgsWithStats = await Promise.all(
    (orgs || []).map(async (org) => {
      const { count: locationCount } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org.id)

      const { count: userCount } = await supabase
        .from('org_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org.id)

      const { count: ticketCount } = await supabase
        .from('care_log_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org.id)

      // Get org admin
      const { data: adminMembership } = await supabase
        .from('org_memberships')
        .select('profiles(*)')
        .eq('org_id', org.id)
        .eq('role', 'org_admin')
        .limit(1)
        .single()

      return {
        ...org,
        location_count: locationCount || 0,
        user_count: userCount || 0,
        ticket_count: ticketCount || 0,
        admin: adminMembership ? (adminMembership as any).profiles : null,
      }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Organizations</h1>
          <p className="text-muted-foreground mt-2">
            Manage all client organizations
          </p>
        </div>
        <Link href="/admin/organizations/new">
          <Button className="bg-accent hover:bg-accent-dark">
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-bold">{orgsWithStats.length}</p>
              </div>
              <Building2 className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">
                  {orgsWithStats.reduce((sum, org) => sum + org.user_count, 0)}
                </p>
              </div>
              <Users className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold">
                  {orgsWithStats.reduce((sum, org) => sum + org.ticket_count, 0)}
                </p>
              </div>
              <Ticket className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {orgsWithStats.map((org) => (
          <Card key={org.id} className="card-hover group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {org.name}
                  </CardTitle>
                  {org.admin && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Admin: {org.admin.first_name} {org.admin.last_name}
                    </p>
                  )}
                </div>
                <Building2 className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Locations</span>
                  </div>
                  <span className="font-semibold">{org.location_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                  </div>
                  <span className="font-semibold">{org.user_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Ticket className="h-4 w-4" />
                    <span>Tickets</span>
                  </div>
                  <span className="font-semibold">{org.ticket_count}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t">
                <Link href={`/admin/organizations/${org.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage Organization
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


