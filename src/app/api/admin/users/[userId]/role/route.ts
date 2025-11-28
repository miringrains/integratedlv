import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'

/**
 * Update a user's role in an organization
 * PUT /api/admin/users/[userId]/role
 * Body: { org_id: string, role: 'org_admin' | 'employee' }
 * 
 * Only accessible to platform admins
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Check if user is platform admin
    const isPlatformAdminUser = await isPlatformAdmin()
    if (!isPlatformAdminUser) {
      return NextResponse.json({ error: 'Forbidden - Platform admin only' }, { status: 403 })
    }

    const { userId } = await context.params
    const { org_id, role } = await request.json()

    if (!org_id || !role) {
      return NextResponse.json({ error: 'org_id and role are required' }, { status: 400 })
    }

    if (!['org_admin', 'employee'].includes(role)) {
      return NextResponse.json({ error: 'Role must be org_admin or employee' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient()

    // Update the org membership role
    const { error } = await supabase
      .from('org_memberships')
      .update({ role })
      .eq('user_id', userId)
      .eq('org_id', org_id)

    if (error) {
      console.error('Failed to update role:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `User role updated to ${role}` 
    })
  } catch (error: any) {
    console.error('Role update error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

