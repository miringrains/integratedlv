import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { getLocations } from '@/lib/queries/locations'
import { HardwareForm } from '@/components/forms/HardwareForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewHardwarePage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; orgId?: string }>
}) {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  
  const isPlatformAdmin = profile?.is_platform_admin || false
  const params = await searchParams

  let allOrgs: Array<{ id: string; name: string }> = []
  
  // If platform admin, fetch all organizations for the dropdown
  if (isPlatformAdmin) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name')
    allOrgs = data || []
  }

  // Get Locations (RLS will handle visibility)
  const locations = await getLocations()

  // Determine initial orgId
  // 1. Check search params (e.g. coming from Org Hub)
  // 2. Fallback to user's first org membership if not platform admin
  let defaultOrgId = params.orgId || ''
  
  if (!defaultOrgId && !isPlatformAdmin) {
    defaultOrgId = profile?.org_memberships?.[0]?.org_id || ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add New Hardware</h1>
        <p className="text-muted-foreground mt-2">
          Register a new hardware device or equipment
        </p>
      </div>

      <HardwareForm 
        orgId={defaultOrgId} 
        locations={locations}
        defaultLocationId={params.location}
        isPlatformAdmin={isPlatformAdmin}
        allOrgs={allOrgs}
      />
    </div>
  )
}
