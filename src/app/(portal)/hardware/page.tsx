import Link from 'next/link'
import { getHardware } from '@/lib/queries/hardware'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Cpu, MapPin, Building2 } from 'lucide-react'
import { isOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { CSVDeviceUpload } from '@/components/admin/CSVDeviceUpload'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DeviceActions } from '@/components/admin/DeviceActions'

export default async function HardwarePage() {
  const hardware = await getHardware()
  const canManage = await isOrgAdmin()
  const profile = await getCurrentUserProfile()
  const isPlatformAdmin = profile?.is_platform_admin

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Devices</h1>
          <p className="text-muted-foreground mt-2">
            Inventory of installed equipment
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-3">
            {isPlatformAdmin && <CSVDeviceUpload />}
            <Link href="/hardware/new">
              <Button className="bg-accent hover:bg-accent-dark transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Hardware Table */}
      <Card className="overflow-hidden border-primary">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary border-b-0">
              <TableHead className="w-[300px] text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Device Name</TableHead>
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Type</TableHead>
              {isPlatformAdmin && <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Client Organization</TableHead>}
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Location</TableHead>
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Serial Number</TableHead>
              <TableHead className="text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-right text-primary-foreground/90 uppercase text-xs tracking-wider font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hardware.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isPlatformAdmin ? 7 : 6} className="h-32 text-center text-muted-foreground">
                  No hardware found. Add devices to your inventory.
                </TableCell>
              </TableRow>
            ) : (
              hardware.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Cpu className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.manufacturer} {item.model_number}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {item.hardware_type}
                    </Badge>
                  </TableCell>

                  {isPlatformAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="text-sm">{(item as any).organization?.name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                  )}

                  <TableCell>
                    {(item as any).location ? (
                      <Link 
                        href={`/locations/${(item as any).location.id}`}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        {(item as any).location.name}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="mono-code text-xs bg-muted px-2 py-1 rounded">
                      {item.serial_number || 'N/A'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge className={`badge-status border ${
                      item.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                      item.status === 'maintenance' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      item.status === 'decommissioned' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {item.status?.toUpperCase()}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/hardware/${item.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 lg:px-3">
                          View
                        </Button>
                      </Link>
                      {canManage && (
                        <DeviceActions
                          deviceId={item.id}
                          deviceName={item.name}
                          currentStatus={item.status || 'active'}
                        />
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
