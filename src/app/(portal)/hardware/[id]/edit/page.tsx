import { notFound } from 'next/navigation'
import { requireOrgAdmin } from '@/lib/auth'
import { getHardwareWithLocation } from '@/lib/queries/hardware'
import { getLocations } from '@/lib/queries/locations'
import { HardwareForm } from '@/components/forms/HardwareForm'

export default async function EditHardwarePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireOrgAdmin()
  const { id } = await params
  const hardware = await getHardwareWithLocation(id)
  const locations = await getLocations()

  if (!hardware) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit Device</h1>
        <p className="text-muted-foreground mt-2">
          Update device information for {hardware.name}
        </p>
      </div>

      <HardwareForm 
        hardware={hardware} 
        orgId={hardware.org_id}
        locations={locations}
      />
    </div>
  )
}

