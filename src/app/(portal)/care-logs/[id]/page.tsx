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
  CheckCircle, Image as ImageIcon, ArrowLeft, Edit 
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
  const supabase = await createClient()

  // Get all org members for assignment
  const { data: orgMembers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', [ticket.org_id])
    .limit(50)

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/care-logs" className="hover:text-accent">Care Logs</Link>
        <span>/</span>
        <span className="font-mono">{ticket.ticket_number}</span>
      </div>

      {/* Ticket Header */}
      <Card className="border-l-4" style={{
        borderLeftColor: 
          ticket.priority === 'urgent' ? '#ef4444' :
          ticket.priority === 'high' ? '#f97316' :
          ticket.priority === 'normal' ? '#3b82f6' :
          '#9ca3af'
      }}>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-foreground">{ticket.title}</h1>
                {ticket.priority === 'urgent' && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    URGENT
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge className={`${getStatusColor(ticket.status)} text-sm px-3 py-1`}>
                  {getStatusLabel(ticket.status)}
                </Badge>
                <span className="text-muted-foreground">•</span>
                <span className="font-mono text-muted-foreground">{ticket.ticket_number}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  Created {formatDateTime(ticket.created_at)}
                </span>
              </div>
            </div>

            {canManage && (
              <TicketStatusActions
                ticketId={id}
                currentStatus={ticket.status}
                canManage={canManage}
              />
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main Layout: Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* SOP Acknowledgment */}
          {ticket.sop_acknowledged && (
            <Card className="border-green-500/30 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm">
                      Troubleshooting steps completed
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      User followed standard operating procedures before submitting this ticket
                    </p>
                    {ticket.sop_acknowledged_at && (
                      <p className="text-xs text-green-600 mt-1">
                        Acknowledged: {formatDateTime(ticket.sop_acknowledged_at)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo Attachments - Inline Grid */}
          {ticket.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photos ({ticket.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ticket.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-lg overflow-hidden border hover:shadow-lg transition-all"
                    >
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                          View Full Size
                        </span>
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
        </div>

        {/* Right Column: Sidebar (1/3) */}
        <div className="space-y-4">
          {/* Ticket Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* Status */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Status</p>
                <Badge className={`${getStatusColor(ticket.status)} w-full justify-center py-2`}>
                  {getStatusLabel(ticket.status)}
                </Badge>
              </div>

              <Separator />

              {/* Priority */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Priority</p>
                <Badge 
                  variant={
                    ticket.priority === 'urgent' ? 'destructive' :
                    ticket.priority === 'high' ? 'default' :
                    'outline'
                  }
                  className="w-full justify-center py-2"
                >
                  {ticket.priority.toUpperCase()}
                </Badge>
              </div>

              <Separator />

              {/* Location */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location
                </p>
                <Link 
                  href={`/locations/${ticket.location.id}`}
                  className="text-accent hover:underline font-medium block"
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
                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  Hardware
                </p>
                <Link 
                  href={`/hardware/${ticket.hardware.id}`}
                  className="text-accent hover:underline font-medium block"
                >
                  {ticket.hardware.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {ticket.hardware.hardware_type}
                </p>
                {ticket.hardware.serial_number && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    SN: {ticket.hardware.serial_number}
                  </p>
                )}
              </div>

              <Separator />

              {/* Submitted By */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Submitted By
                </p>
                <p className="font-medium">
                  {ticket.submitted_by_profile.first_name} {ticket.submitted_by_profile.last_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ticket.submitted_by_profile.email}
                </p>
              </div>

              {ticket.assigned_to_profile && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Assigned To</p>
                    <p className="font-medium">
                      {ticket.assigned_to_profile.first_name} {ticket.assigned_to_profile.last_name}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div>
                <p className="text-muted-foreground mb-1">Created</p>
                <p className="font-medium">{formatDateTime(ticket.created_at)}</p>
              </div>
              {ticket.first_response_at && (
                <div>
                  <p className="text-muted-foreground mb-1">First Response</p>
                  <p className="font-medium">{formatDateTime(ticket.first_response_at)}</p>
                </div>
              )}
              {ticket.resolved_at && (
                <div>
                  <p className="text-muted-foreground mb-1">Resolved</p>
                  <p className="font-medium">{formatDateTime(ticket.resolved_at)}</p>
                </div>
              )}
              {ticket.closed_at && (
                <div>
                  <p className="text-muted-foreground mb-1">Closed</p>
                  <p className="font-medium">{formatDateTime(ticket.closed_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {ticket.timing_analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3">
                {ticket.timing_analytics.time_to_first_response_ms && (
                  <div>
                    <p className="text-muted-foreground mb-1">Time to First Response</p>
                    <p className="font-bold text-lg text-accent">
                      {formatDuration(ticket.timing_analytics.time_to_first_response_ms)}
                    </p>
                  </div>
                )}
                {ticket.timing_analytics.time_to_resolve_ms && (
                  <div>
                    <p className="text-muted-foreground mb-1">Time to Resolve</p>
                    <p className="font-bold text-lg text-green-600">
                      {formatDuration(ticket.timing_analytics.time_to_resolve_ms)}
                    </p>
                  </div>
                )}
                {ticket.timing_analytics.time_open_total_ms && (
                  <div>
                    <p className="text-muted-foreground mb-1">Total Time Open</p>
                    <p className="font-bold text-lg">
                      {formatDuration(ticket.timing_analytics.time_open_total_ms)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div className="pt-4">
        <Link href="/care-logs">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </Link>
      </div>
    </div>
  )
}
