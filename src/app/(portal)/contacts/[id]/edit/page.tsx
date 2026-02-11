import { requireOrgAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ContactForm } from '@/components/contacts/ContactForm'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { notFound } from 'next/navigation'

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireOrgAdmin()
  const { id } = await params
  const supabase = await createClient()
  
  // Get contact
  const { data: contact } = await supabase
    .from('contacts')
    .select(`
      *,
      location:locations(id, name),
      organization:organizations(id, name)
    `)
    .eq('id', id)
    .single()

  if (!contact) {
    notFound()
  }

  const isPlatformAdmin = false // Will be checked in form
  const orgId = contact.org_id

  // Get all orgs if platform admin (for display)
  let allOrgs: Array<{ id: string; name: string }> = []
  
  // Get locations for this org
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('org_id', orgId)
    .order('name')

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Contacts', href: '/contacts' },
        { label: contact.name, href: `/contacts/${id}` },
        { label: 'Edit' },
      ]} />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit Contact</h1>
        <p className="text-muted-foreground mt-2">
          Update contact information
        </p>
      </div>

      <ContactForm
        contact={contact}
        orgId={orgId}
        isPlatformAdmin={isPlatformAdmin}
        allOrgs={allOrgs}
        locations={locations || []}
      />
    </div>
  )
}

