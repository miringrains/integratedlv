import Link from 'next/link'
import { getHardware } from '@/lib/queries/hardware'
import { getLocations } from '@/lib/queries/locations'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Cpu } from 'lucide-react'
import { isOrgAdmin } from '@/lib/auth'

export default async function HardwarePage() {
  const hardware = await getHardware()
  const locations = await getLocations()
  const canManage = await isOrgAdmin()

  // Create location lookup
  const locationMap = new Map(locations.map(loc => [loc.id, loc]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hardware Inventory</h1>
          <p className="text-muted-foreground mt-2">
            Manage all hardware and equipment across locations
          </p>
        </div>
        {canManage && (
          <Link href="/hardware/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Hardware
            </Button>
          </Link>
        )}
      </div>

      {/* Empty State */}
      {hardware.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center">
            <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hardware yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding your first hardware device
            </p>
            {canManage && (
              <Link href="/hardware/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hardware
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Hardware Table */}
      {hardware.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hardware.map((item) => {
                const location = locationMap.get(item.location_id)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.hardware_type}</TableCell>
                    <TableCell>
                      {location ? (
                        <Link 
                          href={`/locations/${location.id}`}
                          className="text-accent hover:underline"
                        >
                          {location.name}
                        </Link>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="mono-code">
                      {item.serial_number || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`badge-status ${
                        item.status === 'active' ? 'bg-green-100 text-green-700 border-green-300' :
                        item.status === 'maintenance' ? 'bg-accent/10 text-accent border-accent/30' :
                        'bg-gray-200 text-gray-700 border-gray-300'
                      }`}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/hardware/${item.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

