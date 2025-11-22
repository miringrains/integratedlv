import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
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

    const body = await request.json()
    
    // Validate required fields
    if (!body.org_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    if (!body.name) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 })
    }

    // Check if user is platform admin or org admin for this org
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    // If not platform admin, verify org membership
    if (!profile?.is_platform_admin) {
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('org_id', body.org_id)
        .in('role', ['org_admin', 'platform_admin'])
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'You do not have permission to create locations for this organization' }, { status: 403 })
      }
    }
    
    const { data, error } = await supabase
      .from('locations')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Location creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Location creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

