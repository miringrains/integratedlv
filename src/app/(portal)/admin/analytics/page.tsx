import { requireOrgAdmin, getCurrentUserProfile, isPlatformAdmin as checkIsPlatformAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsClient } from '@/components/analytics/AnalyticsClient'

export default async function AdminAnalyticsPage() {
  await requireOrgAdmin()
  const profile = await getCurrentUserProfile()
  const isPlatformAdmin = await checkIsPlatformAdmin()
  const orgId = profile?.org_memberships?.[0]?.org_id
  
  const supabase = await createClient()

  // Fetch organizations (for platform admins)
  const { data: organizations } = isPlatformAdmin
    ? await supabase.from('organizations').select('id, name').order('name')
    : { data: [] }

  // Build query based on user type
  let ticketsQuery = supabase
    .from('care_log_tickets')
    .select(`
      id,
      ticket_number,
      title,
      status,
      priority,
      org_id,
      created_at,
      resolved_at,
      closed_at,
      first_response_at,
      customer_satisfaction_rating,
      organization:organizations(name),
      hardware(name, hardware_type)
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  // Non-platform admins can only see their org's tickets
  if (!isPlatformAdmin && orgId) {
    ticketsQuery = ticketsQuery.eq('org_id', orgId)
  }

  const { data: tickets } = await ticketsQuery

  // Transform Supabase array joins into single objects
  const transformedTickets = (tickets || []).map(ticket => ({
    ...ticket,
    organization: Array.isArray(ticket.organization) ? ticket.organization[0] || null : ticket.organization,
    hardware: Array.isArray(ticket.hardware) ? ticket.hardware[0] || null : ticket.hardware,
  }))

  return (
    <AnalyticsClient
      isPlatformAdmin={isPlatformAdmin}
      organizations={organizations || []}
      tickets={transformedTickets}
      initialOrgId={isPlatformAdmin ? undefined : orgId}
    />
  )
}
