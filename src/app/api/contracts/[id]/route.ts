import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/admin'

/**
 * Update a contract
 * PUT /api/contracts/[id]
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    // Get contract to check org_id
    const { data: contract } = await supabase
      .from('contracts')
      .select('org_id')
      .eq('id', id)
      .single()

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Check permissions
    const profile = await getCurrentUserProfile()
    const isAdmin = profile?.is_platform_admin || false

    if (!isAdmin) {
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('role')
        .eq('org_id', contract.org_id)
        .eq('user_id', user.id)
        .single()

      if (!membership || membership.role !== 'org_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const adminSupabase = createServiceRoleClient()

    const { data, error } = await adminSupabase
      .from('contracts')
      .update({
        name: body.name,
        description: body.description || null,
        start_date: body.start_date,
        end_date: body.end_date || null,
        contract_value: body.contract_value || null,
        terms: body.terms || null,
        status: body.status || 'active'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Contract update error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * Delete a contract
 * DELETE /api/contracts/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Get contract to check org_id
    const { data: contract } = await supabase
      .from('contracts')
      .select('org_id')
      .eq('id', id)
      .single()

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Check permissions - only platform admins can delete
    const profile = await getCurrentUserProfile()
    const isAdmin = profile?.is_platform_admin || false

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only platform admins can delete contracts' }, { status: 403 })
    }

    const adminSupabase = createServiceRoleClient()

    const { error } = await adminSupabase
      .from('contracts')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Contract deletion error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
