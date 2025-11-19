import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTicketById, getTicketComments } from '@/lib/queries/tickets'
import { isOrgAdmin } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TicketStatusActions } from '@/components/tickets/TicketStatusActions'
import { TicketTimeline } from '@/components/tickets/TicketTimeline'
import { CommentSection } from '@/components/tickets/CommentSection'
import { ImageGallery } from '@/components/ui/ImageGallery'
import { MapPin, Cpu, User, Calendar, CheckCircle, AlertTriangle } from 'lucide-react'
import { formatDateTime, formatDuration, getStatusColor, getStatusLabel } from '@/lib/utils'

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ticket = await getTicketById(id)
  const canManage = await isOrgAdmin()

  if (!ticket) notFound()

  const comments = await getTicketComments(id)

  // Prepare images for gallery
  const images = ticket.attachments.map(att => ({
    url: att.file_url,
    caption: att.caption || att.file_name,
    fileName: att.file_name,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">{ticket.title}</h1>
            {ticket.priority === 'urgent' && (
              <AlertTriangle className="h-5 w-5 text-accent" />
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-mono">{ticket.ticket_number}</span>
            <span>•</span>
            <span>Created {formatDateTime(ticket.created_at)}</span>
          </div>
        </div>
        <Badge className={`${getStatusColor(ticket.status)} text-sm px-3 py-1`}>
          {getStatusLabel(ticket.status)}
        </Badge>
      </div>

      {/* Main Layout: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* SOP Acknowledgment */}
          {ticket.sop_acknowledged && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    User followed troubleshooting procedures before submitting
                  </span>
                </div>
                {ticket.sop_acknowledged_at && (
                  <p className="text-xs text-green-600 mt-1 ml-6">
                    Acknowledged at {formatDateTime(ticket.sop_acknowledged_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attachments ({images.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageGallery images={images} />
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection
                ticketId={id}
                comments={comments as any}
                canManage={canManage}
              />
            </CardContent>
          </Card>

          {/* Event Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketTimeline events={ticket.events} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Properties Panel (Zendesk Style) */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketStatusActions
                ticketId={id}
                currentStatus={ticket.status}
                canManage={canManage}
              />
            </CardContent>
          </Card>

          {/* Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                <Badge variant={
                  ticket.priority === 'urgent' ? 'destructive' :
                  ticket.priority === 'high' ? 'default' :
                  'outline'
                }>
                  {ticket.priority}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location
                </p>
                <Link 
                  href={`/locations/${ticket.location.id}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {ticket.location.name}
                </Link>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  Hardware
                </p>
                <Link 
                  href={`/hardware/${ticket.hardware.id}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {ticket.hardware.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ticket.hardware.hardware_type}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Submitted by
                </p>
                <p className="text-sm font-medium">
                  {ticket.submitted_by_profile.first_name} {ticket.submitted_by_profile.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ticket.submitted_by_profile.email}
                </p>
              </div>

              {ticket.assigned_to_profile && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Assigned to</p>
                  <p className="text-sm font-medium">
                    {ticket.assigned_to_profile.first_name} {ticket.assigned_to_profile.last_name}
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Dates
                </p>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">{formatDateTime(ticket.created_at)}</span>
                  </div>
                  {ticket.first_response_at && (
                    <div>
                      <span className="text-muted-foreground">First Response:</span>
                      <span className="ml-2">{formatDateTime(ticket.first_response_at)}</span>
                    </div>
                  )}
                  {ticket.resolved_at && (
                    <div>
                      <span className="text-muted-foreground">Resolved:</span>
                      <span className="ml-2">{formatDateTime(ticket.resolved_at)}</span>
                    </div>
                  )}
                  {ticket.closed_at && (
                    <div>
                      <span className="text-muted-foreground">Closed:</span>
                      <span className="ml-2">{formatDateTime(ticket.closed_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timing Metrics */}
              {ticket.timing_analytics && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Performance Metrics</p>
                    <div className="text-xs space-y-1">
                      {ticket.timing_analytics.time_to_first_response_ms && (
                        <div>
                          <span className="text-muted-foreground">First Response:</span>
                          <span className="ml-2 font-semibold">
                            {formatDuration(ticket.timing_analytics.time_to_first_response_ms)}
                          </span>
                        </div>
                      )}
                      {ticket.timing_analytics.time_to_resolve_ms && (
                        <div>
                          <span className="text-muted-foreground">Time to Resolve:</span>
                          <span className="ml-2 font-semibold">
                            {formatDuration(ticket.timing_analytics.time_to_resolve_ms)}
                          </span>
                        </div>
                      )}
                      {ticket.timing_analytics.time_open_total_ms && (
                        <div>
                          <span className="text-muted-foreground">Total Time:</span>
                          <span className="ml-2 font-semibold">
                            {formatDuration(ticket.timing_analytics.time_open_total_ms)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

