import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: hardwareId } = await context.params

    const { data, error } = await supabase
      .from('hardware_sops')
      .select(`
        sop_id,
        sops (*)
      `)
      .eq('hardware_id', hardwareId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const sops = data?.map((item: any) => item.sops).filter(Boolean) || []
    return NextResponse.json(sops)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





