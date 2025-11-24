import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPlatformAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')

    // Check if platform admin
    const isPlatformAdminUser = await isPlatformAdmin()
    
    let query = supabase
      .from('contacts')
      .select(`
        *,
        location:locations(id, name)
      `)
      .order('name')

    // Filter by org if not platform admin
    if (!isPlatformAdminUser) {
      // Get user's org_id
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .in('role', ['org_admin', 'platform_admin'])
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      query = query.eq('org_id', membership.org_id)
    } else if (orgId) {
      // Platform admin can filter by org
      query = query.eq('org_id', orgId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Contacts fetch error:', error)
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
    const { org_id, name, email, phone, role, location_id } = body

    // Validate required fields
    if (!org_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 })
    }

    // Check permissions
    const isPlatformAdminUser = await isPlatformAdmin()
    
    if (!isPlatformAdminUser) {
      // Check if user is org admin for this org
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('org_id', org_id)
        .in('role', ['org_admin', 'platform_admin'])
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'You do not have permission to create contacts for this organization' }, { status: 403 })
      }
    }

    // Create contact
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        org_id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        role: role?.trim() || null,
        location_id: location_id || null,
      })
      .select(`
        *,
        location:locations(id, name)
      `)
      .single()

    if (error) {
      console.error('Contact creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Contact creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

