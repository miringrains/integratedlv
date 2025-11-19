import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { LocationForm } from '@/components/forms/LocationForm'

export default async function NewLocationPage() {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  
  const orgId = profile?.org_memberships?.[0]?.org_id || ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add New Location</h1>
        <p className="text-muted-foreground mt-2">
          Create a new store or site location
        </p>
      </div>

      <LocationForm orgId={orgId} />
    </div>
  )
}

