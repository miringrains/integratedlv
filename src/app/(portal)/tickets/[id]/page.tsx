import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTicketById, getTicketComments } from '@/lib/queries/tickets'
import { isOrgAdmin, getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { TicketStatusActions } from '@/components/tickets/TicketStatusActions'
import { CommentSection } from '@/components/tickets/CommentSection'
import { 
  MapPin, Cpu, User, Calendar, Clock, AlertTriangle, 
  CheckCircle, Image as ImageIcon, ArrowLeft, Paperclip
} from 'lucide-react'
import { formatDateTime, formatDuration, getStatusColor, getStatusLabel } from '@/lib/utils'

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ticket = await getTicketById(id)
  const canManage = await isOrgAdmin()
  const currentUser = await getCurrentUser()

  if (!ticket) notFound()

  const comments = await getTicketComments(id)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/tickets" className="link-accent">
          Tickets
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="mono-id text-foreground">{ticket.ticket_number}</span>
      </div>

      {/* Ticket Header - NO UGLY BORDER */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            {/* Priority Badge */}
            {ticket.priority === 'urgent' && (
              <Badge className="badge-status bg-accent text-white border-accent mb-3 gap-1.5 px-4 py-1.5">
                <AlertTriangle className="h-4 w-4" />
                URGENT
              </Badge>
            )}
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {ticket.title}
            </h1>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge className={getStatusColor(ticket.status)}>
                {getStatusLabel(ticket.status)}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="mono-id text-muted-foreground">
                {ticket.ticket_number}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(ticket.created_at)}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          {canManage && (
            <div className="flex-shrink-0">
              <TicketStatusActions
                ticketId={id}
                currentStatus={ticket.status}
                canManage={canManage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* SOP Acknowledgment */}
          {ticket.sop_acknowledged && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">
                    Troubleshooting Completed
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    User followed standard operating procedures before submitting
                  </p>
                  {ticket.sop_acknowledged_at && (
                    <p className="text-xs text-green-600 mt-2">
                      Acknowledged: {formatDateTime(ticket.sop_acknowledged_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PHOTOS - PROMINENT DISPLAY */}
          {ticket.attachments.length > 0 && (
            <Card className="border-2 border-accent/20">
              <CardHeader className="bg-accent/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <ImageIcon className="h-5 w-5" />
                    Attached Photos
                  </CardTitle>
                  <Badge variant="outline" className="text-accent border-accent">
                    {ticket.attachments.length} image{ticket.attachments.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ticket.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-accent shadow-md hover:shadow-xl transition-all"
                    >
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white text-xs font-medium truncate">
                            {attachment.file_name}
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
                          View Full Size →
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversation */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection
                ticketId={id}
                comments={comments as any}
                canManage={canManage}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <p className="badge-text text-muted-foreground mb-2">Status</p>
                <Badge className={`${getStatusColor(ticket.status)} w-full justify-center py-2.5`}>
                  {getStatusLabel(ticket.status)}
                </Badge>
              </div>

              <Separator />

              {/* Priority */}
              <div>
                <p className="badge-text text-muted-foreground mb-2">Priority</p>
                <Badge className={`badge-status w-full justify-center py-2.5 ${
                  ticket.priority === 'urgent' ? 'bg-accent text-white border-accent' :
                  ticket.priority === 'high' ? 'bg-accent/70 text-white border-accent/70' :
                  ticket.priority === 'normal' ? 'bg-primary/20 text-primary border-primary/30' :
                  'bg-muted text-muted-foreground border-muted'
                }`}>
                  {ticket.priority}
                </Badge>
              </div>

              <Separator />

              {/* Location */}
              <div>
                <p className="badge-text text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location
                </p>
                <Link 
                  href={`/locations/${ticket.location.id}`}
                  className="link-accent block text-sm"
                >
                  {ticket.location.name}
                </Link>
                {ticket.location.city && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {ticket.location.city}, {ticket.location.state}
                  </p>
                )}
              </div>

              <Separator />

              {/* Hardware */}
              <div>
                <p className="badge-text text-muted-foreground mb-2 flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  Hardware
                </p>
                <Link 
                  href={`/hardware/${ticket.hardware.id}`}
                  className="link-accent block text-sm"
                >
                  {ticket.hardware.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {ticket.hardware.hardware_type}
                </p>
                {ticket.hardware.serial_number && (
                  <p className="mono-code mt-1">
                    SN: {ticket.hardware.serial_number}
                  </p>
                )}
              </div>

              <Separator />

              {/* Submitted By */}
              <div>
                <p className="badge-text text-muted-foreground mb-2 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Submitted By
                </p>
                <p className="font-semibold text-sm">
                  {ticket.submitted_by_profile.first_name} {ticket.submitted_by_profile.last_name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ticket.submitted_by_profile.email}
                </p>
              </div>

              {ticket.assigned_to_profile && (
                <>
                  <Separator />
                  <div>
                    <p className="badge-text text-muted-foreground mb-2">Assigned To</p>
                    <p className="font-semibold text-sm">
                      {ticket.assigned_to_profile.first_name} {ticket.assigned_to_profile.last_name}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <span className="text-muted-foreground">Created</span>
                <span className="font-semibold">{formatDateTime(ticket.created_at)}</span>
              </div>
              {ticket.first_response_at && (
                <div className="flex items-center justify-between p-2 rounded-md bg-primary/5">
                  <span className="text-muted-foreground">First Response</span>
                  <span className="font-semibold">{formatDateTime(ticket.first_response_at)}</span>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex items-center justify-between p-2 rounded-md bg-green-50">
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="font-semibold">{formatDateTime(ticket.resolved_at)}</span>
                </div>
              )}
              {ticket.closed_at && (
                <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                  <span className="text-muted-foreground">Closed</span>
                  <span className="font-semibold">{formatDateTime(ticket.closed_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {ticket.timing_analytics && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.timing_analytics.time_to_first_response_ms && (
                  <div className="text-center p-3 rounded-lg bg-white border">
                    <p className="text-xs text-muted-foreground mb-1">First Response</p>
                    <p className="text-2xl font-bold text-accent">
                      {formatDuration(ticket.timing_analytics.time_to_first_response_ms)}
                    </p>
                  </div>
                )}
                {ticket.timing_analytics.time_to_resolve_ms && (
                  <div className="text-center p-3 rounded-lg bg-white border">
                    <p className="text-xs text-muted-foreground mb-1">Time to Resolve</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatDuration(ticket.timing_analytics.time_to_resolve_ms)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* How to Change Status */}
          {canManage && ticket.status !== 'closed' && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-accent" />
                  Change Status
                </p>
                <p>Use the action buttons above to update ticket status:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li><strong>Start Working</strong> → Marks as In Progress</li>
                  <li><strong>Mark Resolved</strong> → Issue fixed, awaiting closure</li>
                  <li><strong>Close Ticket</strong> → Fully completed</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div>
        <Link href="/tickets">
          <Button variant="outline" size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Tickets
          </Button>
        </Link>
      </div>
    </div>
  )
}
