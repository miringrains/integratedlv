import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, org_id, role, first_name, last_name } = body

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    
    // Set expiration (7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        email,
        org_id,
        role,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // TODO: Send email with invitation link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`

    return NextResponse.json({
      ...invitation,
      invite_link: inviteLink,
    })
  } catch (error) {
    console.error('Invitation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


