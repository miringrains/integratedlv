import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify requesting user is a super_admin
    const { data: requestingProfile } = await supabase
      .from('profiles')
      .select('is_platform_admin, admin_level')
      .eq('id', user.id)
      .single()

    if (!requestingProfile?.is_platform_admin || requestingProfile.admin_level !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can add platform administrators' }, { status: 403 })
    }

    const body = await request.json()
    const { email, first_name, last_name, admin_level } = body

    if (!email || !first_name || !last_name || !admin_level) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, first_name, last_name, and admin_level are required' 
      }, { status: 400 })
    }

    if (!['super_admin', 'technician', 'read_only'].includes(admin_level)) {
      return NextResponse.json({ error: 'Invalid admin level' }, { status: 400 })
    }

    // Generate secure temporary password
    const tempPassword = `IntegratedLV2025_${randomBytes(6).toString('hex')}`

    const adminSupabase = createServiceRoleClient()

    // Create auth user
    const { data: authData, error: userError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name, last_name }
    })

    if (userError) {
      console.error('Failed to create auth user:', userError)
      return NextResponse.json({ 
        error: `Failed to create user: ${userError.message}` 
      }, { status: 500 })
    }

    if (!authData?.user?.id) {
      return NextResponse.json({ error: 'No user ID returned' }, { status: 500 })
    }

    const newUserId = authData.user.id

    // Update profile to set platform admin flags
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        first_name,
        last_name,
        is_platform_admin: true,
        admin_level,
      })
      .eq('id', newUserId)

    if (profileError) {
      console.error('Failed to update profile:', profileError)
      return NextResponse.json({ 
        error: `Failed to set admin status: ${profileError.message}` 
      }, { status: 500 })
    }

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        ...emailTemplates.welcomeEmail(
          first_name,
          last_name,
          email,
          tempPassword,
          'Integrated LV',
          admin_level === 'super_admin' ? 'Super Administrator' :
          admin_level === 'technician' ? 'Technician' : 'Read Only'
        ),
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
    }

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      message: `Platform admin ${email} created successfully.`
    })
  } catch (error) {
    console.error('Platform admin creation error:', error)
    return NextResponse.json({ 
      error: `Failed to create admin: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
