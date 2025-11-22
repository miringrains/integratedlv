import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { LocationForm } from '@/components/forms/LocationForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>
}) {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  const params = await searchParams

  const isPlatformAdmin = profile?.is_platform_admin || false
  
  let allOrgs: Array<{ id: string; name: string }> = []
  
  if (isPlatformAdmin) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name')
    allOrgs = data || []
  }

  let defaultOrgId = params.orgId || ''
  
  if (!defaultOrgId && !isPlatformAdmin) {
    defaultOrgId = profile?.org_memberships?.[0]?.org_id || ''
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
        <h1 className="text-3xl font-bold text-foreground">Add New Location</h1>
        <p className="text-muted-foreground mt-2">
          Create a new store or site location
        </p>
      </div>

      <LocationForm 
        orgId={defaultOrgId} 
        isPlatformAdmin={isPlatformAdmin}
        allOrgs={allOrgs}
        platformAdmins={platformAdmins || []}
      />
    </div>
  )
}
