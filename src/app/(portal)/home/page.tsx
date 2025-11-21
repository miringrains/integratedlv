import Link from 'next/link'
import { getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Cpu, Ticket, AlertCircle, Building2, ArrowRight, Plus, Activity, CheckCircle2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function HomePage() {
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  const isPlatformAdmin = profile?.is_platform_admin === true

  // --- PLATFORM ADMIN DASHBOARD (NOC View) ---
  if (isPlatformAdmin) {
    // Fetch Global Stats
    const { count: totalActiveTickets } = await supabase
      .from('care_log_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])

    const { count: totalUrgentTickets } = await supabase
      .from('care_log_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'urgent')
      .in('status', ['open', 'in_progress'])

    // Fetch Recent Urgent Tickets
    const { data: urgentTickets } = await supabase
      .from('care_log_tickets')
      .select(`
        *,
        location:locations(name),
        organization:organizations(name)
      `)
      .eq('priority', 'urgent')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(5)

    // Fetch Client Orgs Summary
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .neq('name', 'Integrated LV')
      .order('name')

    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System-wide overview and status
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Active Urgent</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{totalUrgentTickets}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-100" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Total Open</p>
                  <p className="text-2xl font-bold mt-1">{totalActiveTickets}</p>
                </div>
                <Ticket className="h-8 w-8 text-muted" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Active Clients</p>
                  <p className="text-2xl font-bold mt-1">{orgs?.length || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-muted" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-primary-foreground/80 uppercase">System Status</p>
                  <p className="text-lg font-bold mt-1 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> Operational
                  </p>
                </div>
                <Activity className="h-8 w-8 text-primary-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Urgent Tickets Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Urgent Incidents
              </h2>
              <Link href="/tickets" className="text-xs text-primary hover:underline">View All Queue &rarr;</Link>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Client / Location</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!urgentTickets || urgentTickets.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No urgent tickets. All systems stable.
                      </TableCell>
                    </TableRow>
                  ) : (
                    urgentTickets.map((t) => (
                      <TableRow key={t.id} className="group">
                        <TableCell className="font-mono text-xs text-muted-foreground">{t.ticket_number}</TableCell>
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold">{(t as any).organization?.name}</span>
                            <span className="text-muted-foreground">{(t as any).location?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/tickets/${t.id}`}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ArrowRight className="h-4 w-4" />
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

          {/* Right: Quick Client List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Clients</h2>
              <Link href="/admin/organizations/new">
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> New
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {orgs?.slice(0, 6).map((org) => (
                <Link key={org.id} href={`/admin/organizations/${org.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                        {org.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{org.name}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
              <Link href="/admin/organizations" className="block text-center text-xs text-muted-foreground hover:text-primary py-2">
                View all clients
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- CLIENT DASHBOARD ---
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

  // Fetch recent tickets for client
  const { data: recentTickets } = await supabase
    .from('care_log_tickets')
    .select(`*, location:locations(name)`)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      {/* Client Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.first_name}
          </p>
        </div>
        <Link href="/tickets/new">
          <Button className="bg-accent hover:bg-accent-dark">
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </Link>
      </div>

      {/* Status Banner */}
      <div className="rounded-lg border bg-card p-4 flex items-center gap-4 shadow-sm">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
          (openTicketsCount || 0) > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
        }`}>
          {(openTicketsCount || 0) > 0 ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
        </div>
        <div>
          <h3 className="font-semibold">
            {(openTicketsCount || 0) > 0 
              ? `${openTicketsCount} Open Support Request${openTicketsCount !== 1 ? 's' : ''}`
              : 'All Systems Operational'
            }
          </h3>
          <p className="text-sm text-muted-foreground">
            {(openTicketsCount || 0) > 0 
              ? 'We are working on your reported issues.'
              : 'No outstanding issues reported.'
            }
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Locations</p>
          <p className="text-2xl font-bold mt-1">{locationsCount || 0}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Hardware</p>
          <p className="text-2xl font-bold mt-1">{hardwareCount || 0}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Open Tickets</p>
          <p className="text-2xl font-bold mt-1">{openTicketsCount || 0}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">SOPs</p>
          <p className="text-2xl font-bold mt-1">-</p> {/* Placeholder if needed */}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Link href="/tickets" className="text-sm text-primary hover:underline">View All</Link>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!recentTickets || recentTickets.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No recent activity.
                  </TableCell>
                </TableRow>
              ) : (
                recentTickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.ticket_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{t.title}</span>
                        <span className="text-xs text-muted-foreground">{(t as any).location?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{t.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {new Date(t.updated_at || t.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
