import Link from 'next/link'
import { getTickets } from '@/lib/queries/tickets'
import { getLocations } from '@/lib/queries/locations'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Ticket, AlertCircle, Clock, CheckCircle2, Search, Filter, Image as ImageIcon, User } from 'lucide-react'
import { formatRelativeTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import { getCurrentUser } from '@/lib/auth'

export default async function CareLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; location?: string; priority?: string; search?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  const supabase = await createClient()
  
  // Apply filters
  const filters: any = {}
  if (params.status) filters.status = params.status
  if (params.location) filters.locationId = params.location
  if (params.priority) filters.priority = params.priority
  if (params.search) filters.search = params.search

  const allTickets = await getTickets(filters)
  
  // Zendesk-inspired smart views
  const myTickets = allTickets.filter(t => t.assigned_to === user?.id)
  const unassignedTickets = allTickets.filter(t => !t.assigned_to && t.status !== 'closed')
  const urgentTickets = allTickets.filter(t => 
    t.priority === 'urgent' && ['open', 'in_progress'].includes(t.status)
  )
  
  const locations = await getLocations()

  // Create location lookup and get hardware/submitter names
  const locationMap = new Map(locations.map(loc => [loc.id, loc]))
  
  // Get hardware and profile info for each ticket
  const ticketsWithDetails = await Promise.all(
    allTickets.map(async (ticket) => {
      const { data: hardware } = await supabase
        .from('hardware')
        .select('name')
        .eq('id', ticket.hardware_id)
        .single()
      
      const { data: submitter } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', ticket.submitted_by)
        .single()

      const { data: attachments } = await supabase
        .from('ticket_attachments')
        .select('id')
        .eq('ticket_id', ticket.id)

      return {
        ...ticket,
        hardware_name: hardware?.name,
        submitter_name: submitter ? `${submitter.first_name} ${submitter.last_name}` : 'Unknown',
        attachment_count: attachments?.length || 0,
      }
    })
  )

  return (
    <div className="space-y-4">
      {/* Header with Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Care Log Tickets</h1>
          <p className="text-muted-foreground mt-1">
            {allTickets.length} total tickets
          </p>
        </div>
        <Link href="/care-logs/new">
          <Button size="lg" className="w-full md:w-auto">
            <Plus className="h-5 w-5 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                className="pl-10"
                defaultValue={params.search}
              />
            </div>
            <Select defaultValue={params.status || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={params.priority || 'all'}>
              <SelectTrigger>
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Smart Views Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-grid">
          <TabsTrigger value="all" className="gap-2">
            All <Badge variant="secondary" className="ml-1">{allTickets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="my" className="gap-2">
            My Tickets <Badge variant="secondary" className="ml-1">{myTickets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="gap-2">
            Unassigned <Badge variant="secondary" className="ml-1">{unassignedTickets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="urgent" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Urgent <Badge variant="destructive" className="ml-1">{urgentTickets.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* All Tickets */}
        <TabsContent value="all" className="space-y-2">
          {ticketsWithDetails.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Ticket className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Create your first support ticket to get started
                </p>
                <Link href="/care-logs/new">
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Ticket
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg divide-y bg-card">
              {ticketsWithDetails.map((ticket) => {
                const location = locationMap.get(ticket.location_id)
                return (
                  <Link key={ticket.id} href={`/care-logs/${ticket.id}`}>
                    <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-start gap-4">
                        {/* Priority Indicator */}
                        <div className={`w-1 h-16 rounded-full flex-shrink-0 ${
                          ticket.priority === 'urgent' ? 'bg-red-500' :
                          ticket.priority === 'high' ? 'bg-orange-500' :
                          ticket.priority === 'normal' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`} />

                        {/* Ticket Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header Row */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-xs text-muted-foreground font-medium">
                              {ticket.ticket_number}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                            {ticket.priority === 'urgent' && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                URGENT
                              </Badge>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-base text-foreground mb-2 group-hover:text-accent transition-colors">
                            {ticket.title}
                          </h3>

                          {/* Meta Info Row */}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {ticket.submitter_name}
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {location?.name}
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {ticket.hardware_name}
                            </div>
                            {ticket.attachment_count > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  {ticket.attachment_count} photo{ticket.attachment_count > 1 ? 's' : ''}
                                </div>
                              </>
                            )}
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatRelativeTime(ticket.created_at)}
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions (visible on hover) */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="outline">
                            View →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Render ticket lists for each tab using same component */}
        {['all', 'my', 'unassigned', 'urgent'].map((view) => {
          const viewTickets = 
            view === 'my' ? myTickets :
            view === 'unassigned' ? unassignedTickets :
            view === 'urgent' ? urgentTickets :
            allTickets
          
          const relevantTickets = ticketsWithDetails.filter(t => {
            if (view === 'my') return t.assigned_to === user?.id
            if (view === 'unassigned') return !t.assigned_to && t.status !== 'closed'
            if (view === 'urgent') return t.priority === 'urgent' && ['open', 'in_progress'].includes(t.status)
            return true
          })

          return (
            <TabsContent key={view} value={view} className="mt-0">
              {relevantTickets.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No {view === 'all' ? '' : view + ' '}tickets</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="border rounded-lg divide-y bg-card">
                  {relevantTickets.map((ticket) => {
                    const location = locationMap.get(ticket.location_id)
                    return (
                      <Link key={ticket.id} href={`/care-logs/${ticket.id}`}>
                        <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                          <div className="flex items-start gap-4">
                            {/* Priority Indicator */}
                            <div className={`w-1 h-16 rounded-full flex-shrink-0 ${
                              ticket.priority === 'urgent' ? 'bg-red-500' :
                              ticket.priority === 'high' ? 'bg-orange-500' :
                              ticket.priority === 'normal' ? 'bg-blue-500' :
                              'bg-gray-300'
                            }`} />

                            {/* Ticket Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-xs text-muted-foreground font-medium">
                                  {ticket.ticket_number}
                                </span>
                                <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                                  {getStatusLabel(ticket.status)}
                                </Badge>
                                {ticket.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    URGENT
                                  </Badge>
                                )}
                              </div>

                              <h3 className="font-semibold text-base text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-1">
                                {ticket.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  <span className="truncate max-w-[150px]">{ticket.submitter_name}</span>
                                </div>
                                <span className="hidden sm:inline">•</span>
                                <span className="truncate max-w-[200px]">{location?.name}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="truncate max-w-[200px]">{ticket.hardware_name}</span>
                                {ticket.attachment_count > 0 && (
                                  <>
                                    <span className="hidden md:inline">•</span>
                                    <div className="flex items-center gap-1 text-accent">
                                      <ImageIcon className="h-3.5 w-3.5" />
                                      {ticket.attachment_count}
                                    </div>
                                  </>
                                )}
                                <span className="hidden md:inline">•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatRelativeTime(ticket.created_at)}
                                </div>
                              </div>
                            </div>

                            {/* Quick View Arrow */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="ghost" className="h-8">
                                View →
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

