import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { LocationForm } from '@/components/forms/LocationForm'
import { createClient } from '@/lib/supabase/server'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default async function NewLocationPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>
}) {
  try {
    await requireOrgAdmin()
    const profile = await getCurrentUserProfile()
    
    if (!profile) {
      throw new Error('Failed to load user profile')
    }
    
    const supabase = await createClient()
    const params = await searchParams

    const isPlatformAdmin = profile.is_platform_admin || false
    
    let allOrgs: Array<{ id: string; name: string }> = []
    
    if (isPlatformAdmin) {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')
      
      if (error) {
        console.error('Error fetching organizations:', error)
        // Don't fail the page, just log the error
      } else {
        allOrgs = data || []
      }
    }

    let defaultOrgId = params.orgId || ''
    
    if (!defaultOrgId && !isPlatformAdmin) {
      defaultOrgId = profile.org_memberships?.[0]?.org_id || ''
    }

    // Get platform admins for default assignment dropdown
    const { data: platformAdmins, error: platformAdminsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('is_platform_admin', true)
      .order('first_name')

    if (platformAdminsError) {
      console.error('Error fetching platform admins:', platformAdminsError)
    }

    console.log('NewLocationPage rendering with:', {
      isPlatformAdmin,
      defaultOrgId,
      allOrgsCount: allOrgs.length,
      platformAdminsCount: (platformAdmins || []).length,
    })

    return (
      <ErrorBoundary>
        <div className="space-y-6 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add New Location</h1>
            <p className="text-muted-foreground mt-2">
              Create a new store or site location
            </p>
          </div>

          <div className="min-h-0">
            <LocationForm 
              orgId={defaultOrgId} 
              isPlatformAdmin={isPlatformAdmin}
              allOrgs={allOrgs}
              platformAdmins={platformAdmins || []}
            />
          </div>
        </div>
      </ErrorBoundary>
    )
  } catch (error) {
    console.error('Error in NewLocationPage:', error)
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Location</h1>
          <p className="text-destructive mt-2">
            Error loading page: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }
}
