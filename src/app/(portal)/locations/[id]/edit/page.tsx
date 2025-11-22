import { notFound } from 'next/navigation'
import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { getLocation } from '@/lib/queries/locations'
import { LocationForm } from '@/components/forms/LocationForm'
import { createClient } from '@/lib/supabase/server'

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const location = await getLocation(id)
  
  if (!location) {
    notFound()
  }

  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  
  const isPlatformAdmin = profile?.is_platform_admin || false
  
  let allOrgs: Array<{ id: string; name: string }> = []
  
  if (isPlatformAdmin) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name')
    allOrgs = data || []
  }

  // Get platform admins for default assignment dropdown
  const { data: platformAdmins } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('is_platform_admin', true)
    .order('first_name')

  return (
    <div className="space-y-6">
      <div>
        <h1>Edit Location</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update location details and settings
        </p>
      </div>

      <LocationForm 
        location={location}
        orgId={location.org_id}
        isPlatformAdmin={isPlatformAdmin}
        allOrgs={allOrgs}
        platformAdmins={platformAdmins || []}
      />
    </div>
  )
}
