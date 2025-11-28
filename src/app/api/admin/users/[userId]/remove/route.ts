import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'

/**
 * Remove a user from an organization
 * DELETE /api/admin/users/[userId]/remove
 * Body: { org_id: string }
 * 
 * Only accessible to platform admins
 */
export async function DELETE(
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
    const { org_id } = await request.json()

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient()

    // Remove the org membership
    const { error } = await supabase
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

