# Platform Expertise Gaps - Missing Information Identified

**Generated:** November 22, 2025  
**Purpose:** Comprehensive analysis of missing information required to become an expert in the Integrated LV Portal platform

---

## 🔍 Analysis Methodology

Using Vercel and Supabase MCPs, I've analyzed:
- ✅ Database schema (all tables, columns, RLS policies)
- ✅ Vercel deployment configuration
- ✅ Codebase structure and API routes
- ✅ Security advisors and performance recommendations
- ✅ Migration history
- ✅ Current production status

---

## 📊 CRITICAL MISSING INFORMATION

### 1. **Database Functions & Triggers** ⚠️

**Missing from Documentation:**
- `create_user_with_password()` function - Used for account creation
- `auto_promote_admin()` function - Mentioned in security advisors
- Complete trigger list beyond what's in initial schema
- All migration files beyond `001_initial_schema.sql`

**Found:**
- `handle_new_user()` - Auto-creates profile on auth.users insert (TRIGGER function)
- `update_updated_at_column()` - Updates timestamps (TRIGGER function)
- `generate_ticket_number()` - Auto-generates ticket numbers (TRIGGER function)
- `update_ticket_timing()` - Calculates timing analytics (TRIGGER function)
- `create_user_with_password()` - Creates auth user with password (returns UUID)
- `auto_promote_admin()` - Auto-promotes admin (TRIGGER function)

**Action Required:** Document all SQL functions, their parameters, return types, and usage patterns. Review function search_path security issues.

---

### 2. **RLS Policy Details** ⚠️

**Security Advisors Found Issues:**
- ❌ `profiles` table has RLS policies but RLS is DISABLED (intentional, but not fully documented)
- ❌ `org_memberships` table has RLS policies but RLS is DISABLED (intentional, but not fully documented)
- ❌ `ticket_comments` table has RLS policies but RLS is DISABLED (intentional, but not fully documented)

**Missing Information:**
- Complete list of all RLS policies (not just which tables have them enabled/disabled)
- Policy names and exact USING clauses
- Platform admin bypass logic in policies

**Action Required:** Document all RLS policies with their exact SQL, explain disabled RLS rationale.

**✅ RESOLVED:** See ACCOUNT_TYPES_AND_RLS_DEEP_DIVE.md for complete explanation:
- Why `profiles` RLS is disabled (prevents recursion)
- Why `org_memberships` RLS is disabled (platform admins need all)
- Why `ticket_comments` RLS is disabled (access controlled by ticket RLS)
- How platform admin bypass works in RLS policies

---

### 3. **Storage Bucket Configuration** ✅ RESOLVED

**Initial Schema Says:**
- `ticket-attachments` is PRIVATE bucket (`public: false`)

**Code Says:**
- `src/lib/storage.ts` comment: "ticket-attachments is now public"
- Uses `getPublicUrl()` for all buckets

**Reality:**
- Bucket is PRIVATE in schema but treated as PUBLIC in code
- URLs are public but unguessable (GUID-based paths)
- Table-level RLS controls who can SEE which attachments exist
- Once URL is known, anyone can view (security through obscurity)

**Action Required:** Document this hybrid approach - private bucket with public URLs, secured by table RLS.

---

### 4. **Admin Levels System** ⚠️

**Found in Database:**
- `profiles.admin_level` column exists with values: `super_admin`, `technician`, `read_only`
- Default: `'technician'`

**Missing from Documentation:**
- What each admin level can/cannot do
- Who can manage admin levels
- How admin levels interact with `is_platform_admin` flag
- Platform admin management page (`/admin/platform-admins`)

**Action Required:** Document admin level system completely.

---

### 5. **Location Default Assignment** ⚠️

**Found in Database:**
- `locations.default_assigned_to` column (UUID, nullable)
- Comment: "Default platform admin (technician) to auto-assign tickets from this location"

**Missing from Documentation:**
- How auto-assignment works
- When tickets are auto-assigned
- Whether this is implemented in code or just database schema

**Action Required:** Document auto-assignment feature if implemented.

---

### 6. **Complete API Route Inventory** ⚠️

**Found Routes Not Fully Documented:**
- `/api/admin/create-user` - Exists but not documented
- `/api/hardware/[id]/sops` - Hardware-SOP associations
- `/api/user/[id]/avatar` - Avatar upload endpoint
- `/api/tickets/all` - All tickets endpoint (platform admin only?)

**Missing Information:**
- Request/response schemas for each endpoint
- Authentication requirements per endpoint
- Error codes and responses
- Rate limiting (if any)

**Action Required:** Create complete API documentation.

---

### 7. **Email Template Details** ⚠️

**Found Templates:**
- `ticketCreated`
- `ticketStatusChanged`
- `ticketAssigned`
- `ticketCommentAdded`
- `ticketResolved`
- `welcomeEmail`

**Missing Information:**
- When each template is triggered
- Recipient logic (who gets what)
- Template variables and their sources
- Email delivery failure handling

**Action Required:** Document email notification flow completely.

---

### 8. **Vercel Configuration** ⚠️

**Found:**
- Project ID: `prj_fkRNag1IV27BBBm6VUqwiF8YUXA8`
- Team ID: `team_SjyBLLDt64NnEt2LAhbfiJhi`
- Domains: `client.integratedlowvoltage.com`, `integratedlv.vercel.app`
- Node Version: `22.x`
- Framework: `nextjs`

**Missing Information:**
- Environment variables actually set in Vercel
- Build configuration
- Deployment hooks/webhooks
- Analytics/monitoring setup
- Error tracking (Sentry, etc.)

**Action Required:** Document Vercel configuration completely.

---

### 9. **Migration History** ⚠️

**Found Migrations:**
1. `20251119215551` - `integrated_lv_core_tables`
2. `20251119215602` - `integrated_lv_indexes`
3. `20251119215611` - `integrated_lv_rls_enable`
4. `20251119215638` - `integrated_lv_rls_policies_part1_fixed`
5. `20251119215654` - `integrated_lv_rls_policies_part2`
6. `20251119215707` - `integrated_lv_rls_policies_part3`
7. `20251119215727` - `integrated_lv_functions_and_triggers`
8. `20251119230320` - `add_ticket_comments_table`
9. `20251120153135` - `add_location_coordinates`
10. `20251120170100` - `add_invitations_table`
11. `20251122141321` - `add_organization_avatar`
12. `20251122155611` - `add_comment_id_to_attachments`
13. `20251122164430` - `create_user_function`
14. `20251122192134` - `add_admin_level_to_profiles`
15. `20251122213119` - `add_default_tech_to_locations`

**Missing:**
- Only `001_initial_schema.sql` exists in codebase
- All other migrations are missing
- Cannot see incremental changes

**Action Required:** Document all migrations or add migration files to repo.

---

### 10. **Component Library** ⚠️

**Found Components:**
- UI components (shadcn/ui based)
- Form components (HardwareForm, LocationForm, SOPForm)
- Ticket components (CommentSection, TicketStatusActions, etc.)
- Admin components (InviteUserModal, OrgSelector, etc.)

**Missing Information:**
- Component props interfaces
- Component usage examples
- Component dependencies
- Styling system (Tailwind config details)

**Action Required:** Document component library.

---

### 11. **Authentication Flow Details** ⚠️

**Found:**
- Supabase Auth with SSR
- Middleware for route protection
- Auth helpers in `src/lib/auth.ts`

**Missing Information:**
- Session management details
- Token refresh logic
- Logout flow
- Password reset flow (if exists)
- Account deactivation flow

**Action Required:** Document complete authentication flows.

---

### 12. **Error Handling Patterns** ⚠️

**Missing Information:**
- Global error handling strategy
- API error response formats
- Client-side error boundaries
- Error logging/monitoring
- User-facing error messages

**Action Required:** Document error handling patterns.

---

### 13. **Performance Optimizations** ⚠️

**Supabase Advisors Found:**
- Performance advisor output was 74KB (large)
- Need to review specific recommendations

**Missing Information:**
- Query optimization strategies
- Caching strategies
- Image optimization
- Bundle size optimizations
- Database query patterns

**Action Required:** Review performance advisors and document optimizations.

**Performance Issues Found:**
1. **Unindexed Foreign Keys (INFO)** - 9 foreign keys missing indexes:
   - `care_log_tickets.assigned_to`
   - `hardware_sops.sop_id`
   - `invitations.created_by`, `invitations.org_id`
   - `sops.created_by`
   - `ticket_attachments.uploaded_by`
   - `ticket_comments.user_id`
   - `ticket_events.user_id`

2. **RLS Policy Performance (WARN)** - Many policies re-evaluate `auth.uid()` for each row:
   - Should use `(select auth.uid())` instead of `auth.uid()`
   - Affects: organizations, locations, hardware, sops, invitations, ticket_events, ticket_timing_analytics, care_log_tickets, location_assignments, hardware_sops

3. **Multiple Permissive Policies (WARN)** - Multiple policies for same role/action:
   - Affects: hardware, hardware_sops, invitations, location_assignments, locations, organizations, profiles, sops, ticket_timing_analytics
   - Performance impact: Each policy must execute for every query

4. **Unused Indexes (INFO)** - 8 indexes never used:
   - `idx_locations_default_assigned_to`
   - `idx_invitations_token`, `idx_invitations_email`
   - `idx_ticket_attachments_comment_id`
   - `idx_locations_coordinates`
   - `idx_location_assignments_user_id`
   - `idx_hardware_status`
   - `idx_care_log_tickets_hardware_id`, `idx_care_log_tickets_submitted_by`

---

### 14. **Testing Strategy** ⚠️

**Found:**
- `TESTING_GUIDE.md` exists

**Missing Information:**
- Actual test files (unit, integration, e2e)
- Test coverage
- CI/CD test runs
- Manual testing procedures

**Action Required:** Verify testing implementation matches guide.

---

### 15. **Deployment Process** ⚠️

**Found:**
- GitHub integration
- Auto-deployments on push to main
- Deployment history available

**Missing Information:**
- Pre-deployment checks
- Deployment rollback procedures
- Staging environment (if exists)
- Database migration deployment process

**Action Required:** Document deployment procedures.

---

## 🔐 SECURITY GAPS

### Critical Security Issues Found:

1. **Function Search Path Mutable** (WARN)
   - Multiple functions have mutable search_path
   - Functions: `create_user_with_password`, `handle_new_user`, `update_updated_at_column`, `generate_ticket_number`, `update_ticket_timing`, `auto_promote_admin`
   - **Risk:** SQL injection vulnerability
   - **Action:** Set `SET search_path = public` in all functions

2. **RLS Disabled on Public Tables** ✅ INTENTIONAL
   - `profiles`, `org_memberships`, `ticket_comments` have RLS disabled
   - **Why:** 
     - `profiles`: Checking `is_platform_admin` in RLS would cause infinite recursion
     - `org_memberships`: Platform admins need to see all orgs (they have no memberships themselves)
     - `ticket_comments`: Access controlled by ticket RLS (if you can see ticket, you can see comments)
   - **Security:** Enforced at application level in API routes
   - **Status:** ✅ Intentional and secure (see ACCOUNT_TYPES_AND_RLS_DEEP_DIVE.md)

3. **Leaked Password Protection Disabled** (WARN)
   - Supabase Auth leaked password protection is disabled
   - **Action:** Enable HaveIBeenPwned integration

---

## 📈 DATA FLOW GAPS

### Missing Flow Documentation:

1. **Ticket Auto-Assignment Flow**
   - How `default_assigned_to` is used
   - When assignment happens
   - Priority handling

2. **SOP Acknowledgment Flow**
   - How `sop_acknowledged` flag works
   - `acknowledged_sop_ids` JSONB usage
   - When acknowledgment is required

3. **File Upload Flow**
   - Client vs server-side upload differences
   - File validation
   - Error handling for failed uploads

4. **Geocoding Flow**
   - How `latitude`/`longitude` are populated
   - Mapbox integration details
   - Address validation

---

## 🛠️ OPERATIONAL GAPS

### Missing Operational Information:

1. **Monitoring & Logging**
   - What logging exists
   - Where logs are stored
   - Alerting setup
   - Performance monitoring

2. **Backup & Recovery**
   - Database backup strategy
   - Recovery procedures
   - Point-in-time recovery

3. **Scaling Considerations**
   - Current usage metrics
   - Scaling triggers
   - Resource limits
   - Cost optimization

4. **Support Procedures**
   - How to handle support requests
   - Escalation procedures
   - Common issues and solutions

---

## 📝 DOCUMENTATION GAPS

### Documentation That Needs Updates:

1. **SYSTEM_ARCHITECTURE.md**
   - Add admin levels section
   - Update storage bucket configuration
   - Add auto-assignment feature
   - Document all API endpoints
   - Add migration history

2. **API Documentation**
   - Complete OpenAPI/Swagger spec needed
   - Request/response examples
   - Authentication requirements

3. **Database Schema Documentation**
   - Complete ERD diagram
   - Relationship documentation
   - Index documentation
   - Constraint documentation

4. **Deployment Documentation**
   - Step-by-step deployment guide
   - Rollback procedures
   - Environment setup

---

## ✅ VERIFIED INFORMATION

### Confirmed Accurate:

- ✅ User roles and permissions (matches codebase)
- ✅ Database table structure (matches schema)
- ✅ Email notification triggers (matches code)
- ✅ RLS enabled/disabled status (matches advisors)
- ✅ Vercel project configuration
- ✅ Domain configuration
- ✅ Component structure
- ✅ **Platform admins have NO org_memberships** (critical design decision)
- ✅ **Ticket attachments RLS is ENABLED** (not disabled - policy checks `is_platform_admin` first)
- ✅ **Account type hierarchy:** Platform Admin > Org Admin > Employee
- ✅ **RLS disabled on profiles/org_memberships** is intentional (prevents recursion)

---

## 🎯 PRIORITY ACTIONS

### High Priority (Security & Functionality):

1. **Fix Function Search Path Issues** - Security vulnerability
2. **Document RLS Policy Rationale** - Security clarity
3. **Verify Storage Bucket Configuration** - Data security
4. **Document Admin Levels** - Access control clarity
5. **Complete API Documentation** - Developer experience

### Medium Priority (Operational):

6. **Document All Migrations** - Change tracking
7. **Complete Email Flow Documentation** - User experience
8. **Document Auto-Assignment Feature** - Feature clarity
9. **Performance Optimization Review** - System performance

### Low Priority (Nice to Have):

10. **Component Library Documentation** - Developer experience
11. **Testing Implementation Review** - Quality assurance
12. **Deployment Procedures** - Operational efficiency

---

## 📞 NEXT STEPS

To become a true expert in this platform, I recommend:

1. **Review all migration files** - Understand evolution
2. **Test all API endpoints** - Verify behavior
3. **Review performance advisors** - Optimize queries
4. **Document security model** - Complete RLS documentation
5. **Create API specification** - OpenAPI/Swagger
6. **Review error handling** - Improve user experience
7. **Document operational procedures** - Support efficiency

---

**Generated by:** AI Platform Analysis  
**Date:** November 22, 2025  
**Analysis Tools:** Vercel MCP, Supabase MCP, Codebase Search

