import Link from 'next/link'
import { getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Cpu, Ticket, AlertCircle, Building2, ArrowRight, Plus, Activity, CheckCircle2, TrendingUp } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ActivityChart } from '@/components/charts/ActivityChart'

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

    const { count: totalClients } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .neq('name', 'Integrated LV')

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

    // Fetch ticket activity for last 7 days (for chart)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: recentTicketActivity } = await supabase
      .from('care_log_tickets')
      .select('created_at, status, priority')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Process data for chart (group by day)
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      
      const dayTickets = recentTicketActivity?.filter(t => {
        const ticketDate = new Date(t.created_at)
        return ticketDate >= dayStart && ticketDate <= dayEnd
      }) || []
      
      chartData.push({
        date: dateStr,
        tickets: dayTickets.length,
        urgent: dayTickets.filter(t => t.priority === 'urgent').length
      })
    }

    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1>Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System-wide overview and status
          </p>
        </div>

        {/* Key Metrics - NO UGLY BORDERS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Urgent Tickets */}
          <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-red-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Urgent</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{totalUrgentTickets}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Open */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Open</p>
                  <p className="text-3xl font-bold mt-2">{totalActiveTickets}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Clients */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Clients</p>
                  <p className="text-3xl font-bold mt-2">{totalClients}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">System Status</p>
                  <p className="text-lg font-bold mt-2 flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" /> Operational
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Ticket Activity (Last 7 Days)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityChart data={chartData} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Urgent Tickets Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Urgent Incidents
              </h2>
              <Link href="/tickets" className="text-xs text-primary hover:underline font-medium">
                View All Queue →
              </Link>
            </div>
            <Card className="shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Client / Location</TableHead>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!urgentTickets || urgentTickets.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                          <p className="font-medium">No urgent tickets</p>
                          <p className="text-xs">All systems stable</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    urgentTickets.map((t) => (
                      <TableRow key={t.id} className="group hover:bg-muted/20">
                        <TableCell className="font-mono text-xs text-muted-foreground">{t.ticket_number}</TableCell>
                        <TableCell className="font-medium text-sm">{t.title}</TableCell>
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
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <h2>Clients</h2>
              <Link href="/admin/organizations/new">
                <Button size="sm" variant="outline" className="h-8 text-xs px-3">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> New
                </Button>
              </Link>
            </div>
            <Card className="shadow-sm">
              <CardContent className="p-3">
                <div className="space-y-0 divide-y">
                  {orgs?.slice(0, 6).map((org) => (
                    <Link key={org.id} href={`/admin/organizations/${org.id}`}>
                      <div className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors rounded-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{org.name}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="pt-3 border-t mt-3">
                  <Link href="/admin/organizations" className="block text-center text-xs text-primary hover:underline font-medium py-2">
                    View all clients →
                  </Link>
                </div>
              </CardContent>
            </Card>
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
          <h1>Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Welcome back, {profile?.first_name}
          </p>
        </div>
        <Link href="/tickets/new">
          <Button size="sm" className="bg-accent hover:bg-accent-dark h-9 px-4">
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </Link>
      </div>

      {/* Status Banner */}
      <Card className={`shadow-sm ${
        (openTicketsCount || 0) > 0 
          ? 'bg-gradient-to-br from-yellow-50 to-white' 
          : 'bg-gradient-to-br from-green-50 to-white'
      }`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              (openTicketsCount || 0) > 0 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              {(openTicketsCount || 0) > 0 ? (
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {(openTicketsCount || 0) > 0 
                  ? `${openTicketsCount} Open Support Request${openTicketsCount !== 1 ? 's' : ''}`
                  : 'All Systems Operational'
                }
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {(openTicketsCount || 0) > 0 
                  ? 'We are working on your reported issues.'
                  : 'No outstanding issues reported.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Locations</p>
            <p className="text-3xl font-bold mt-2">{locationsCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Hardware</p>
            <p className="text-3xl font-bold mt-2">{hardwareCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Open Tickets</p>
            <p className="text-3xl font-bold mt-2">{openTicketsCount || 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">SOPs</p>
            <p className="text-3xl font-bold mt-2">-</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2>Recent Activity</h2>
          <Link href="/tickets" className="text-xs text-primary hover:underline font-medium">
            View All →
          </Link>
        </div>
        <Card className="shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">ID</TableHead>
                <TableHead className="text-xs">Subject</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!recentTickets || recentTickets.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Ticket className="h-8 w-8 text-muted-foreground/30" />
                      <p>No recent activity</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentTickets.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.ticket_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link href={`/tickets/${t.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                          {t.title}
                        </Link>
                        <span className="text-xs text-muted-foreground">{(t as any).location?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {t.status.replace('_', ' ')}
                      </Badge>
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
