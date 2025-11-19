import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { getHardware } from '@/lib/queries/hardware'
import { SOPForm } from '@/components/forms/SOPForm'

export default async function NewSOPPage() {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const orgId = profile?.org_memberships?.[0]?.org_id || ''
  const hardware = await getHardware()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create SOP</h1>
        <p className="text-muted-foreground mt-2">
          Create a new standard operating procedure for troubleshooting
        </p>
      </div>

      <SOPForm orgId={orgId} allHardware={hardware} />
    </div>
  )
}

