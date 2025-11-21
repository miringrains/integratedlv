import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This is a one-time admin route - should be deleted after use
export async function POST(request: NextRequest) {
  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await request.json()
    const { email, password, firstName, lastName, orgId, role } = body

    // Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
      })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Add org membership
    const { error: membershipError } = await supabaseAdmin
      .from('org_memberships')
      .insert({
        user_id: authData.user.id,
        org_id: orgId,
        role: role || 'org_admin',
      })

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      message: `User ${email} created successfully with password: ${password}`
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

