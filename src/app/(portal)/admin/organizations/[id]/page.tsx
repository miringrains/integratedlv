import { requirePlatformAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InviteOrgAdminModal } from '@/components/admin/InviteOrgAdminModal'
import { AdminActions } from '@/components/admin/AdminActions'
import { OrganizationTabs } from '@/components/admin/OrganizationTabs'
import Link from 'next/link'
import { 
  Building2, 
  Users, 
  MapPin, 
  Ticket, 
  Cpu, 
  Plus, 
  ArrowLeft, 
  Mail,
  Trash2
} from 'lucide-react'

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePlatformAdmin()
  const { id } = await params
  const supabase = await createClient()

  // Fetch Organization Details
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (!org) {
    return <div>Organization not found</div>
  }

  // Fetch Stats
  const { count: locationCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', id)

  const { count: userCount } = await supabase
    .from('org_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', id)

  const { count: ticketCount } = await supabase
    .from('care_log_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', id)

  // Fetch ALL users in this org (not just admins)
  const { data: allMembers, error: membersError } = await supabase
    .from('org_memberships')
    .select(`
      id,
      role,
      created_at,
      profiles (
        id,
        email,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('org_id', id)
    .order('role', { ascending: true })
  
  // Separate admins from employees
  // Only show org_admin as administrators (platform_admin shouldn't be in org_memberships)
  const admins = allMembers?.filter(m => m.role === 'org_admin') || []
  const employees = allMembers?.filter(m => m.role === 'employee') || []

  // Fetch Locations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('org_id', id)
    .order('name')

  // Fetch Hardware
  const { data: hardware } = await supabase
    .from('hardware')
    .select(`
      *,
      location:locations(name)
    `)
    .eq('org_id', id)
    .order('created_at', { ascending: false })

  // Fetch Departments
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .eq('org_id', id)
    .order('name')

  // Fetch Contracts
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('org_id', id)
    .order('created_at', { ascending: false })

  // Fetch Tickets (recent 20)
  const { data: tickets } = await supabase
    .from('care_log_tickets')
    .select('id, ticket_number, title, status, priority, created_at')
    .eq('org_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch Contacts
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('org_id', id)
    .order('name')

  // Fetch Platform Admins (for account manager dropdown)
  const { data: platformAdmins } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('is_platform_admin', true)
    .order('first_name')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link 
          href="/admin/organizations" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Organizations
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
              {org.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1>{org.name}</h1>
              <p className="text-muted-foreground text-sm">
                Created on {new Date(org.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {/* Future: Edit Org Button */}
          </div>
        </div>
      </div>

      {/* Compact Stats Row */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{locationCount}</span>
          <span className="text-muted-foreground">Locations</span>
        </div>
        <span className="text-muted-foreground">•</span>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{userCount}</span>
          <span className="text-muted-foreground">Users</span>
        </div>
        <span className="text-muted-foreground">•</span>
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{ticketCount}</span>
          <span className="text-muted-foreground">Tickets</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2">
          {/* Organization Tabs */}
          <OrganizationTabs
            orgId={id}
            organization={org}
            platformAdmins={platformAdmins || []}
            locations={locations || []}
            hardware={hardware || []}
            departments={departments || []}
            contracts={contracts || []}
            tickets={tickets || []}
            contacts={contacts || []}
          />
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-4">
          
          {/* Admins Section */}
          <Card className="bg-primary text-primary-foreground border-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Administrators
                </CardTitle>
                {/* Future: Invite Admin Modal */}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {admins && admins.length > 0 ? (
                <div className="divide-y divide-primary-foreground/10">
                  {admins.map((membership: any) => {
                    const profile = membership.profiles
                    if (!profile) return null
                    
                    return (
                      <div key={membership.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {profile.first_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {profile.first_name} {profile.last_name}
                            </p>
                            <p className="text-xs text-primary-foreground/60 truncate">
                              {profile.email}
                            </p>
                          </div>
                        </div>
                        <AdminActions
                          userId={profile.id}
                          userEmail={profile.email}
                          userName={`${profile.first_name} ${profile.last_name}`}
                          orgId={id}
                          currentRole={membership.role as 'org_admin' | 'employee'}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-primary-foreground/60 text-sm">
                  No administrators assigned
                </div>
              )}
              <div className="p-4 border-t border-primary-foreground/10">
                <InviteOrgAdminModal orgId={id} />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
