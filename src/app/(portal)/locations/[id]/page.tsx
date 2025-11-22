import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocation } from '@/lib/queries/locations'
import { createClient } from '@/lib/supabase/server'
import { isOrgAdmin } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LocationMap } from '@/components/maps/LocationMap'
import { Edit, MapPin, Phone, Mail, Clock, User } from 'lucide-react'

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const location = await getLocation(id)
  const canManage = await isOrgAdmin()

  if (!location) {
    notFound()
  }

  const supabase = await createClient()

  // Get hardware for this location
  const { data: hardware } = await supabase
    .from('hardware')
    .select('*')
    .eq('location_id', id)
    .order('name')

  // Get recent tickets
  const { data: tickets } = await supabase
    .from('care_log_tickets')
    .select(`
      *,
      hardware (name),
      submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey (first_name, last_name)
    `)
    .eq('location_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1>{location.name}</h1>
          {location.address && (
            <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              {location.address}
              {location.city && `, ${location.city}`}
              {location.state && `, ${location.state} ${location.zip_code || ''}`}
            </p>
          )}
        </div>
        {canManage && (
          <Link href={`/locations/${id}/edit`}>
            <Button size="sm" className="h-9">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      {/* Map */}
      {location.latitude && location.longitude && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              Location Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LocationMap
              latitude={parseFloat(location.latitude as any)}
              longitude={parseFloat(location.longitude as any)}
              locationName={location.name}
              height="300px"
            />
          </CardContent>
        </Card>
      )}

      {/* Location Details */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Manager Information */}
        {location.manager_name && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Manager Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{location.manager_name}</p>
              </div>
              {location.manager_phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${location.manager_phone}`} className="hover:text-accent">
                    {location.manager_phone}
                  </a>
                </div>
              )}
              {location.manager_email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${location.manager_email}`} className="hover:text-accent">
                    {location.manager_email}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Store Hours */}
        {location.store_hours && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Store Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{location.store_hours}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Timezone: {location.timezone}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Internal Notes */}
      {location.internal_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{location.internal_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Hardware */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hardware ({hardware?.length || 0})</CardTitle>
          {canManage && (
            <Link href={`/hardware/new?location=${id}`}>
              <Button size="sm">Add Hardware</Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {hardware && hardware.length > 0 ? (
            <div className="space-y-2">
              {hardware.map((item) => (
                <Link 
                  key={item.id} 
                  href={`/hardware/${item.id}`}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.hardware_type}</p>
                    </div>
                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hardware registered for this location yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Tickets</CardTitle>
          <Link href={`/tickets?location=${id}`}>
            <Button size="sm" variant="outline">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {tickets && tickets.length > 0 ? (
            <div className="space-y-2">
              {tickets.map((ticket: any) => (
                <Link 
                  key={ticket.id} 
                  href={`/tickets/${ticket.id}`}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ticket.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.hardware?.name} • {ticket.ticket_number}
                      </p>
                    </div>
                    <Badge variant={
                      ticket.status === 'open' ? 'default' :
                      ticket.status === 'in_progress' ? 'secondary' :
                      ticket.status === 'resolved' ? 'outline' :
                      'secondary'
                    }>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tickets for this location yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

