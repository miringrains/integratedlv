import Link from 'next/link'
import { getLocations } from '@/lib/queries/locations'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LocationMap } from '@/components/maps/LocationMap'
import { Plus, MapPin, Cpu, AlertCircle, Users } from 'lucide-react'
import { isOrgAdmin } from '@/lib/auth'

export default async function LocationsPage() {
  const locations = await getLocations()
  const canManage = await isOrgAdmin()
  const supabase = await createClient()

  // Get assigned users for each location
  const locationsWithUsers = await Promise.all(
    locations.map(async (location) => {
      const { data: assignments } = await supabase
        .from('location_assignments')
        .select(`
          profiles (id, first_name, last_name, avatar_url)
        `)
        .eq('location_id', location.id)
        .limit(5)
      
      const users = assignments?.map((a: any) => a.profiles).filter(Boolean) || []
      return { ...location, assigned_users: users }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Locations</h1>
          <p className="text-muted-foreground mt-2">
            Manage your store and site locations
          </p>
        </div>
        {canManage && (
          <Link href="/locations/new">
            <Button className="bg-accent hover:bg-accent-dark transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </Link>
        )}
      </div>

      {/* Empty State */}
      {locations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by adding your first location
            </p>
            {canManage && (
              <Link href="/locations/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Locations Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {locationsWithUsers.map((location) => (
          <Link key={location.id} href={`/locations/${location.id}`}>
            <Card className="card-hover h-full group overflow-hidden">
              {/* Mini Map */}
              {location.latitude && location.longitude && (
                <div className="h-32">
                  <LocationMap
                    latitude={parseFloat(location.latitude as any)}
                    longitude={parseFloat(location.longitude as any)}
                    locationName={location.name}
                    height="128px"
                    zoom={13}
                  />
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">{location.name}</CardTitle>
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                </div>
                {location.address && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {location.address}
                    {location.city && `, ${location.city}`}
                    {location.state && `, ${location.state}`}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Assigned Users - Overlapping Avatars */}
                  {(location as any).assigned_users && (location as any).assigned_users.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex -space-x-2">
                        {(location as any).assigned_users.slice(0, 4).map((user: any, idx: number) => (
                          <div
                            key={user.id}
                            className="h-7 w-7 rounded-full border-2 border-white bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold"
                            style={{ zIndex: (location as any).assigned_users.length - idx }}
                            title={`${user.first_name} ${user.last_name}`}
                          >
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              `${user.first_name?.[0]}${user.last_name?.[0]}`
                            )}
                          </div>
                        ))}
                        {(location as any).assigned_users.length > 4 && (
                          <div className="h-7 w-7 rounded-full border-2 border-white bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold">
                            +{(location as any).assigned_users.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manager Info */}
                  {location.manager_name && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Manager: </span>
                      <span className="font-medium">{location.manager_name}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-3 border-t">
                    <div className="flex items-center gap-1 text-sm">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{location.hardware_count || 0}</span>
                      <span className="text-muted-foreground">devices</span>
                    </div>
                    {(location.open_tickets_count || 0) > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <AlertCircle className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-accent">{location.open_tickets_count}</span>
                        <span className="text-muted-foreground">open</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

