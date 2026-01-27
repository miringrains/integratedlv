import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin, getCurrentUserProfile } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/admin'

/**
 * Get departments for an organization
 * GET /api/departments?orgId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
    }

    // Check permissions
    const profile = await getCurrentUserProfile()
    const isAdmin = profile?.is_platform_admin || false

    if (!isAdmin) {
      // Check if user is org admin for this org
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single()

      if (!membership || membership.role !== 'org_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        manager:profiles!departments_manager_id_fkey(id, first_name, last_name, email)
      `)
      .eq('org_id', orgId)
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Departments fetch error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * Create a new department
 * POST /api/departments
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { org_id, name, description, manager_id } = body

    if (!org_id || !name) {
      return NextResponse.json({ error: 'org_id and name are required' }, { status: 400 })
    }

    // Check permissions
    const profile = await getCurrentUserProfile()
    const isAdmin = profile?.is_platform_admin || false

    if (!isAdmin) {
      // Check if user is org admin for this org
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('org_id', org_id)
        .eq('user_id', user.id)
        .single()

      if (!membership || membership.role !== 'org_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const adminSupabase = createServiceRoleClient()

    const { data, error } = await adminSupabase
      .from('departments')
      .insert({
        org_id,
        name,
        description: description || null,
        manager_id: manager_id || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Department creation error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
