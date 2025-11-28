import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin endpoint to reset a user's password
 * POST /api/admin/reset-password
 * Body: { userId: string, newPassword: string, org_id?: string }
 * 
 * Accessible to platform admins and org admins (for users in their own org)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, newPassword, org_id } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'userId and newPassword are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Check if user is platform admin or org admin for this user's org
    const isPlatformAdminUser = await isPlatformAdmin()
    
    if (!isPlatformAdminUser) {
      // For org admins, verify they're resetting password for a user in their org
      if (!org_id) {
        return NextResponse.json({ error: 'org_id is required for org admins' }, { status: 400 })
      }

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
        return NextResponse.json({ error: 'Forbidden - You can only reset passwords for users in your organization' }, { status: 403 })
      }
    }

    // Use service role client to update password via Admin API
    const adminSupabase = createServiceRoleClient()

    // Update password using Admin API (userId is already provided)
    const { data, error } = await adminSupabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully' 
    })
  } catch (error: any) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

