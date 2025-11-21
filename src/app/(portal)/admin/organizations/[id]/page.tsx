import { requirePlatformAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  // Fetch Admins
  const { data: admins } = await supabase
    .from('org_memberships')
    .select(`
      *,
      profiles (*)
    `)
    .eq('org_id', id)
    .in('role', ['org_admin', 'platform_admin'])

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
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{org.name}</h1>
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Locations</p>
                <p className="text-3xl font-bold">{locationCount}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{userCount}</p>
              </div>
              <Users className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold">{ticketCount}</p>
              </div>
              <Ticket className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Locations Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                Locations
              </h2>
              <Link href={`/locations/new?orgId=${id}`}>
                <Button size="sm" className="bg-accent hover:bg-accent-dark">
                  <Plus className="h-4 w-4 mr-2" />
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Cpu className="h-5 w-5 text-accent" />
                Hardware
              </h2>
              <Link href={`/hardware/new?orgId=${id}`}>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
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
        <div className="space-y-8">
          
          {/* Admins Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Administrators
                </CardTitle>
                {/* Future: Invite Admin Modal */}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {admins && admins.map((membership: any) => (
                  <div key={membership.id} className="p-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {membership.profiles.first_name?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {membership.profiles.first_name} {membership.profiles.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {membership.profiles.email}
                      </p>
                    </div>
                    {/* <Button size="icon" variant="ghost" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button> */}
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                 {/* Placeholder for Invite functionality - keeping scope focused */}
                <Button variant="outline" className="w-full text-xs h-8" disabled>
                  Invite New Admin (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
             <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick Actions
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-2">
                <Link href={`/locations/new?orgId=${id}`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </Link>
                <Link href={`/hardware/new?orgId=${id}`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hardware
                  </Button>
                </Link>
                <Separator className="my-2" />
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deactivate Organization
                </Button>
             </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
