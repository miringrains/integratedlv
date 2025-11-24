import { requireOrgAdmin, getCurrentUserProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Mail, Phone, MapPin, Building2, Trash2, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { ContactsClient } from '@/components/contacts/ContactsClient'

export default async function ContactsPage() {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const supabase = await createClient()
  
  const isPlatformAdmin = profile?.is_platform_admin || false
  const orgId = profile?.org_memberships?.[0]?.org_id

  // Get contacts
  let contacts: any[] = []
  if (isPlatformAdmin) {
    const { data } = await supabase
      .from('contacts')
      .select(`
        *,
        location:locations(id, name),
        organization:organizations(id, name)
      `)
      .order('name')
    contacts = data || []
  } else if (orgId) {
    const { data } = await supabase
      .from('contacts')
      .select(`
        *,
        location:locations(id, name)
      `)
      .eq('org_id', orgId)
      .order('name')
    contacts = data || []
  }

  // Get locations for this org (for filtering/display)
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('org_id', orgId || '')
    .order('name')

  return (
    <ContactsClient
      contacts={contacts}
      orgId={orgId || ''}
      isPlatformAdmin={isPlatformAdmin}
      locations={locations || []}
    />
  )
}

