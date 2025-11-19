import Link from 'next/link'
import { getTickets } from '@/lib/queries/tickets'
import { getLocations } from '@/lib/queries/locations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Ticket, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { formatRelativeTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import { getCurrentUser } from '@/lib/auth'

export default async function CareLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; location?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  
  // Zendesk-inspired smart filters
  const allTickets = await getTickets()
  const myTickets = allTickets.filter(t => t.assigned_to === user?.id)
  const unassignedTickets = allTickets.filter(t => !t.assigned_to && t.status !== 'closed')
  const urgentTickets = allTickets.filter(t => 
    t.priority === 'urgent' && ['open', 'in_progress'].includes(t.status)
  )
  const locations = await getLocations()

  // Create location lookup
  const locationMap = new Map(locations.map(loc => [loc.id, loc]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Care Logs</h1>
          <p className="text-muted-foreground mt-2">
            Support tickets and hardware issues
          </p>
        </div>
        <Link href="/care-logs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        </Link>
      </div>

      {/* Smart Filters (Zendesk Style) */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="all">
            All ({allTickets.length})
          </TabsTrigger>
          <TabsTrigger value="my">
            My Tickets ({myTickets.length})
          </TabsTrigger>
          <TabsTrigger value="unassigned">
            Unassigned ({unassignedTickets.length})
          </TabsTrigger>
          <TabsTrigger value="urgent">
            <AlertCircle className="h-4 w-4 mr-1" />
            Urgent ({urgentTickets.length})
          </TabsTrigger>
        </TabsList>

        {/* All Tickets */}
        <TabsContent value="all" className="space-y-4">
          {allTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first support ticket
                </p>
                <Link href="/care-logs/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {allTickets.map((ticket) => {
                const location = locationMap.get(ticket.location_id)
                return (
                  <Link key={ticket.id} href={`/care-logs/${ticket.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-muted-foreground">
                                {ticket.ticket_number}
                              </span>
                              {ticket.priority === 'urgent' && (
                                <AlertCircle className="h-4 w-4 text-accent flex-shrink-0" />
                              )}
                            </div>
                            <h3 className="font-semibold text-foreground truncate">
                              {ticket.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {location?.name} • {formatRelativeTime(ticket.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                            {ticket.priority !== 'normal' && (
                              <Badge variant="outline" className="text-xs">
                                {ticket.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* My Tickets */}
        <TabsContent value="my" className="space-y-3">
          {myTickets.map((ticket) => {
            const location = locationMap.get(ticket.location_id)
            return (
              <Link key={ticket.id} href={`/care-logs/${ticket.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">
                            {ticket.ticket_number}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground truncate">
                          {ticket.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {location?.name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusLabel(ticket.status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          {myTickets.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No tickets assigned to you
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Unassigned */}
        <TabsContent value="unassigned" className="space-y-3">
          {unassignedTickets.map((ticket) => (
            <Link key={ticket.id} href={`/care-logs/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-accent/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-sm text-muted-foreground">
                        {ticket.ticket_number}
                      </span>
                      <h3 className="font-semibold text-foreground truncate">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(ticket.created_at)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {unassignedTickets.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                All tickets are assigned
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Urgent */}
        <TabsContent value="urgent" className="space-y-3">
          {urgentTickets.map((ticket) => (
            <Link key={ticket.id} href={`/care-logs/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-accent">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4 text-accent" />
                        <span className="font-mono text-sm text-muted-foreground">
                          {ticket.ticket_number}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground truncate">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(ticket.created_at)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(ticket.status)}>
                      {getStatusLabel(ticket.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {urgentTickets.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                No urgent tickets
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

