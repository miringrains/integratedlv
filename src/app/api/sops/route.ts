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
    
    // Validate required fields
    if (!sopData.title || !sopData.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!sopData.content || !sopData.content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (!sopData.org_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Check if user is platform admin (only platform admins can create SOPs)
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: 'Only platform administrators can create SOPs' }, { status: 403 })
    }
    
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
      console.error('SOP creation error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create SOP' }, { status: 500 })
    }

    if (!sop) {
      return NextResponse.json({ error: 'Failed to create SOP - no data returned' }, { status: 500 })
    }

    // Associate with hardware
    if (hardware_ids && Array.isArray(hardware_ids) && hardware_ids.length > 0) {
      const associations = hardware_ids.map((hw_id: string) => ({
        sop_id: sop.id,
        hardware_id: hw_id,
      }))

      const { error: assocError } = await supabase
        .from('hardware_sops')
        .insert(associations)

      if (assocError) {
        console.error('Failed to associate hardware with SOP:', assocError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json(sop)
  } catch (error) {
    console.error('SOP POST error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}





