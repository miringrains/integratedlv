import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'

export async function GET(
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

    // Get contact
    const { data: contact, error } = await supabase
      .from('contacts')
      .select(`
        *,
        location:locations(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Check permissions
    const isPlatformAdminUser = await isPlatformAdmin()
    
    if (!isPlatformAdminUser) {
      // Check if user is org admin for this contact's org
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('org_id', contact.org_id)
        .in('role', ['org_admin', 'platform_admin'])
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Contact fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Get current contact to check permissions
    const { data: contact } = await supabase
      .from('contacts')
      .select('org_id')
      .eq('id', id)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Check permissions
    const isPlatformAdminUser = await isPlatformAdmin()
    
    if (!isPlatformAdminUser) {
      // Check if user is org admin for this contact's org
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('org_id', contact.org_id)
        .in('role', ['org_admin', 'platform_admin'])
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'You do not have permission to edit this contact' }, { status: 403 })
      }
    }

    // Prepare updates
    const updates: any = {}
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.email !== undefined) updates.email = body.email?.trim() || null
    if (body.phone !== undefined) updates.phone = body.phone?.trim() || null
    if (body.role !== undefined) updates.role = body.role?.trim() || null
    if (body.location_id !== undefined) updates.location_id = body.location_id || null

    // Validate name if provided
    if (updates.name && !updates.name.trim()) {
      return NextResponse.json({ error: 'Contact name cannot be empty' }, { status: 400 })
    }

    // Update contact
    const { data: updatedContact, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        location:locations(id, name)
      `)
      .single()

    if (error) {
      console.error('Contact update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Contact update error:', error)
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

    const { id } = await context.params

    // Get current contact to check permissions
    const { data: contact } = await supabase
      .from('contacts')
      .select('org_id')
      .eq('id', id)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Check permissions
    const isPlatformAdminUser = await isPlatformAdmin()
    
    if (!isPlatformAdminUser) {
      // Check if user is org admin for this contact's org
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('org_id', contact.org_id)
        .in('role', ['org_admin', 'platform_admin'])
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'You do not have permission to delete this contact' }, { status: 403 })
      }
    }

    // Delete contact
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Contact deletion error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

