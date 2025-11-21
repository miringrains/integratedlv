import { requirePlatformAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Plus, 
  Building2, 
  Users, 
  MapPin, 
  Ticket, 
  ArrowRight,
  MoreHorizontal
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function OrganizationsPage() {
  await requirePlatformAdmin()
  
  const supabase = await createClient()

  // Get all organizations
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    // Filter out the provider org (Integrated LV)
    // Note: In a real production env, we might want a 'type' column or config
    .neq('name', 'Integrated LV') 
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

  // Calculate Totals
  const totalClients = orgsWithStats.length
  const totalUsers = orgsWithStats.reduce((sum, org) => sum + org.user_count, 0)
  const totalTickets = orgsWithStats.reduce((sum, org) => sum + org.ticket_count, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Client Organizations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage client accounts and their resources
          </p>
        </div>
        <Link href="/admin/organizations/new">
          <Button size="sm" className="bg-accent hover:bg-accent-dark text-xs font-semibold h-9 px-4">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Minimal Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Clients</p>
            <p className="text-2xl font-bold mt-1">{totalClients}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="h-4 w-4" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Users</p>
            <p className="text-2xl font-bold mt-1">{totalUsers}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open Tickets</p>
            <p className="text-2xl font-bold mt-1">{totalTickets}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Ticket className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Organization List (Table View for Efficiency) */}
      <Card className="shadow-sm overflow-hidden border-primary">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary border-b-0">
              <TableHead className="w-[300px] text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Organization</TableHead>
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Primary Admin</TableHead>
              <TableHead className="text-center text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Locations</TableHead>
              <TableHead className="text-center text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Users</TableHead>
              <TableHead className="text-center text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Tickets</TableHead>
              <TableHead className="text-right text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgsWithStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No client organizations found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              orgsWithStats.map((org) => (
                <TableRow key={org.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Building2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{org.name}</div>
                        <div className="text-xs text-muted-foreground">Created {new Date(org.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {org.admin ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                          {org.admin.first_name?.[0]}{org.admin.last_name?.[0]}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {org.admin.first_name} {org.admin.last_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No admin assigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-normal">
                      {org.location_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-normal">
                      {org.user_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-normal">
                      {org.ticket_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/organizations/${org.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
