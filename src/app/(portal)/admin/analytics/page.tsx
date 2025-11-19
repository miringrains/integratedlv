import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

export default async function AdminAnalyticsPage() {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const orgId = profile?.org_memberships?.[0]?.org_id

  const supabase = await createClient()

  // Get ticket stats
  const { count: totalTickets } = await supabase
    .from('care_log_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  const { count: openTickets } = await supabase
    .from('care_log_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'open')

  const { count: resolvedTickets } = await supabase
    .from('care_log_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'resolved')

  const { count: closedTickets } = await supabase
    .from('care_log_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'closed')

  // Average response time
  const { data: avgResponseTime } = await supabase
    .from('ticket_timing_analytics')
    .select('time_to_first_response_ms')
    .not('time_to_first_response_ms', 'is', null)
    .limit(100)

  const avgResponse = avgResponseTime && avgResponseTime.length > 0
    ? avgResponseTime.reduce((sum, t) => sum + (t.time_to_first_response_ms || 0), 0) / avgResponseTime.length
    : 0

  // Top hardware by ticket count
  const { data: hardwareTicketCounts } = await supabase
    .from('care_log_tickets')
    .select('hardware_id, hardware(name, hardware_type)')
    .eq('org_id', orgId)

  const hardwareMap = new Map()
  hardwareTicketCounts?.forEach((ticket: any) => {
    const hw = ticket.hardware
    if (hw) {
      const key = hw.name
      hardwareMap.set(key, {
        name: hw.name,
        type: hw.hardware_type,
        count: (hardwareMap.get(key)?.count || 0) + 1,
      })
    }
  })

  const topHardware = Array.from(hardwareMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Performance metrics and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{totalTickets || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-accent">{openTickets || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedTickets || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">
                  {avgResponse > 0 ? formatDuration(avgResponse) : 'N/A'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Hardware by Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Top Hardware by Ticket Volume</CardTitle>
        </CardHeader>
        <CardContent>
          {topHardware.length > 0 ? (
            <div className="space-y-3">
              {topHardware.map((hw, index) => (
                <div key={hw.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{hw.name}</p>
                      <p className="text-sm text-muted-foreground">{hw.type}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{hw.count} tickets</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No ticket data available yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Open</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-muted rounded-full h-2">
                  <div 
                    className="bg-accent h-2 rounded-full" 
                    style={{ width: `${((openTickets || 0) / (totalTickets || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">{openTickets || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Resolved</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${((resolvedTickets || 0) / (totalTickets || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">{resolvedTickets || 0}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Closed</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-muted rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full" 
                    style={{ width: `${((closedTickets || 0) / (totalTickets || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">{closedTickets || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

