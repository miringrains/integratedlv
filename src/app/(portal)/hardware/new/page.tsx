import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { getLocations } from '@/lib/queries/locations'
import { HardwareForm } from '@/components/forms/HardwareForm'

export default async function NewHardwarePage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>
}) {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const orgId = profile?.org_memberships?.[0]?.org_id || ''
  const locations = await getLocations()
  const params = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add New Hardware</h1>
        <p className="text-muted-foreground mt-2">
          Register a new hardware device or equipment
        </p>
      </div>

      <HardwareForm 
        orgId={orgId} 
        locations={locations}
        defaultLocationId={params.location}
      />
    </div>
  )
}

