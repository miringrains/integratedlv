import { requirePlatformAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InviteAdminButton } from '@/components/admin/InviteAdminButton'
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
  MoreVertical,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Separator } from '@/components/ui/separator'

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
  const admins = allMembers?.filter(m => ['org_admin', 'platform_admin'].includes(m.role)) || []
  const employees = allMembers?.filter(m => m.role === 'employee') || []

  // Fetch Locations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('org_id', id)
    .order('name')

  // Fetch Hardware (Limit 5 recent)
  const { data: hardware } = await supabase
    .from('hardware')
    .select(`
      *,
      location:locations(name)
    `)
    .eq('org_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

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
        <div className="lg:col-span-2 space-y-6">
          
          {/* Locations Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                Locations
              </h2>
              <Link href={`/locations/new?orgId=${id}`}>
                <Button size="sm" className="bg-accent hover:bg-accent-dark h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Location
                </Button>
              </Link>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {locations && locations.length > 0 ? (
                  <div className="divide-y">
                    {locations.map((loc) => (
                      <div key={loc.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div>
                          <Link href={`/locations/${loc.id}`} className="font-semibold hover:text-primary hover:underline">
                            {loc.name}
                          </Link>
                          <div className="text-sm text-muted-foreground mt-1">
                            {loc.city}, {loc.state}
                          </div>
                        </div>
                        <Link href={`/locations/${loc.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No locations found. Add one to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Hardware Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                Hardware
              </h2>
              <Link href={`/hardware/new?orgId=${id}`}>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Hardware
                </Button>
              </Link>
            </div>
            
            <Card>
              <CardContent className="p-0">
                {hardware && hardware.length > 0 ? (
                  <div className="divide-y">
                    {hardware.map((hw) => (
                      <div key={hw.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Cpu className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <Link href={`/hardware/${hw.id}`} className="font-semibold hover:text-primary hover:underline">
                              {hw.name}
                            </Link>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] h-5">
                                {hw.hardware_type}
                              </Badge>
                              <span>•</span>
                              <span className="text-xs">{hw.location?.name || 'Unassigned'}</span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/hardware/${hw.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No hardware found.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-xs">
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs">
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs text-destructive">
                              Remove from Organization
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                <InviteAdminButton orgId={id} />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
