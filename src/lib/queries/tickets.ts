import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { CareLogTicket, TicketWithRelations } from '@/types/database'

export async function getTickets(filters?: {
  status?: string
  locationId?: string
  hardwareId?: string
  priority?: string
  assignedTo?: string
  search?: string
}): Promise<CareLogTicket[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('care_log_tickets')
    .select('*')

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.locationId) {
    query = query.eq('location_id', filters.locationId)
  }

  if (filters?.hardwareId) {
    query = query.eq('hardware_id', filters.hardwareId)
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority)
  }

  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,ticket_number.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getTicketById(id: string): Promise<TicketWithRelations | null> {
  // Use service role to bypass RLS for joined tables (ticket_events has no platform admin SELECT policy)
  // This ensures platform admins see events, attachments, and all related data
  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('care_log_tickets')
    .select(`
      *,
      location:locations (*),
      hardware:hardware (*),
      organization:organizations (*),
      submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey (*),
      assigned_to_profile:profiles!care_log_tickets_assigned_to_fkey (*),
      events:ticket_events (*),
      attachments:ticket_attachments (*),
      timing_analytics:ticket_timing_analytics (*)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as any
}

export async function createTicket(ticket: {
  org_id: string
  location_id: string
  hardware_id: string
  submitted_by: string
  title: string
  description: string
  priority?: string
  sop_acknowledged: boolean
  acknowledged_sop_ids: string[]
}) {
  // Use service role to bypass RLS - platform admins have no org_memberships
  // so INSERT policies on care_log_tickets and ticket_events block them
  const supabase = createServiceRoleClient()
  
  // Create ticket
  const { data: newTicket, error } = await supabase
    .from('care_log_tickets')
    .insert({
      ...ticket,
      status: 'open',
      sop_acknowledged_at: ticket.sop_acknowledged ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) throw error

  // Create initial event
  await supabase
    .from('ticket_events')
    .insert({
      ticket_id: newTicket.id,
      user_id: ticket.submitted_by,
      event_type: 'created',
      new_value: 'open',
    })

  return newTicket
}

export async function updateTicketStatus(
  ticketId: string,
  userId: string,
  newStatus: string,
  comment?: string
) {
  const supabase = await createClient()

  // Get current ticket
  const { data: ticket } = await supabase
    .from('care_log_tickets')
    .select('status')
    .eq('id', ticketId)
    .single()

  if (!ticket) throw new Error('Ticket not found')

  const oldStatus = ticket.status

  // Prepare updates
  const updates: any = { status: newStatus }
  
  // Update timing fields based on status
  if (newStatus === 'in_progress' && oldStatus === 'open') {
    updates.first_response_at = new Date().toISOString()
  }
  
  if (newStatus === 'resolved') {
    updates.resolved_at = new Date().toISOString()
  }
  
  if (newStatus === 'closed') {
    updates.closed_at = new Date().toISOString()
  }

  // Update ticket
  const { data, error } = await supabase
    .from('care_log_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single()

  if (error) throw error

  // Create event - use service role to bypass RLS for platform admins
  const adminSupabase = createServiceRoleClient()
  await adminSupabase
    .from('ticket_events')
    .insert({
      ticket_id: ticketId,
      user_id: userId,
      event_type: 'status_changed',
      old_value: oldStatus,
      new_value: newStatus,
      comment: comment || null,
    })

  return data
}

export async function addTicketComment(
  ticketId: string,
  userId: string,
  comment: string,
  isInternal: boolean = false
) {
  const supabase = await createClient()

  // Add comment (ticket_comments has RLS disabled, so user client works)
  const { data: newComment, error: commentError } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      user_id: userId,
      comment,
      is_internal: isInternal,
      is_public: !isInternal,
    })
    .select()
    .single()

  if (commentError) throw commentError

  // Create event - use service role to bypass RLS for platform admins
  const adminSupabase = createServiceRoleClient()
  await adminSupabase
    .from('ticket_events')
    .insert({
      ticket_id: ticketId,
      user_id: userId,
      event_type: 'comment_added',
      comment: isInternal ? '[Internal Note]' : comment,
      metadata: { is_internal: isInternal },
    })

  return newComment
}

export async function getTicketComments(ticketId: string) {
  const supabase = await createClient()
  
  // Check if user is platform admin
  const { isPlatformAdmin } = await import('@/lib/auth')
  const isPlatformAdminUser = await isPlatformAdmin()
  
  // Get comments - filter out internal comments for non-platform admins
  let query = supabase
    .from('ticket_comments')
    .select(`
      *,
      user:profiles (*)
    `)
    .eq('ticket_id', ticketId)

  // HARD MANDATORY: Only platform admins can see internal comments
  if (!isPlatformAdminUser) {
    query = query.eq('is_internal', false)
  }

  const { data: comments, error } = await query.order('created_at', { ascending: true })

  if (error) throw error
  
  // Manually fetch attachments for each comment (reverse FK)
  const commentsWithAttachments = await Promise.all(
    (comments || []).map(async (comment) => {
      const { data: attachments } = await supabase
        .from('ticket_attachments')
        .select('id, file_name, file_url, file_type, file_size')
        .eq('comment_id', comment.id)
        .order('created_at', { ascending: true })
      
      return {
        ...comment,
        attachments: attachments || []
      }
    })
  )
  
  return commentsWithAttachments
}

export async function assignTicket(
  ticketId: string,
  assignedTo: string,
  assignedBy: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('care_log_tickets')
    .update({ assigned_to: assignedTo })
    .eq('id', ticketId)
    .select()
    .single()

  if (error) throw error

  // Create event - use service role to bypass RLS for platform admins
  const adminSupabase = createServiceRoleClient()
  await adminSupabase
    .from('ticket_events')
    .insert({
      ticket_id: ticketId,
      user_id: assignedBy,
      event_type: 'assigned',
      new_value: assignedTo,
    })

  return data
}





