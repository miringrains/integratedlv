import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if platform admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all organizations
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(orgs || [])
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if platform admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, admin_email, admin_first_name, admin_last_name } = body

    // Create organization
    const { data: org, error } = await supabase
      .from('organizations')
      .insert({ name })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If admin details provided, create the org admin account
    if (admin_email && admin_first_name && admin_last_name) {
      try {
        // Generate secure temporary password
        const tempPassword = `IntegratedLV2025_${randomBytes(4).toString('hex')}`

        console.log('🔐 Creating org admin account for:', admin_email)

        // Create auth user directly in database
        const { data: authUser, error: authError } = await supabase.rpc('create_user_with_password', {
          user_email: admin_email,
          user_password: tempPassword,
          user_metadata: {
            first_name: admin_first_name,
            last_name: admin_last_name
          }
        })

        if (authError) {
          console.error('❌ Failed to create auth user:', authError)
          throw authError // Stop here if user creation fails
        }
        
        if (!authUser) {
          throw new Error('No user ID returned from create_user_with_password')
        }

        console.log('✅ Auth user created:', authUser)

        // Update profile (auto-created by trigger)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: admin_first_name,
            last_name: admin_last_name,
          })
          .eq('id', authUser)

        if (profileError) {
          console.error('❌ Failed to update profile:', profileError)
        }

        // Create org membership
        const { error: membershipError } = await supabase
          .from('org_memberships')
          .insert({
            user_id: authUser,
            org_id: org.id,
            role: 'org_admin',
          })

        if (membershipError) {
          console.error('❌ Failed to create org membership:', membershipError)
          throw membershipError
        }

        console.log('✅ Profile and org membership created')

        // Send welcome email with credentials
        try {
          const emailResult = await sendEmail({
          to: admin_email,
          ...emailTemplates.welcomeEmail(
            admin_first_name,
            admin_last_name,
            admin_email,
            tempPassword,
            name,
            'Organization Administrator'
          ),
        })

          if (emailResult.success) {
            console.log('✅ Welcome email sent to:', admin_email, 'Message ID:', emailResult.messageId)
          } else {
            console.error('❌ Failed to send welcome email:', emailResult.error)
            // Log but don't fail - user can still login with temp password
          }
        } catch (emailError) {
          console.error('❌ Exception sending welcome email:', emailError)
          // Don't fail the org creation if email fails
        }
      } catch (userCreationError) {
        console.error('Error creating org admin:', userCreationError)
        // Don't fail the org creation if user creation fails
      }
    }

    return NextResponse.json(org)
  } catch (error) {
    console.error('Organization creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
