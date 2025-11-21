import Link from 'next/link'
import { getLocations } from '@/lib/queries/locations'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Cpu, AlertCircle, ArrowRight, Building2, MoreHorizontal } from 'lucide-react'
import { isOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function LocationsPage() {
  const locations = await getLocations()
  const canManage = await isOrgAdmin()
  const profile = await getCurrentUserProfile()
  const isPlatformAdmin = profile?.is_platform_admin
  const supabase = await createClient()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Site Locations</h1>
          <p className="text-muted-foreground mt-2">
            Manage physical sites and their resources
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

      {/* Locations Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Location Name</TableHead>
              {isPlatformAdmin && <TableHead>Client Organization</TableHead>}
              <TableHead>City / State</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead>Open Tickets</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isPlatformAdmin ? 7 : 6} className="h-32 text-center text-muted-foreground">
                  No locations found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <MapPin className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{location.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {location.address || 'No address set'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {isPlatformAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="text-sm">{(location as any).organization?.name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                  )}

                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {location.city || '-'}, {location.state || '-'}
                    </span>
                  </TableCell>

                  <TableCell>
                    {location.manager_name ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{location.manager_name}</span>
                        <span className="text-xs text-muted-foreground">{location.manager_email}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-semibold">{location.hardware_count || 0}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {(location.open_tickets_count || 0) > 0 ? (
                      <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 gap-1.5">
                        <AlertCircle className="h-3 w-3" />
                        {location.open_tickets_count} Open
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">All clear</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/locations/${location.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 lg:px-3">
                          View
                        </Button>
                      </Link>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/locations/${location.id}/edit`}>Edit Location</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/hardware/new?location=${location.id}`}>Add Hardware</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/tickets/new?location=${location.id}`}>Report Issue</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
