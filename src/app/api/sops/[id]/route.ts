import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { hardware_ids, ...sopData } = body
    
    // Update SOP
    const { data: sop, error } = await supabase
      .from('sops')
      .update(sopData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update hardware associations if provided
    if (hardware_ids) {
      // Remove old associations
      await supabase
        .from('hardware_sops')
        .delete()
        .eq('sop_id', id)

      // Add new associations
      if (hardware_ids.length > 0) {
        const associations = hardware_ids.map((hw_id: string) => ({
          sop_id: id,
          hardware_id: hw_id,
        }))

        await supabase
          .from('hardware_sops')
          .insert(associations)
      }
    }

    return NextResponse.json(sop)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    
    const { error } = await supabase
      .from('sops')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

