import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify requesting user is a platform admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (!profile?.is_platform_admin) {
      return NextResponse.json({ error: 'Only platform admins can share reports' }, { status: 403 })
    }

    const { recipientEmail, recipientName, orgName, dateRange, reportHtml } = await request.json()

    if (!recipientEmail || !reportHtml) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const senderName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Integrated LV'
    const periodLabel = dateRange === '7' ? 'Weekly' :
                        dateRange === '30' ? 'Monthly' :
                        dateRange === '90' ? 'Quarterly' : 'Annual'

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
          .header { background: #3A443E; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 20px; }
          .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
          .content { border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e5e5; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${periodLabel} Service Report${orgName && orgName !== 'All Organizations' ? ` - ${orgName}` : ''}</h1>
          <p>Prepared by ${senderName} | ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="content">
          ${reportHtml}
        </div>
        <div class="footer">
          <p>This report was generated and shared from Integrated LV Service Platform.</p>
          <p>If you have questions about this report, please reply to this email.</p>
        </div>
      </body>
      </html>
    `

    const result = await sendEmail({
      to: recipientEmail,
      subject: `${periodLabel} Service Report${orgName && orgName !== 'All Organizations' ? ` - ${orgName}` : ''} | Integrated LV`,
      html: emailHtml,
      replyTo: user.email || undefined,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Report sent to ${recipientEmail}` })
  } catch (error) {
    console.error('Share report error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to share report' 
    }, { status: 500 })
  }
}
