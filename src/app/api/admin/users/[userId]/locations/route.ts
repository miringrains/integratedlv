import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Get or update a user's location assignments
 * GET /api/admin/users/[userId]/locations - Get current assignments
 * PUT /api/admin/users/[userId]/locations - Update assignments
 * Body: { org_id: string, location_ids: string[] }
 * 
 * Accessible to platform admins and org admins (for their own org)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await context.params

    // Check if user is platform admin or org admin
    const isPlatformAdminUser = await isPlatformAdmin()
    
    if (!isPlatformAdminUser) {
      // For org admins, verify they're managing a user in their org
      const { data: targetMembership } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', userId)
        .single()

      if (!targetMembership) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const { data: adminMembership } = await supabase
        .from('org_memberships')
        .select('org_id, role')
        .eq('user_id', user.id)
        .eq('org_id', targetMembership.org_id)
        .in('role', ['org_admin'])
        .single()

      if (!adminMembership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get current location assignments
    const { data: assignments, error } = await supabase
      .from('location_assignments')
      .select('location_id')
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      location_ids: assignments?.map(a => a.location_id) || [] 
    })
  } catch (error: any) {
    console.error('Get locations error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await context.params
    const { org_id, location_ids } = await request.json()

    if (!org_id || !Array.isArray(location_ids)) {
      return NextResponse.json({ error: 'org_id and location_ids array are required' }, { status: 400 })
    }

    // Check if user is platform admin or org admin for this org
    const isPlatformAdminUser = await isPlatformAdmin()
    
    if (!isPlatformAdminUser) {
      const { data: adminMembership } = await supabase
        .from('org_memberships')
        .select('org_id, role')
        .eq('user_id', user.id)
        .eq('org_id', org_id)
        .in('role', ['org_admin'])
        .single()

      if (!adminMembership) {
        return NextResponse.json({ error: 'Forbidden - You can only manage users in your organization' }, { status: 403 })
      }
    }

    // Verify all locations belong to the org
    if (location_ids.length > 0) {
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id')
        .eq('org_id', org_id)
        .in('id', location_ids)

      if (locationsError) {
        return NextResponse.json({ error: locationsError.message }, { status: 500 })
      }

      if (locations.length !== location_ids.length) {
        return NextResponse.json({ error: 'Some locations do not belong to this organization' }, { status: 400 })
      }
    }

    // Use service role client to bypass RLS
    const adminSupabase = createServiceRoleClient()

    // Get current assignments
    const { data: currentAssignments } = await adminSupabase
      .from('location_assignments')
      .select('location_id')
      .eq('user_id', userId)

    const currentLocationIds = currentAssignments?.map(a => a.location_id) || []
    
    // Find locations to add and remove
    const toAdd = location_ids.filter(id => !currentLocationIds.includes(id))
    const toRemove = currentLocationIds.filter(id => !location_ids.includes(id))

    // Remove old assignments
    if (toRemove.length > 0) {
      const { error: deleteError } = await adminSupabase
        .from('location_assignments')
        .delete()
        .eq('user_id', userId)
        .in('location_id', toRemove)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
    }

    // Add new assignments
    if (toAdd.length > 0) {
      const newAssignments = toAdd.map(location_id => ({
        user_id: userId,
        location_id,
      }))

      const { error: insertError } = await adminSupabase
        .from('location_assignments')
        .insert(newAssignments)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Location assignments updated successfully' 
    })
  } catch (error: any) {
    console.error('Update locations error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

