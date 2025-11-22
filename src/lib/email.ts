import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('Mailgun not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    // Create Mailgun transporter
    const transporter = nodemailer.createTransporter({
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
        pass: process.env.MAILGUN_API_KEY,
      },
    })

    const info = await transporter.sendMail({
      from: process.env.MAILGUN_FROM_EMAIL || `Integrated LV <support@${process.env.MAILGUN_DOMAIN}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html,
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Email Templates
export const emailTemplates = {
  ticketCreated: (ticketNumber: string, title: string, clientName: string, locationName: string) => ({
    subject: `New Ticket: ${ticketNumber} - ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3A443E; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Integrated LV</h1>
        </div>
        <div style="padding: 30px; background: #f4f7f5;">
          <h2 style="color: #3A443E; margin-top: 0;">New Support Ticket Created</h2>
          <p style="font-size: 16px; color: #1a1d1b;">A new support ticket has been submitted:</p>
          
          <div style="background: white; border-left: 4px solid #FF6F12; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Ticket #:</strong> ${ticketNumber}</p>
            <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${title}</p>
            <p style="margin: 0 0 10px 0;"><strong>Client:</strong> ${clientName}</p>
            <p style="margin: 0;"><strong>Location:</strong> ${locationName}</p>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketNumber}" 
               style="background: #FF6F12; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Ticket
            </a>
          </p>
        </div>
        <div style="background: #e8ebe9; padding: 15px; text-align: center; font-size: 12px; color: #6b716f;">
          <p style="margin: 0;">© 2025 Integrated LV. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  ticketAssigned: (ticketNumber: string, title: string, assigneeName: string) => ({
    subject: `Ticket Assigned: ${ticketNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3A443E; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Integrated LV</h1>
        </div>
        <div style="padding: 30px; background: #f4f7f5;">
          <h2 style="color: #3A443E; margin-top: 0;">Ticket Assigned to You</h2>
          <p style="font-size: 16px; color: #1a1d1b;">You have been assigned to a support ticket:</p>
          
          <div style="background: white; border-left: 4px solid #3A443E; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Ticket #:</strong> ${ticketNumber}</p>
            <p style="margin: 0;"><strong>Subject:</strong> ${title}</p>
          </div>
          
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketNumber}" 
               style="background: #3A443E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Ticket
            </a>
          </p>
        </div>
        <div style="background: #e8ebe9; padding: 15px; text-align: center; font-size: 12px; color: #6b716f;">
          <p style="margin: 0;">© 2025 Integrated LV. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  invitationEmail: (inviterName: string, orgName: string, inviteLink: string) => ({
    subject: `You've been invited to ${orgName} on Integrated LV`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3A443E; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Integrated LV</h1>
        </div>
        <div style="padding: 30px; background: #f4f7f5;">
          <h2 style="color: #3A443E; margin-top: 0;">You've Been Invited!</h2>
          <p style="font-size: 16px; color: #1a1d1b;">${inviterName} has invited you to join <strong>${orgName}</strong> on the Integrated LV portal.</p>
          
          <p style="margin-top: 30px;">
            <a href="${inviteLink}" 
               style="background: #FF6F12; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          
          <p style="font-size: 14px; color: #6b716f; margin-top: 30px;">
            This invitation will expire in 7 days.
          </p>
        </div>
        <div style="background: #e8ebe9; padding: 15px; text-align: center; font-size: 12px; color: #6b716f;">
          <p style="margin: 0;">© 2025 Integrated LV. All rights reserved.</p>
        </div>
      </div>
    `,
  }),
}

