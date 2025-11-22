import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, text, replyTo }: EmailOptions) {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('Mailgun not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    // Create Mailgun transporter
    const transporter = nodemailer.createTransport({
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
      replyTo: replyTo || process.env.MAILGUN_FROM_EMAIL,
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

// Dark mode compatible email wrapper
function emailWrapper(content: string, preheader?: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <style>
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .email-body { background-color: #1a1d1b !important; }
          .email-content { background-color: #2a2d2b !important; }
          .email-card { background-color: #3a3d3b !important; border-color: #4a4d4b !important; }
          .email-text { color: #f4f7f5 !important; }
          .email-muted { color: #9ca09e !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f7f5;" class="email-body">
      ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f7f5;" class="email-body">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">
              ${content}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// Email Templates
export const emailTemplates = {
  ticketCreated: (
    ticketNumber: string, 
    ticketId: string,
    title: string, 
    description: string,
    clientName: string, 
    locationName: string,
    submitterName: string,
    priority: string
  ) => {
    const priorityColor = priority === 'urgent' ? '#FF6F12' : '#3A443E'
    const priorityBg = priority === 'urgent' ? '#fff5f0' : '#f4f7f5'
    
    return {
      subject: `[${ticketNumber}] New Ticket: ${title}`,
      html: emailWrapper(`
        <!-- Header -->
        <tr>
          <td style="background-color: #3A443E; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">INTEGRATED LV</h1>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="background-color: #ffffff; padding: 32px;" class="email-content">
            <!-- Priority Badge -->
            ${priority === 'urgent' ? `
              <div style="background-color: ${priorityBg}; border-left: 4px solid ${priorityColor}; padding: 12px 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: ${priorityColor}; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">⚠️ URGENT TICKET</p>
              </div>
            ` : ''}
            
            <h2 style="color: #1a1d1b; margin: 0 0 8px 0; font-size: 20px; font-weight: bold;" class="email-text">New Support Ticket</h2>
            <p style="color: #6b716f; margin: 0 0 24px 0; font-size: 14px;" class="email-muted">A new ticket has been submitted and requires attention.</p>
            
            <!-- Ticket Info Card -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f7f5; border: 1px solid #e8ebe9; border-radius: 8px; margin-bottom: 24px;" class="email-card">
              <tr>
                <td style="padding: 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="padding-bottom: 12px;">
                        <p style="margin: 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Ticket Number</p>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #1a1d1b; font-family: 'Courier New', monospace; font-weight: bold;" class="email-text">${ticketNumber}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 12px;">
                        <p style="margin: 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Subject</p>
                        <p style="margin: 4px 0 0 0; font-size: 15px; color: #1a1d1b; font-weight: 600;" class="email-text">${title}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 12px;">
                        <p style="margin: 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Description</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #1a1d1b; line-height: 1.5;" class="email-text">${description.substring(0, 200)}${description.length > 200 ? '...' : ''}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 12px;">
                        <p style="margin: 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Client</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #1a1d1b; font-weight: 600;" class="email-text">${clientName}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 12px;">
                        <p style="margin: 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Location</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #1a1d1b;" class="email-text">${locationName}</p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p style="margin: 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Submitted By</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #1a1d1b;" class="email-text">${submitterName}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding: 8px 0 24px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketId}" 
                     style="background-color: #FF6F12; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                    View Ticket
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #e8ebe9; padding: 20px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b716f;">© 2025 Integrated LV. All rights reserved.</p>
            <p style="margin: 0; font-size: 11px; color: #9ca09e;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b716f; text-decoration: underline;">Notification Settings</a>
            </p>
          </td>
        </tr>
      `, `New ticket ${ticketNumber}: ${title}`),
    }
  },

  ticketStatusChanged: (
    ticketNumber: string,
    ticketId: string,
    title: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string,
    clientName: string
  ) => {
    const statusColor = newStatus === 'resolved' ? '#10b981' : newStatus === 'in_progress' ? '#3A443E' : '#FF6F12'
    
    return {
      subject: `[${ticketNumber}] Status Update: ${newStatus.replace('_', ' ').toUpperCase()}`,
      html: emailWrapper(`
        <!-- Header -->
        <tr>
          <td style="background-color: #3A443E; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">INTEGRATED LV</h1>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="background-color: #ffffff; padding: 32px;" class="email-content">
            <h2 style="color: #1a1d1b; margin: 0 0 8px 0; font-size: 20px; font-weight: bold;" class="email-text">Ticket Status Updated</h2>
            <p style="color: #6b716f; margin: 0 0 24px 0; font-size: 14px;" class="email-muted">${changedBy} updated the status of your ticket.</p>
            
            <!-- Status Change Card -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f7f5; border: 1px solid #e8ebe9; border-radius: 8px; margin-bottom: 24px;" class="email-card">
              <tr>
                <td style="padding: 20px;">
                  <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Ticket</p>
                  <p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1d1b; font-family: 'Courier New', monospace; font-weight: bold;" class="email-text">${ticketNumber}</p>
                  <p style="margin: 0 0 16px 0; font-size: 15px; color: #1a1d1b; font-weight: 600;" class="email-text">${title}</p>
                  
                  <!-- Status Change -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 16px 0;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="background-color: #d1d5d3; color: #1a1d1b; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                              ${oldStatus.replace('_', ' ')}
                            </td>
                            <td style="padding: 0 12px; color: #6b716f; font-size: 18px;">→</td>
                            <td style="background-color: ${statusColor}; color: #ffffff; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                              ${newStatus.replace('_', ' ')}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding: 8px 0 24px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketId}" 
                     style="background-color: #3A443E; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                    View Ticket
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #e8ebe9; padding: 20px; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b716f;">© 2025 Integrated LV. All rights reserved.</p>
            <p style="margin: 0; font-size: 11px; color: #9ca09e;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b716f; text-decoration: underline;">Notification Settings</a>
            </p>
          </td>
        </tr>
      `, `Ticket ${ticketNumber} status changed to ${newStatus}`),
    }
  },

  ticketAssigned: (
    ticketNumber: string,
    ticketId: string,
    title: string,
    assigneeName: string,
    clientName: string,
    locationName: string,
    priority: string
  ) => ({
    subject: `[${ticketNumber}] Ticket Assigned to You`,
    html: emailWrapper(`
      <!-- Header -->
      <tr>
        <td style="background-color: #3A443E; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">INTEGRATED LV</h1>
        </td>
      </tr>
      
      <!-- Content -->
      <tr>
        <td style="background-color: #ffffff; padding: 32px;" class="email-content">
          ${priority === 'urgent' ? `
            <div style="background-color: #fff5f0; border-left: 4px solid #FF6F12; padding: 12px 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #FF6F12; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">⚠️ URGENT TICKET</p>
            </div>
          ` : ''}
          
          <h2 style="color: #1a1d1b; margin: 0 0 8px 0; font-size: 20px; font-weight: bold;" class="email-text">Ticket Assigned to You</h2>
          <p style="color: #6b716f; margin: 0 0 24px 0; font-size: 14px;" class="email-muted">Hi ${assigneeName}, you've been assigned to a support ticket.</p>
          
          <!-- Ticket Info Card -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f7f5; border: 1px solid #e8ebe9; border-radius: 8px; margin-bottom: 24px;" class="email-card">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Ticket Number</p>
                <p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1d1b; font-family: 'Courier New', monospace; font-weight: bold;" class="email-text">${ticketNumber}</p>
                
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Subject</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1a1d1b; font-weight: 600;" class="email-text">${title}</p>
                
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Client / Location</p>
                <p style="margin: 0; font-size: 14px; color: #1a1d1b;" class="email-text">${clientName} • ${locationName}</p>
              </td>
            </tr>
          </table>
          
          <!-- CTA Button -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding: 8px 0 24px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketId}" 
                   style="background-color: #FF6F12; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  View & Respond
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Footer -->
      <tr>
        <td style="background-color: #e8ebe9; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b716f;">© 2025 Integrated LV. All rights reserved.</p>
          <p style="margin: 0; font-size: 11px; color: #9ca09e;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b716f; text-decoration: underline;">Notification Settings</a>
          </p>
        </td>
      </tr>
    `, `You've been assigned to ticket ${ticketNumber}`),
  }),

  ticketCommentAdded: (
    ticketNumber: string,
    ticketId: string,
    title: string,
    commenterName: string,
    commentText: string,
    isInternal: boolean
  ) => ({
    subject: `[${ticketNumber}] New ${isInternal ? 'Internal Note' : 'Comment'} from ${commenterName}`,
    html: emailWrapper(`
      <!-- Header -->
      <tr>
        <td style="background-color: #3A443E; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">INTEGRATED LV</h1>
        </td>
      </tr>
      
      <!-- Content -->
      <tr>
        <td style="background-color: #ffffff; padding: 32px;" class="email-content">
          <h2 style="color: #1a1d1b; margin: 0 0 8px 0; font-size: 20px; font-weight: bold;" class="email-text">New ${isInternal ? 'Internal Note' : 'Comment'}</h2>
          <p style="color: #6b716f; margin: 0 0 24px 0; font-size: 14px;" class="email-muted">${commenterName} added a ${isInternal ? 'note' : 'comment'} to ticket ${ticketNumber}.</p>
          
          <!-- Comment Card -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f7f5; border: 1px solid #e8ebe9; border-radius: 8px; margin-bottom: 24px;" class="email-card">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Ticket</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1a1d1b; font-weight: 600;" class="email-text">${title}</p>
                
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">${isInternal ? 'Internal Note' : 'Comment'}</p>
                <p style="margin: 0; font-size: 14px; color: #1a1d1b; line-height: 1.6; white-space: pre-wrap;" class="email-text">${commentText}</p>
              </td>
            </tr>
          </table>
          
          <!-- CTA Button -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding: 8px 0 24px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketId}" 
                   style="background-color: #3A443E; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  View Conversation
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Footer -->
      <tr>
        <td style="background-color: #e8ebe9; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b716f;">© 2025 Integrated LV. All rights reserved.</p>
          <p style="margin: 0; font-size: 11px; color: #9ca09e;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b716f; text-decoration: underline;">Notification Settings</a>
          </p>
        </td>
      </tr>
    `, `New comment on ticket ${ticketNumber}`),
  }),

  ticketResolved: (
    ticketNumber: string,
    ticketId: string,
    title: string,
    clientName: string,
    resolutionTime: string
  ) => ({
    subject: `[${ticketNumber}] Ticket Resolved`,
    html: emailWrapper(`
      <!-- Header -->
      <tr>
        <td style="background-color: #3A443E; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">INTEGRATED LV</h1>
        </td>
      </tr>
      
      <!-- Content -->
      <tr>
        <td style="background-color: #ffffff; padding: 32px;" class="email-content">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #10b981; color: white; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 24px; margin-bottom: 16px;">✓</div>
            <h2 style="color: #1a1d1b; margin: 0 0 8px 0; font-size: 20px; font-weight: bold;" class="email-text">Ticket Resolved</h2>
            <p style="color: #6b716f; margin: 0; font-size: 14px;" class="email-muted">Your support ticket has been resolved.</p>
          </div>
          
          <!-- Ticket Info Card -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f7f5; border: 1px solid #e8ebe9; border-radius: 8px; margin-bottom: 24px;" class="email-card">
            <tr>
              <td style="padding: 20px;">
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Ticket Number</p>
                <p style="margin: 0 0 16px 0; font-size: 13px; color: #1a1d1b; font-family: 'Courier New', monospace; font-weight: bold;" class="email-text">${ticketNumber}</p>
                
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Subject</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #1a1d1b; font-weight: 600;" class="email-text">${title}</p>
                
                <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b716f; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;" class="email-muted">Resolution Time</p>
                <p style="margin: 0; font-size: 14px; color: #10b981; font-weight: 600;">${resolutionTime}</p>
              </td>
            </tr>
          </table>
          
          <!-- CTA Button -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center" style="padding: 8px 0 24px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketId}" 
                   style="background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  View Resolution
                </a>
              </td>
            </tr>
          </table>
          
          <p style="font-size: 13px; color: #6b716f; text-align: center; margin: 0;" class="email-muted">
            If you have any questions, please don't hesitate to reach out.
          </p>
        </td>
      </tr>
      
      <!-- Footer -->
      <tr>
        <td style="background-color: #e8ebe9; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b716f;">© 2025 Integrated LV. All rights reserved.</p>
          <p style="margin: 0; font-size: 11px; color: #9ca09e;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #6b716f; text-decoration: underline;">Notification Settings</a>
          </p>
        </td>
      </tr>
    `, `Ticket ${ticketNumber} has been resolved`),
  }),
}
