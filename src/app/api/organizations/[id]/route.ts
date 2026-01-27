import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/admin'

/**
 * Get organization details
 * GET /api/organizations/[id]
 */
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

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Organization fetch error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * Update organization
 * PUT /api/organizations/[id]
 */
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

    // Check permissions - platform admin or org admin can update
    const profile = await getCurrentUserProfile()
    const isPlatformAdmin = profile?.is_platform_admin || false

    if (!isPlatformAdmin) {
      // Check if org admin for this org
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('org_id', id)
        .eq('user_id', user.id)
        .single()

      if (!membership || membership.role !== 'org_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    // Use service role client to bypass RLS for update
    const adminSupabase = createServiceRoleClient()

    const updateData: any = {
      name: body.name,
      updated_at: new Date().toISOString(),
    }

    // Only platform admins can update these fields
    if (isPlatformAdmin) {
      if (body.business_address !== undefined) updateData.business_address = body.business_address || null
      if (body.business_city !== undefined) updateData.business_city = body.business_city || null
      if (body.business_state !== undefined) updateData.business_state = body.business_state || null
      if (body.business_zip !== undefined) updateData.business_zip = body.business_zip || null
      if (body.business_country !== undefined) updateData.business_country = body.business_country || 'USA'
      if (body.business_hours !== undefined) updateData.business_hours = body.business_hours || {}
      if (body.account_service_manager_id !== undefined) updateData.account_service_manager_id = body.account_service_manager_id || null
      
      // SLA settings
      if (body.sla_response_time_normal !== undefined) updateData.sla_response_time_normal = body.sla_response_time_normal
      if (body.sla_response_time_high !== undefined) updateData.sla_response_time_high = body.sla_response_time_high
      if (body.sla_response_time_urgent !== undefined) updateData.sla_response_time_urgent = body.sla_response_time_urgent
      if (body.sla_resolution_time_normal !== undefined) updateData.sla_resolution_time_normal = body.sla_resolution_time_normal
      if (body.sla_resolution_time_high !== undefined) updateData.sla_resolution_time_high = body.sla_resolution_time_high
      if (body.sla_resolution_time_urgent !== undefined) updateData.sla_resolution_time_urgent = body.sla_resolution_time_urgent
    }

    const { data, error } = await adminSupabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Organization update error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * Delete organization (platform admin only)
 * DELETE /api/organizations/[id]
 */
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

    // Only platform admins can delete organizations
    const profile = await getCurrentUserProfile()
    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: 'Only platform admins can delete organizations' }, { status: 403 })
    }

    const { id } = await context.params
    const adminSupabase = createServiceRoleClient()

    const { error } = await adminSupabase
      .from('organizations')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Organization deletion error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
