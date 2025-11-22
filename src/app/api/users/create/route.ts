import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    // Create user using the SQL function
    const { data: newUserId, error: userError } = await supabase.rpc('create_user_with_password', {
      user_email: email,
      user_password: tempPassword,
      user_metadata: {
        first_name,
        last_name
      }
    })

    if (userError || !newUserId) {
      console.error('❌ Failed to create auth user:', userError)
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    console.log('✅ Auth user created:', newUserId)

    // Update profile (it's auto-created by trigger, so we UPDATE instead of INSERT)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name,
        last_name,
      })
      .eq('id', newUserId)

    if (profileError) {
      console.error('❌ Failed to update profile:', profileError)
    } else {
      console.log('✅ Profile updated with name')
    }

    // Create org membership
    const { error: membershipError } = await supabase
      .from('org_memberships')
      .insert({
        user_id: newUserId,
        org_id,
        role,
      })

    if (membershipError) {
      console.error('❌ Failed to create org membership:', membershipError)
      return NextResponse.json({ error: 'Failed to add user to organization' }, { status: 500 })
    }

    console.log('✅ Org membership created')

    // Create location assignments if provided
    if (location_ids && location_ids.length > 0) {
      const assignments = location_ids.map((location_id: string) => ({
        user_id: newUserId,
        location_id,
      }))

      const { error: assignmentError } = await supabase
        .from('location_assignments')
        .insert(assignments)

      if (assignmentError) {
        console.error('❌ Failed to create location assignments:', assignmentError)
      } else {
        console.log('✅ Location assignments created:', location_ids.length)
      }
    }

    // Get org name for email
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', org_id)
      .single()

    // Send welcome email with credentials
    try {
      await sendEmail({
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

      console.log('✅ Welcome email sent to:', email)
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError)
      // Don't fail the user creation if email fails
    }

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      message: `User ${email} created successfully. Welcome email sent with temporary password.`
    })
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

