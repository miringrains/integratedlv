import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getHardwareWithLocation } from '@/lib/queries/hardware'
import { isOrgAdmin } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { MapPin, Calendar, ExternalLink } from 'lucide-react'
import { DeviceActions } from '@/components/admin/DeviceActions'
import { formatDate } from '@/lib/utils'

export default async function HardwareDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const hardware = await getHardwareWithLocation(id)
  const canManage = await isOrgAdmin()

  if (!hardware) notFound()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Devices', href: '/hardware' },
        { label: hardware.name },
      ]} />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{hardware.name}</h1>
            <Badge className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${
              hardware.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
              hardware.status === 'maintenance' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              hardware.status === 'inactive' ? 'bg-gray-100 text-gray-600 border-gray-200' :
              hardware.status === 'decommissioned' ? 'bg-red-50 text-red-700 border-red-200' :
              'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {hardware.status?.charAt(0).toUpperCase() + hardware.status?.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            {hardware.hardware_type}
          </p>
          {hardware.location && (
            <Link 
              href={`/locations/${hardware.location.id}`}
              className="text-sm text-accent hover:underline flex items-center gap-1 mt-1"
            >
              <MapPin className="h-3 w-3" />
              {hardware.location.name}
            </Link>
          )}
        </div>
        {canManage && (
          <DeviceActions
            deviceId={id}
            deviceName={hardware.name}
            currentStatus={hardware.status || 'active'}
            variant="buttons"
          />
        )}
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hardware.manufacturer && (
              <div>
                <p className="text-sm text-muted-foreground">Manufacturer</p>
                <p className="font-medium">{hardware.manufacturer}</p>
              </div>
            )}
            {hardware.model_number && (
              <div>
                <p className="text-sm text-muted-foreground">Model Number</p>
                <p className="font-medium">{hardware.model_number}</p>
              </div>
            )}
            {hardware.serial_number && (
              <div>
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <p className="font-mono text-sm">{hardware.serial_number}</p>
              </div>
            )}
            {hardware.vendor_url && (
              <div>
                <a 
                  href={hardware.vendor_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline flex items-center gap-1"
                >
                  Vendor Product Page
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates & Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance & Warranty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hardware.installation_date && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Installation Date
                </p>
                <p className="font-medium">{formatDate(hardware.installation_date)}</p>
              </div>
            )}
            {hardware.last_maintenance_date && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last Maintenance
                </p>
                <p className="font-medium">{formatDate(hardware.last_maintenance_date)}</p>
              </div>
            )}
            {hardware.warranty_expiration && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Warranty Expires
                </p>
                <p className="font-medium">{formatDate(hardware.warranty_expiration)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Internal Notes */}
      {hardware.internal_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{hardware.internal_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

