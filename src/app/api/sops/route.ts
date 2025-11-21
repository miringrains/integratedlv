import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { hardware_ids, ...sopData } = body
    
    // Create SOP
    const { data: sop, error } = await supabase
      .from('sops')
      .insert({
        ...sopData,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Associate with hardware
    if (hardware_ids && hardware_ids.length > 0) {
      const associations = hardware_ids.map((hw_id: string) => ({
        sop_id: sop.id,
        hardware_id: hw_id,
      }))

      await supabase
        .from('hardware_sops')
        .insert(associations)
    }

    return NextResponse.json(sop)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





