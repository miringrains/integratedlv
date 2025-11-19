import Link from 'next/link'
import { getLocations } from '@/lib/queries/locations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Cpu, AlertCircle } from 'lucide-react'
import { isOrgAdmin } from '@/lib/auth'

export default async function LocationsPage() {
  const locations = await getLocations()
  const canManage = await isOrgAdmin()

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
            <Button>
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
        {locations.map((location) => (
          <Link key={location.id} href={`/locations/${location.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
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
                      <span className="font-semibold">{location.hardware_count}</span>
                      <span className="text-muted-foreground">devices</span>
                    </div>
                    {location.open_tickets_count > 0 && (
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

