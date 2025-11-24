import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ContactForm } from '@/components/contacts/ContactForm'

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>
}) {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  
  const isPlatformAdmin = profile?.is_platform_admin || false
  const params = await searchParams

  let allOrgs: Array<{ id: string; name: string }> = []
  
  if (isPlatformAdmin) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name')
    allOrgs = data || []
  }

  const orgId = params.orgId || profile?.org_memberships?.[0]?.org_id || ''

  // Get locations for this org
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('org_id', orgId)
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add New Contact</h1>
        <p className="text-muted-foreground mt-2">
          Add a new contact to your organization
        </p>
      </div>

      <ContactForm
        orgId={orgId}
        isPlatformAdmin={isPlatformAdmin}
        allOrgs={allOrgs}
        locations={locations || []}
      />
    </div>
  )
}

