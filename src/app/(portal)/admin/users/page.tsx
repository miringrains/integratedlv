import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminUsersClient } from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage() {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const orgId = profile?.org_memberships?.[0]?.org_id

  if (!orgId) {
    return <div>No organization found</div>
  }

  const supabase = await createClient()

  // Get all users in the organization
  const { data: memberships } = await supabase
    .from('org_memberships')
    .select(`
      id,
      role,
      created_at,
      user:profiles (*)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  // Get locations for this org
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('org_id', orgId)
    .order('name')

  return (
    <AdminUsersClient 
      memberships={memberships || []}
      orgId={orgId}
      locations={locations || []}
    />
  )
}
