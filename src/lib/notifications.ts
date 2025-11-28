import { createServiceRoleClient } from './supabase/server'

export type NotificationType = 
  | 'ticket_assigned'
  | 'ticket_comment'
  | 'ticket_status_changed'
  | 'ticket_created'
  | 'ticket_priority_changed'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  ticketId?: string
  relatedUserId?: string
  metadata?: Record<string, any>
}

/**
 * Create a notification for a user
 * Uses service role client to bypass RLS
 */
export async function createNotification(params: CreateNotificationParams): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        ticket_id: params.ticketId || null,
        related_user_id: params.relatedUserId || null,
        metadata: params.metadata || {},
        is_read: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create notification:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Create notification for ticket assignment
 */
export async function notifyTicketAssigned(
  userId: string,
  ticketId: string,
  ticketNumber: string,
  ticketTitle: string,
  assignedByName: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'ticket_assigned',
    title: `Ticket Assigned: ${ticketNumber}`,
    message: `${assignedByName} assigned ticket "${ticketTitle}" to you`,
    ticketId,
  })
}

/**
 * Create notification for ticket comment
 */
export async function notifyTicketComment(
  userId: string,
  ticketId: string,
  ticketNumber: string,
  ticketTitle: string,
  commenterName: string,
  commentPreview: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'ticket_comment',
    title: `New Comment: ${ticketNumber}`,
    message: `${commenterName} commented on "${ticketTitle}": ${commentPreview.substring(0, 100)}${commentPreview.length > 100 ? '...' : ''}`,
    ticketId,
  })
}

/**
 * Create notification for ticket status change
 */
export async function notifyTicketStatusChanged(
  userId: string,
  ticketId: string,
  ticketNumber: string,
  ticketTitle: string,
  oldStatus: string,
  newStatus: string,
  changedByName: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'ticket_status_changed',
    title: `Status Updated: ${ticketNumber}`,
    message: `${changedByName} changed status from ${oldStatus} to ${newStatus} for "${ticketTitle}"`,
    ticketId,
    metadata: { oldStatus, newStatus },
  })
}

/**
 * Create notification for ticket priority change
 */
export async function notifyTicketPriorityChanged(
  userId: string,
  ticketId: string,
  ticketNumber: string,
  ticketTitle: string,
  oldPriority: string,
  newPriority: string,
  changedByName: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'ticket_priority_changed',
    title: `Priority Updated: ${ticketNumber}`,
    message: `${changedByName} changed priority from ${oldPriority} to ${newPriority} for "${ticketTitle}"`,
    ticketId,
    metadata: { oldPriority, newPriority },
  })
}

