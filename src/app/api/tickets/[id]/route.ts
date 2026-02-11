import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    
    // Get current ticket to check permissions
    const { data: ticket } = await supabase
      .from('care_log_tickets')
      .select('org_id')
      .eq('id', id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check if user is platform admin or org admin for this ticket's org
    const isPlatformAdminUser = await isPlatformAdmin()
    
    if (!isPlatformAdminUser) {
      // Check if user is org admin for this ticket's organization
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('org_id', ticket.org_id)
        .in('role', ['org_admin', 'platform_admin'])
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'You do not have permission to edit this ticket' }, { status: 403 })
      }
    }

    // Only allow editing title, description, and priority (not status, assigned_to, etc.)
    const allowedUpdates: any = {}
    if (body.title !== undefined) allowedUpdates.title = body.title
    if (body.description !== undefined) allowedUpdates.description = body.description
    if (body.priority !== undefined) allowedUpdates.priority = body.priority

    // Use service role for platform admins to bypass RLS, regular client for org admins
    const updateClient = isPlatformAdminUser ? createServiceRoleClient() : supabase
    const { data: updatedTicket, error } = await updateClient
      .from('care_log_tickets')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create event for audit trail - use service role to bypass RLS for platform admins
    const adminSupabase = createServiceRoleClient()
    const { error: eventError } = await adminSupabase
      .from('ticket_events')
      .insert({
        ticket_id: id,
        user_id: user.id,
        event_type: 'updated',
        comment: 'Ticket details updated',
      })

    if (eventError) {
      console.error('Failed to create update event:', eventError)
    }

    return NextResponse.json(updatedTicket)
  } catch (error) {
    console.error('Ticket update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only platform admins can delete tickets
    const isPlatformAdminUser = await isPlatformAdmin()
    if (!isPlatformAdminUser) {
      return NextResponse.json({ 
        error: 'Forbidden - Only platform admins can delete tickets' 
      }, { status: 403 })
    }

    const { id } = await context.params
    
    // Use service role to bypass RLS - no DELETE policy exists for care_log_tickets
    const deleteClient = createServiceRoleClient()
    const { error } = await deleteClient
      .from('care_log_tickets')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ticket deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

