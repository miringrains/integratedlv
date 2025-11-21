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
import { AssignmentDropdown } from '@/components/tickets/AssignmentDropdown'
import { LocationMap } from '@/components/maps/LocationMap'
import { 
  MapPin, Cpu, User, Calendar, Clock, AlertTriangle, 
  CheckCircle, Image as ImageIcon, ArrowLeft, Paperclip, Building2
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
  
  // Get org members for assignment
  const { data: orgMembers } = await supabase
    .from('org_memberships')
    .select('user_id, profiles!inner(*)')
    .eq('org_id', ticket.org_id)
  
  const members = orgMembers?.map((m: any) => m.profiles).filter(Boolean) || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/tickets" className="text-primary hover:underline font-medium">
          Tickets
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="mono-id text-muted-foreground">{ticket.ticket_number}</span>
      </div>

      {/* Ticket Header */}
      <div className="bg-card border border-primary rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            {/* Priority Badge */}
            {ticket.priority === 'urgent' && (
              <Badge className="bg-accent text-white border-0 mb-3 gap-1.5 px-3 py-1 text-xs font-semibold uppercase">
                <AlertTriangle className="h-3.5 w-3.5" />
                URGENT
              </Badge>
            )}
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {ticket.title}
            </h1>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                {getStatusLabel(ticket.status)}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="mono-id text-muted-foreground text-xs">
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
          <Card className="border-primary">
            <CardHeader className="bg-primary">
              <CardTitle className="text-base text-primary-foreground">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {/* PHOTOS - Always show section, even if empty */}
          <Card className="border-primary">
            <CardHeader className="bg-primary">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-primary-foreground text-base">
                  <ImageIcon className="h-4 w-4" />
                  Attached Photos
                </CardTitle>
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <Badge className="bg-accent text-white border-0 text-xs">
                    {ticket.attachments.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {ticket.attachments && ticket.attachments.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ticket.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-accent shadow-sm hover:shadow-md transition-all"
                    >
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs font-medium truncate">
                            {attachment.file_name}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p>No photos attached to this ticket</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SOP Acknowledgment */}
          {ticket.sop_acknowledged && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      Troubleshooting Completed
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      User followed standard operating procedures before submitting
                    </p>
                    {ticket.sop_acknowledged_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Acknowledged: {formatDateTime(ticket.sop_acknowledged_at)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversation */}
          <Card className="border-primary">
            <CardHeader className="bg-primary">
              <CardTitle className="text-base text-primary-foreground">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
          <Card className="border-primary">
            <CardHeader className="bg-primary">
              <CardTitle className="text-base text-primary-foreground">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Status */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Status</p>
                <div className={`${
                  ticket.status === 'open' ? 'bg-accent/10 border-accent/30' :
                  ticket.status === 'in_progress' ? 'bg-primary/10 border-primary/30' :
                  ticket.status === 'resolved' ? 'bg-green-100 border-green-300' :
                  'bg-muted border-border'
                } border rounded-lg px-4 py-2.5 text-center`}>
                  <span className={`font-semibold text-sm uppercase tracking-wide ${
                    ticket.status === 'open' ? 'text-accent' :
                    ticket.status === 'in_progress' ? 'text-primary' :
                    ticket.status === 'resolved' ? 'text-green-700' :
                    'text-muted-foreground'
                  }`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Priority */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Priority</p>
                <div className={`${
                  ticket.priority === 'urgent' ? 'bg-accent text-white' :
                  ticket.priority === 'high' ? 'bg-accent/70 text-white' :
                  ticket.priority === 'normal' ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground'
                } rounded-lg px-4 py-2.5 text-center`}>
                  <span className="font-semibold text-sm uppercase tracking-wide">
                    {ticket.priority}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Client Organization */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Client
                </p>
                <p className="font-semibold text-sm">
                  {(ticket as any).organization?.name || 'Unknown'}
                </p>
              </div>

              <Separator />

              {/* Location */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location
                </p>
                <Link 
                  href={`/locations/${ticket.location.id}`}
                  className="text-accent hover:underline font-medium text-sm block"
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  Hardware
                </p>
                <Link 
                  href={`/hardware/${ticket.hardware.id}`}
                  className="text-accent hover:underline font-medium text-sm block"
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
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

              <Separator />

              {/* Assignment */}
              {canManage && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Assign Ticket</p>
                  <AssignmentDropdown
                    ticketId={id}
                    currentAssignedId={ticket.assigned_to}
                    orgMembers={members as any}
                    currentUserId={currentUser?.id || ''}
                  />
                </div>
              )}

              {!canManage && ticket.assigned_to_profile && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Assigned To</p>
                  <p className="font-semibold text-sm">
                    {ticket.assigned_to_profile.first_name} {ticket.assigned_to_profile.last_name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-primary">
            <CardHeader className="bg-primary">
              <CardTitle className="text-base flex items-center gap-2 text-primary-foreground">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-6">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 text-xs">
                <span className="text-muted-foreground font-medium">Created</span>
                <span className="font-semibold">{formatDateTime(ticket.created_at)}</span>
              </div>
              {ticket.first_response_at && (
                <div className="flex items-center justify-between p-3 rounded-md bg-primary/5 text-xs">
                  <span className="text-muted-foreground font-medium">First Response</span>
                  <span className="font-semibold">{formatDateTime(ticket.first_response_at)}</span>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex items-center justify-between p-3 rounded-md bg-green-50 text-xs">
                  <span className="text-muted-foreground font-medium">Resolved</span>
                  <span className="font-semibold">{formatDateTime(ticket.resolved_at)}</span>
                </div>
              )}
              {ticket.closed_at && (
                <div className="flex items-center justify-between p-3 rounded-md bg-muted text-xs">
                  <span className="text-muted-foreground font-medium">Closed</span>
                  <span className="font-semibold">{formatDateTime(ticket.closed_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          {ticket.timing_analytics && (ticket.timing_analytics.time_to_first_response_ms || ticket.timing_analytics.time_to_resolve_ms) && (
            <Card className="border-primary">
              <CardHeader className="bg-primary">
                <CardTitle className="text-base flex items-center gap-2 text-primary-foreground">
                  <Clock className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {ticket.timing_analytics.time_to_first_response_ms && (
                  <div className="text-center p-4 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">First Response</p>
                    <p className="text-2xl font-bold text-accent">
                      {formatDuration(ticket.timing_analytics.time_to_first_response_ms)}
                    </p>
                  </div>
                )}
                {ticket.timing_analytics.time_to_resolve_ms && (
                  <div className="text-center p-4 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Time to Resolve</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatDuration(ticket.timing_analytics.time_to_resolve_ms)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div>
        <Link href="/tickets">
          <Button variant="outline" size="sm" className="h-9">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </Link>
      </div>
    </div>
  )
}
