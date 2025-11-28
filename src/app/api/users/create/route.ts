import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, first_name, last_name, role, org_id, location_ids } = body

    console.log('👤 Creating user:', email, 'for org:', org_id)

    // Generate secure temporary password
    const tempPassword = `IntegratedLV2025_${randomBytes(6).toString('hex')}`

    // Validate required fields
    if (!email || !first_name || !last_name || !org_id || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, first_name, last_name, org_id, and role are required' 
      }, { status: 400 })
    }

    // Use service role client for Admin API (bypasses RLS)
    const adminSupabase = createServiceRoleClient()

    // Create user using Supabase Admin API (recommended approach)
    // This handles password hashing automatically and doesn't require pgcrypto
    const { data: authData, error: userError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: {
        first_name,
        last_name
      }
    })

    if (userError) {
      console.error('❌ Failed to create auth user:', userError)
      return NextResponse.json({ 
        error: `Failed to create user account: ${userError.message || 'Unknown error'}` 
      }, { status: 500 })
    }

    if (!authData?.user?.id) {
      console.error('❌ No user ID returned from createUser')
      return NextResponse.json({ 
        error: 'Failed to create user account: No user ID returned' 
      }, { status: 500 })
    }

    const newUserId = authData.user.id
    console.log('✅ Auth user created:', newUserId)

    // Update profile (it's auto-created by trigger, so we UPDATE instead of INSERT)
    // Use service role client to bypass RLS for profile update
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({
        first_name,
        last_name,
      })
      .eq('id', newUserId)

    if (profileError) {
      console.error('❌ Failed to update profile:', profileError)
      // Don't fail - profile might not exist yet, trigger will create it
    } else {
      console.log('✅ Profile updated with name')
    }

    // Create org membership using service role client (bypasses RLS)
    const { error: membershipError } = await adminSupabase
      .from('org_memberships')
      .insert({
        user_id: newUserId,
        org_id,
        role,
      })

    if (membershipError) {
      console.error('❌ Failed to create org membership:', membershipError)
      return NextResponse.json({ 
        error: `Failed to add user to organization: ${membershipError.message}` 
      }, { status: 500 })
    }

    console.log('✅ Org membership created')

    // Create location assignments if provided (using service role client)
    if (location_ids && location_ids.length > 0) {
      const assignments = location_ids.map((location_id: string) => ({
        user_id: newUserId,
        location_id,
      }))

      const { error: assignmentError } = await adminSupabase
        .from('location_assignments')
        .insert(assignments)

      if (assignmentError) {
        console.error('❌ Failed to create location assignments:', assignmentError)
      } else {
        console.log('✅ Location assignments created:', location_ids.length)
      }
    }

    // Get org name for email (using service role client)
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('name')
      .eq('id', org_id)
      .single()

    // Send welcome email with credentials
    try {
      const emailResult = await sendEmail({
        to: email,
        ...emailTemplates.welcomeEmail(
          first_name,
          last_name,
          email,
          tempPassword,
          org?.name || 'Your Organization',
          role === 'org_admin' ? 'Organization Administrator' : 'Employee'
        ),
      })

      if (emailResult.success) {
        console.log('✅ Welcome email sent to:', email, 'Message ID:', emailResult.messageId)
      } else {
        console.error('❌ Failed to send welcome email:', emailResult.error)
        // Log but don't fail - user can still login with temp password
      }
    } catch (emailError) {
      console.error('❌ Exception sending welcome email:', emailError)
      // Don't fail the user creation if email fails - user can still login
    }

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      message: `User ${email} created successfully. Welcome email sent with temporary password.`
    })
  } catch (error) {
    console.error('User creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ 
      error: `Failed to create user: ${errorMessage}` 
    }, { status: 500 })
  }
}

