# Integrated LV Portal - Complete System Architecture

**Last Updated:** November 22, 2025  
**Production URL:** https://client.integratedlowvoltage.com  
**Version:** 1.0 (Production Ready)

## 🏗️ System Overview

A production-ready multi-tenant support portal for low-voltage infrastructure management. Built with Next.js 15, Supabase, and TypeScript. Deployed on Vercel with custom domain.

## 👥 User Roles & Permissions

### Platform Admins (Integrated LV Staff)
**Examples:** Kevin, Ralph  
**Email Domain:** @integratedlowvoltage.com  
**Database:** `is_platform_admin = true`, NO org memberships

**Can:**
- ✅ View ALL tickets, locations, hardware across ALL clients
- ✅ Create organizations and org admins
- ✅ Assign tickets (only to other platform admins)
- ✅ Change ticket status (Start Working, Mark Resolved, Close)
- ✅ Create and manage SOPs (knowledge base)
- ✅ Leave internal notes on tickets
- ✅ Manage all client resources
- ✅ Access analytics and system-wide data

**Cannot:**
- ❌ Create locations/hardware for clients (org admins do this)

### Org Admins (Client Administrators)
**Examples:** Anna (Breakthruweb), Acme Admin  
**Database:** `org_memberships.role = 'org_admin'`

**Can:**
- ✅ View their organization's tickets, locations, hardware
- ✅ Create and manage locations for their organization
- ✅ Create and manage hardware for their organization
- ✅ Invite employees to their organization
- ✅ Assign employees to specific locations
- ✅ Create support tickets
- ✅ Reply to tickets (public only, no internal notes)
- ✅ Upload photos to tickets and replies
- ✅ Manage team members (My Team page)

**Cannot:**
- ❌ View other organizations' data
- ❌ Assign tickets
- ❌ Change ticket status
- ❌ Leave internal notes
- ❌ Create/edit SOPs
- ❌ View platform admin tools

### Employees
**Database:** `org_memberships.role = 'employee'`

**Can:**
- ✅ View locations assigned to them
- ✅ View hardware at their assigned locations
- ✅ Create support tickets for their assigned locations
- ✅ Reply to tickets
- ✅ Upload photos
- ✅ View SOPs

**Cannot:**
- ❌ View locations they're not assigned to
- ❌ Create/manage locations or hardware
- ❌ Invite users
- ❌ View team management
- ❌ Assign tickets or change status

## 📊 Database Architecture

### Core Tables

**organizations**
- Stores client companies
- Has `avatar_url` and `icon_color` for branding
- "Integrated LV" org exists but filtered from client lists

**profiles**
- Synced with auth.users (auto-created by trigger)
- `is_platform_admin` boolean flag
- RLS: DISABLED (prevents recursion, security at app level)

**org_memberships**
- Links users to organizations with roles
- Roles: `platform_admin`, `org_admin`, `employee`
- Platform admins have NO memberships (system-wide access)
- RLS: DISABLED

**locations**
- Physical sites/stores
- Belongs to an organization
- Has lat/long for maps
- RLS: Platform admins see all, org members see their org only

**hardware**
- Equipment/devices at locations
- Linked to organization and location
- RLS: Platform admins see all, org members see their org only

**care_log_tickets**
- Support tickets
- Auto-generated ticket numbers (TKT-YYYYMMDD-NNNNNN)
- Statuses: open, in_progress, resolved, closed, cancelled
- Priorities: low, normal, high, urgent
- RLS: Platform admins see all, org members see their org only
- RLS UPDATE: Platform admins can update all, org admins can update their org's

**ticket_attachments**
- Photos attached to tickets or replies
- `comment_id = NULL`: Initial ticket photos
- `comment_id = UUID`: Reply-specific photos
- Stored in public `ticket-attachments` bucket
- RLS: Platform admins see all, org members see their org's

**ticket_comments**
- Replies to tickets
- `is_internal`: Only visible to platform admins
- `is_public`: Visible to all (default)
- RLS: DISABLED (access controlled by ticket RLS)

**ticket_events**
- Audit trail of all ticket actions
- Types: created, status_changed, assigned, comment_added, attachment_added

**ticket_timing_analytics**
- Auto-calculated performance metrics
- Time to first response, time to resolve

**sops** (Standard Operating Procedures)
- Troubleshooting guides
- Only platform admins can create/edit
- All users can view

**location_assignments**
- Links employees to specific locations
- Employees can only create tickets for assigned locations

## 🎨 Design System

### Colors
- **Primary (Military Green):** `#3A443E`
- **Accent (Orange):** `#FF6F12`
- **Grays:** Warm tones (not blue)

### Typography
- **Headings:** `h1` (text-2xl), `h2` (text-lg), `h3` (text-base)
- **Body:** text-sm
- **Labels:** text-xs, uppercase, tracking-wider
- **Monospace:** Ticket numbers, serial numbers only

### Components
- **Table headers:** Military green background, white text
- **Cards:** Border-primary for main content
- **Buttons:** Accent orange for CTAs, primary green for secondary
- **Badges:** Consistent sizing and colors

## 📧 Email System (Mailgun)

### Configuration
- **Domain:** portal.integratedlowvoltage.com
- **From:** support@portal.integratedlowvoltage.com
- **Templates:** Dark mode compatible, mobile responsive

### Email Triggers

**New Ticket Created:**
- **To Platform Admins:** "New Support Ticket" (action required)
- **To Submitter:** "Ticket Submitted Successfully" (confirmation)
- **NOT to Org Admins** (they're clients, not support staff)

**Ticket Assigned:**
- **To Assigned Platform Admin:** "Ticket Assigned to You"

**Status Changed:**
- **To Submitter:** Status update notification
- **To Assigned Platform Admin:** Status update notification

**Reply Added (Public Only):**
- **To Submitter:** (if someone else replied)
- **To Assigned Platform Admin:** (if someone else replied)
- **NOT to Commenter:** (don't notify yourself)

**Internal Replies:**
- NO emails sent (internal notes don't notify anyone)

## 🔐 Security Model

### RLS (Row Level Security)

**ENABLED:**
- `care_log_tickets`: Platform admins see all, org members see their org only
- `locations`: Platform admins see all, org members see their org only
- `hardware`: Platform admins see all, org members see their org only
- `ticket_attachments`: Platform admins see all, org members see their org's
- `sops`: All can view, RLS prevents data leaks

**DISABLED (App-Level Security):**
- `profiles`: Prevents infinite recursion, auth checks in API routes
- `org_memberships`: Platform admins need to see all orgs
- `ticket_comments`: Access controlled by ticket RLS
- `storage.objects`: Public bucket, URLs are unguessable GUIDs

### Storage

**Buckets:**
- `user-avatars`: PUBLIC (profile pictures)
- `ticket-attachments`: PUBLIC (photos in tickets/replies)
  - URLs contain random GUIDs (effectively secure)
  - Table-level RLS controls who can SEE which attachments exist
  - Once you have a URL, anyone can view (but URLs are secret)

### Authentication
- Managed by Supabase Auth
- Password hashing: bcrypt
- Account creation: Direct SQL insertion (reliable, no magic links)
- Password changes: Supabase `auth.updateUser()` (works for logged-in users)

## 🚀 User Onboarding Flow

### Platform Admin Creates Organization
1. Platform admin fills form (org name, admin details)
2. SQL function creates auth user with temp password
3. Profile auto-created by trigger, updated with name
4. Org membership created with role 'org_admin'
5. Welcome email sent with login credentials
6. Org admin logs in immediately, changes password

### Org Admin Invites Employee
1. Org admin clicks "Invite User" in My Team
2. Fills form (name, email, locations to assign)
3. Same SQL flow as above
4. Employee added to `location_assignments`
5. Welcome email sent
6. Employee logs in, changes password

## 📱 Navigation Structure

### Platform Admins
- **Command Center:** Overview, Ticket Queue
- **Client Management:** Clients
- **Global Resources:** Global Inventory, Site Registry
- **System:** Support, SOP Library, Settings

### Org Admins
- **Overview:** Dashboard
- **Assets:** Locations, Hardware
- **Support:** Support Hub, Tickets
- **Team:** Team Members, Settings

### Employees
- **Overview:** Dashboard
- **Assets:** Locations (assigned only), Hardware (at assigned locations)
- **Support:** Support Hub, Tickets
- **Account:** Settings

## 🛠️ Key Features

### Ticketing System
- Auto-numbered tickets (TKT-YYYYMMDD-NNNNNN)
- Priority levels with visual indicators
- Status workflow tracking
- Photo attachments (initial ticket + replies)
- Public and internal replies
- Performance metrics (response time, resolution time)
- Email notifications to relevant parties
- Assignment to platform admins only

### Asset Management
- Location tracking with maps (Mapbox)
- Hardware inventory with serial numbers
- Manager contact information
- Location-based access control for employees

### Support Resources
- SOP library (platform admin managed)
- Account representative contact information
- Support Hub with quick actions

### User Management
- Direct account creation (no unreliable magic links)
- Email credentials delivery
- Location assignment for employees
- Role-based access control

## 🔧 Environment Variables

**Required in Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL=https://tzlkmyqemdpmmrmwesuy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
SUPABASE_SERVICE_ROLE_KEY=[service role key]
NEXT_PUBLIC_APP_URL=https://client.integratedlowvoltage.com
NEXT_PUBLIC_MAPBOX_API_KEY=[mapbox key]
MAILGUN_SMTP_PASSWORD=[SMTP password from Mailgun]
MAILGUN_DOMAIN=portal.integratedlowvoltage.com
MAILGUN_FROM_EMAIL=support@portal.integratedlowvoltage.com
```

## 📈 Current Status

**Production Ready Features:**
- ✅ Multi-tenant architecture
- ✅ Role-based access control
- ✅ Complete ticketing system
- ✅ Photo attachments (tickets + replies)
- ✅ Email notifications (Mailgun)
- ✅ User management for org admins
- ✅ Location-based employee access
- ✅ Asset tracking
- ✅ SOP library
- ✅ Dark mode compatible emails
- ✅ Mobile responsive UI
- ✅ Custom domain support

**Known Working Accounts:**
- kevin@breakthruweb.com (Platform Admin) - Password: [original]
- ralph@integratedlowvoltage.com (Platform Admin) - Password: IntegratedLV2025!
- anna@breakthruweb.com (Org Admin - Breakthruweb) - Password: IntegratedLV2025!
- info@breakthruweb.com (Org Admin - Acme Inc) - Password: IntegratedLV2025_test123

## 🎯 Design Principles

1. **Enterprise-Grade:** Professional, data-dense interfaces with tables
2. **Brand Consistent:** Military green + orange throughout
3. **Mobile Responsive:** Works on all devices
4. **Performance Focused:** Efficient queries, minimal re-renders
5. **Security First:** Proper RLS, table-level access control
6. **User-Friendly:** Clear labeling, helpful empty states
7. **Reliable:** Direct account creation, no magic links

## 🔄 Data Flow Examples

### Ticket Creation Flow
```
User → Creates ticket with photos
  ↓
Server API (uploadFileServer) → Uploads to public bucket (bypasses RLS)
  ↓
Database → Saves ticket + attachments records
  ↓
Email System → Sends to platform admins (notification) + submitter (confirmation)
  ↓
Platform Admin → Receives email, views ticket, assigns to self
  ↓
Email System → Sends assignment email to platform admin
  ↓
Platform Admin → Replies with photo
  ↓
Email System → Notifies submitter of reply
```

### User Invitation Flow
```
Org Admin → Clicks "Invite User"
  ↓
Fills form → Email, name, locations
  ↓
API → Calls SQL function create_user_with_password()
  ↓
SQL → Creates auth.user with hashed temp password
  ↓
Trigger → Auto-creates profile
  ↓
API → Updates profile with name, creates org_membership, location_assignments
  ↓
Email → Sends welcome email with credentials
  ↓
Employee → Receives email, logs in, changes password
```

## 🎨 UI Highlights

- Military green table headers across all management pages
- 5-column photo grid for ticket attachments
- Inline images in replies
- Grouped navigation for all user types
- Clean, professional notifications with white hover
- Support Hub with account rep contact info
- Branded emails with logo

## 🚨 Important Notes

- **Integrated LV org** exists in database but is filtered from client lists (it's the provider, not a client)
- **Platform admins** have NO org memberships (system-wide access)
- **Storage bucket** is PUBLIC with table-level RLS for security (URLs are secret GUIDs)
- **Profiles RLS** is DISABLED to prevent infinite recursion
- **Email sending** uses Mailgun SMTP (not Supabase, which is unreliable)
- **Account creation** uses direct SQL (no magic links)

## 📞 Support Contact

**Integrated LV Support Team**  
Phone: (702) 555-1234  
Email: support@integratedlowvoltage.com  
Hours: Monday-Friday, 8 AM - 6 PM PST

---

**Built with ❤️ for Integrated LV by the development team**

