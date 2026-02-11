import Link from 'next/link'
import { getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Cpu, 
  Ticket, 
  AlertCircle, 
  Building2, 
  ArrowRight, 
  Plus, 
  Activity, 
  CheckCircle2, 
  TrendingUp,
  Clock,
  UserX,
  Star,
  AlertTriangle
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ActivityChart } from '@/components/charts/ActivityChart'
import { 
  getDashboardStats, 
  getDashboardTickets, 
  getCriticalTickets,
  getDeviceTickets,
  getCustomerTickets
} from '@/lib/queries/dashboard'
import { formatDuration } from '@/lib/utils'

export default async function HomePage() {
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  const isPlatformAdmin = profile?.is_platform_admin === true
  const orgId = profile?.org_memberships?.[0]?.org_id

  // --- PLATFORM ADMIN DASHBOARD (NOC View) ---
  if (isPlatformAdmin) {
    // Fetch dashboard stats
    const stats = await getDashboardStats()
    
    // Fetch ticket lists
    const [openTickets, pendingTickets, dueTodayTickets, overdueTickets, unassignedTickets, criticalTickets] = await Promise.all([
      getDashboardTickets('open', undefined, 5),
      getDashboardTickets('pending', undefined, 5),
      getDashboardTickets('due_today', undefined, 5),
      getDashboardTickets('overdue', undefined, 5),
      getDashboardTickets('unassigned', undefined, 5),
      getCriticalTickets(undefined, 10)
    ])

    // Fetch device tickets and customer tickets
    const deviceTickets = await getDeviceTickets()
    const customerTickets = await getCustomerTickets(undefined, 5)

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
      
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
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
          <h1>Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System-wide overview and status
          </p>
        </div>

        {/* Key Metrics Row 1: Ticket Counts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open Tickets</p>
                  <p className="text-3xl font-bold mt-2">{stats.openTickets}</p>
                </div>
                <div className="h-10 w-10 rounded bg-accent/10 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
                  <p className="text-3xl font-bold mt-2">{stats.pendingTickets}</p>
                </div>
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Today</p>
                  <p className="text-3xl font-bold mt-2 text-accent">{stats.dueTodayTickets}</p>
                </div>
                <div className="h-10 w-10 rounded bg-accent/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overdue</p>
                  <p className="text-3xl font-bold mt-2 text-red-600">{stats.overdueTickets}</p>
                </div>
                <div className="h-10 w-10 rounded bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unassigned</p>
                  <p className="text-3xl font-bold mt-2">{stats.unassignedTickets}</p>
                </div>
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                  <UserX className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics Row 2: SLA Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Response Time</p>
                  <p className="text-2xl font-bold mt-2">
                    {stats.avgResponseTime > 0 ? formatDuration(stats.avgResponseTime) : 'N/A'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Resolution Time</p>
                  <p className="text-2xl font-bold mt-2">
                    {stats.avgResolutionTime > 0 ? formatDuration(stats.avgResolutionTime) : 'N/A'}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SLA Compliance</p>
                  <p className="text-2xl font-bold mt-2">
                    {stats.slaCompliancePercentage.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical and Overdue Tickets */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Critical & Overdue Tickets
                </CardTitle>
                <Link href="/tickets">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {criticalTickets.tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No critical tickets</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Subject</TableHead>
                      <TableHead className="text-xs">Client</TableHead>
                      <TableHead className="text-xs"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criticalTickets.tickets.map((t: any) => (
                      <TableRow key={t.id} className="group hover:bg-muted/20">
                        <TableCell className="font-mono text-xs text-muted-foreground">{t.ticket_number}</TableCell>
                        <TableCell className="font-medium text-sm">{t.title}</TableCell>
                        <TableCell className="text-xs">{(t as any).organization?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Link href={`/tickets/${t.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Customer Satisfaction */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Customer Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-3xl font-bold">{stats.customerSatisfactionAvg > 0 ? stats.customerSatisfactionAvg.toFixed(1) : 'N/A'}</p>
                    {stats.customerSatisfactionAvg > 0 && (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 ${i <= Math.round(stats.customerSatisfactionAvg) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {stats.dissatisfiedCustomers.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-red-600 mb-2">Dissatisfied Customers</p>
                    <div className="space-y-2">
                      {stats.dissatisfiedCustomers.map((customer) => (
                        <div key={customer.org_id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{customer.org_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {customer.avg_rating.toFixed(1)}/5 ({customer.ticket_count} tickets)
                            </p>
                          </div>
                          <Link href={`/admin/organizations/${customer.org_id}`}>
                            <Button variant="ghost" size="sm" className="h-7">
                              View →
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unassigned Tickets */}
        {unassignedTickets.tickets.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <UserX className="h-4 w-4 text-muted-foreground" />
                  Unassigned Tickets
                </CardTitle>
                <Link href="/tickets">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">Priority</TableHead>
                    <TableHead className="text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedTickets.tickets.map((t: any) => (
                    <TableRow key={t.id} className="group hover:bg-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground">{t.ticket_number}</TableCell>
                      <TableCell className="font-medium text-sm">{t.title}</TableCell>
                      <TableCell className="text-xs">{t.organization?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={t.priority === 'urgent' ? 'destructive' : 'outline'} className="text-[10px] capitalize">
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/tickets/${t.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Device Tickets */}
        {deviceTickets.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Device Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {deviceTickets.slice(0, 6).map((device) => (
                  <div key={device.hardware_type} className="p-3 border rounded-lg">
                    <p className="font-medium text-sm">{device.hardware_type}</p>
                    <p className="text-xs text-muted-foreground mt-1">{device.hardware_name}</p>
                    <Badge variant="outline" className="mt-2">{device.ticket_count} tickets</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Tickets */}
        {customerTickets.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Customer Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerTickets.slice(0, 5).map((customer) => (
                  <div key={customer.org_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{customer.org_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {customer.total_tickets} total tickets
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/organizations/${customer.org_id}`}>
                        <Button variant="ghost" size="sm">View Client →</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Client List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Clients</CardTitle>
              <Link href="/admin/organizations/new">
                <Button size="sm" variant="outline" className="h-8 text-xs px-3">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> New
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
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
    )
  }

  // --- CLIENT DASHBOARD ---
  const stats = await getDashboardStats(orgId)
  const [openTicketsList, pendingTicketsList, dueTodayTicketsList, overdueTicketsList] = await Promise.all([
    getDashboardTickets('open', orgId, 5),
    getDashboardTickets('pending', orgId, 5),
    getDashboardTickets('due_today', orgId, 5),
    getDashboardTickets('overdue', orgId, 5)
  ])

  const { count: locationsCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  const { count: hardwareCount } = await supabase
    .from('hardware')
    .select('*', { count: 'exact', head: true })

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
          <h1>Dashboard</h1>
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
        (stats.openTickets || 0) > 0 
          ? 'bg-gradient-to-br from-yellow-50 to-white' 
          : 'bg-gradient-to-br from-green-50 to-white'
      }`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              (stats.openTickets || 0) > 0 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              {(stats.openTickets || 0) > 0 ? (
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {(stats.openTickets || 0) > 0 
                  ? `${stats.openTickets} Open Support Request${stats.openTickets !== 1 ? 's' : ''}`
                  : 'All Systems Operational'
                }
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {(stats.openTickets || 0) > 0 
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
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Open Tickets</p>
            <p className="text-3xl font-bold mt-2">{stats.openTickets}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
            <p className="text-3xl font-bold mt-2">{stats.pendingTickets}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Due Today</p>
            <p className="text-3xl font-bold mt-2 text-accent">{stats.dueTodayTickets}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Overdue</p>
            <p className="text-3xl font-bold mt-2 text-red-600">{stats.overdueTickets}</p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Response Time</p>
            <p className="text-2xl font-bold mt-2">
              {stats.avgResponseTime > 0 ? formatDuration(stats.avgResponseTime) : 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Resolution Time</p>
            <p className="text-2xl font-bold mt-2">
              {stats.avgResolutionTime > 0 ? formatDuration(stats.avgResolutionTime) : 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">SLA Compliance</p>
            <p className="text-2xl font-bold mt-2">
              {stats.slaCompliancePercentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Satisfaction</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-2xl font-bold">
                {stats.customerSatisfactionAvg > 0 ? stats.customerSatisfactionAvg.toFixed(1) : 'N/A'}
              </p>
              {stats.customerSatisfactionAvg > 0 && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i <= Math.round(stats.customerSatisfactionAvg) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              )}
            </div>
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
