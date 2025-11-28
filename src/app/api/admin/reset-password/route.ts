import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'

/**
 * Admin endpoint to reset a user's password
 * POST /api/admin/reset-password
 * Body: { userId: string, newPassword: string }
 * 
 * Only accessible to platform admins
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is platform admin
    const isPlatformAdminUser = await isPlatformAdmin()
    if (!isPlatformAdminUser) {
      return NextResponse.json({ error: 'Forbidden - Platform admin only' }, { status: 403 })
    }

    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'userId and newPassword are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Use service role client to update password via Admin API
    const supabase = createServiceRoleClient()

    // Update password using Admin API (userId is already provided)
    const { data, error } = await supabase.auth.admin.updateUserById(
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

