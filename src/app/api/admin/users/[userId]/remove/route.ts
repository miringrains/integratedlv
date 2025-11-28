import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Remove a user from an organization
 * DELETE /api/admin/users/[userId]/remove
 * Body: { org_id: string }
 * 
 * Accessible to platform admins and org admins (for their own org)
 */
export async function DELETE(
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
    const { org_id } = await request.json()

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    // Check if user is platform admin or org admin for this org
    const isPlatformAdminUser = await isPlatformAdmin()
    
    if (!isPlatformAdminUser) {
      // For org admins, verify they're managing a user in their org
      const { data: targetMembership } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', userId)
        .eq('org_id', org_id)
        .single()

      if (!targetMembership) {
        return NextResponse.json({ error: 'User not found in this organization' }, { status: 404 })
      }

      const { data: adminMembership } = await supabase
        .from('org_memberships')
        .select('org_id, role')
        .eq('user_id', user.id)
        .eq('org_id', org_id)
        .in('role', ['org_admin'])
        .single()

      if (!adminMembership) {
        return NextResponse.json({ error: 'Forbidden - You can only remove users from your organization' }, { status: 403 })
      }
    }

    // Use service role client to bypass RLS
    const adminSupabase = createServiceRoleClient()

    // Remove the org membership
    const { error } = await adminSupabase
      .from('org_memberships')
      .delete()
      .eq('user_id', userId)
      .eq('org_id', org_id)

    if (error) {
      console.error('Failed to remove user from organization:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User removed from organization successfully' 
    })
  } catch (error: any) {
    console.error('Remove user error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

