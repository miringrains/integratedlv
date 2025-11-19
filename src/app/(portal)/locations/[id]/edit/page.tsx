import { notFound } from 'next/navigation'
import { requireOrgAdmin } from '@/lib/auth'
import { getLocation } from '@/lib/queries/locations'
import { LocationForm } from '@/components/forms/LocationForm'

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireOrgAdmin()
  const { id } = await params
  const location = await getLocation(id)

  if (!location) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit Location</h1>
        <p className="text-muted-foreground mt-2">
          Update location information for {location.name}
        </p>
      </div>

      <LocationForm location={location} orgId={location.org_id} />
    </div>
  )
}

