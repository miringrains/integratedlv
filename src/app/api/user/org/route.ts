import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if platform admin first
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    // Platform admins don't have org memberships
    if (profile?.is_platform_admin) {
      return NextResponse.json({ 
        org_id: null,
        is_platform_admin: true,
        role: 'platform_admin'
      })
    }

    const { data: memberships } = await supabase
      .from('org_memberships')
      .select('org_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!memberships) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    return NextResponse.json({ 
      org_id: memberships.org_id,
      role: memberships.role,
      is_platform_admin: false
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





