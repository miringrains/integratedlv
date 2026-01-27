import { createClient } from '@/lib/supabase/server'
import type { CareLogTicket } from '@/types/database'

export interface DashboardStats {
  openTickets: number
  pendingTickets: number
  dueTodayTickets: number
  overdueTickets: number
  unassignedTickets: number
  avgResponseTime: number
  avgResolutionTime: number
  slaCompliancePercentage: number
  customerSatisfactionAvg: number
  dissatisfiedCustomers: Array<{
    org_id: string
    org_name: string
    avg_rating: number
    ticket_count: number
  }>
}

export interface TicketList {
  tickets: CareLogTicket[]
  count: number
}

/**
 * Get dashboard statistics for platform admin (all orgs) or org admin (their org)
 */
export async function getDashboardStats(orgId?: string): Promise<DashboardStats> {
  const supabase = await createClient()
  
  // Build base query
  const buildTicketsQuery = () => {
    let q = supabase.from('care_log_tickets').select('*', { count: 'exact', head: true })
    if (orgId) q = q.eq('org_id', orgId)
    return q
  }

  // Get counts for different statuses
  const [openResult, pendingResult, dueTodayResult, overdueResult, unassignedResult] = await Promise.all([
    buildTicketsQuery().eq('status', 'open'),
    buildTicketsQuery().eq('status', 'in_progress'),
    buildTicketsQuery()
      .gte('due_date', new Date().toISOString().split('T')[0] + 'T00:00:00')
      .lt('due_date', new Date().toISOString().split('T')[0] + 'T23:59:59')
      .not('status', 'in', ['resolved', 'closed', 'cancelled']),
    buildTicketsQuery()
      .lt('due_date', new Date().toISOString())
      .not('status', 'in', ['resolved', 'closed', 'cancelled']),
    buildTicketsQuery().is('assigned_to', null)
  ])

  const openTickets = openResult.count || 0
  const pendingTickets = pendingResult.count || 0
  const dueTodayTickets = dueTodayResult.count || 0
  const overdueTickets = overdueResult.count || 0
  const unassignedTickets = unassignedResult.count || 0

  // Get timing analytics - join with tickets to filter by org
  let timingQuery = supabase
    .from('ticket_timing_analytics')
    .select(`
      time_to_first_response_ms,
      time_to_resolve_ms,
      ticket:care_log_tickets(org_id)
    `)

  const { data: allTiming } = await timingQuery
  const timingData = orgId 
    ? allTiming?.filter((t: any) => t.ticket?.org_id === orgId) || []
    : allTiming || []
  
  const responseTimes = timingData.filter((t: any) => t.time_to_first_response_ms)
  const resolutionTimes = timingData.filter((t: any) => t.time_to_resolve_ms)
  
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum: number, t: any) => sum + (t.time_to_first_response_ms || 0), 0) / responseTimes.length
    : 0

  const avgResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes.reduce((sum: number, t: any) => sum + (t.time_to_resolve_ms || 0), 0) / resolutionTimes.length
    : 0

  // Get SLA compliance
  let slaQuery = supabase
    .from('care_log_tickets')
    .select('sla_response_due_at, first_response_at, sla_resolution_due_at, resolved_at, status')

  if (orgId) {
    slaQuery = slaQuery.eq('org_id', orgId)
  }

  const { data: slaData } = await slaQuery
    .not('sla_response_due_at', 'is', null)
    .not('status', 'in', ['open', 'cancelled'])

  const slaCompliant = slaData?.filter(ticket => {
    const responseMet = !ticket.first_response_at || 
      (ticket.first_response_at && ticket.sla_response_due_at && 
       new Date(ticket.first_response_at) <= new Date(ticket.sla_response_due_at))
    const resolutionMet = !ticket.resolved_at || 
      (ticket.resolved_at && ticket.sla_resolution_due_at && 
       new Date(ticket.resolved_at) <= new Date(ticket.sla_resolution_due_at))
    return responseMet && resolutionMet
  }).length || 0

  const slaCompliancePercentage = slaData && slaData.length > 0
    ? (slaCompliant / slaData.length) * 100
    : 0

  // Get customer satisfaction
  let satisfactionQuery = supabase
    .from('care_log_tickets')
    .select('customer_satisfaction_rating, org_id, organizations!inner(name)')

  if (orgId) {
    satisfactionQuery = satisfactionQuery.eq('org_id', orgId)
  }

  const { data: satisfactionData } = await satisfactionQuery
    .not('customer_satisfaction_rating', 'is', null)

  const ratings = satisfactionData?.map(t => t.customer_satisfaction_rating) || []
  const customerSatisfactionAvg = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 0

  // Get dissatisfied customers (avg rating < 3)
  const orgRatings = new Map<string, { ratings: number[], org_name: string }>()
  satisfactionData?.forEach(ticket => {
    const ticketOrgId = (ticket as any).org_id
    const orgName = (ticket as any).organizations?.name || 'Unknown'
    if (!orgRatings.has(ticketOrgId)) {
      orgRatings.set(ticketOrgId, { ratings: [], org_name: orgName })
    }
    orgRatings.get(ticketOrgId)!.ratings.push(ticket.customer_satisfaction_rating!)
  })

  const dissatisfiedCustomers = Array.from(orgRatings.entries())
    .map(([org_id, data]) => {
      const avgRating = data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
      return {
        org_id,
        org_name: data.org_name,
        avg_rating: avgRating,
        ticket_count: data.ratings.length
      }
    })
    .filter(c => c.avg_rating < 3)
    .sort((a, b) => a.avg_rating - b.avg_rating)

  return {
    openTickets,
    pendingTickets,
    dueTodayTickets,
    overdueTickets,
    unassignedTickets,
    avgResponseTime,
    avgResolutionTime,
    slaCompliancePercentage,
    customerSatisfactionAvg,
    dissatisfiedCustomers
  }
}

/**
 * Get tickets for a specific view (open, pending, due today, overdue, unassigned)
 */
export async function getDashboardTickets(
  view: 'open' | 'pending' | 'due_today' | 'overdue' | 'unassigned',
  orgId?: string,
  limit: number = 10
): Promise<TicketList> {
  const supabase = await createClient()
  
  let query = supabase
    .from('care_log_tickets')
    .select(`
      *,
      location:locations(name),
      organization:organizations(name),
      hardware:hardware(name, hardware_type),
      submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey(first_name, last_name, email),
      assigned_to_profile:profiles!care_log_tickets_assigned_to_fkey(first_name, last_name, email)
    `, { count: 'exact' })

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  // Apply view-specific filters
  switch (view) {
    case 'open':
      query = query.eq('status', 'open')
      break
    case 'pending':
      query = query.eq('status', 'in_progress')
      break
    case 'due_today':
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      query = query
        .gte('due_date', todayStart.toISOString())
        .lt('due_date', todayEnd.toISOString())
        .not('status', 'in', ['resolved', 'closed', 'cancelled'])
      break
    case 'overdue':
      query = query
        .lt('due_date', new Date().toISOString())
        .not('status', 'in', ['resolved', 'closed', 'cancelled'])
      break
    case 'unassigned':
      query = query.is('assigned_to', null)
      break
  }

  query = query.order('created_at', { ascending: false }).limit(limit)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching dashboard tickets:', error)
    return { tickets: [], count: 0 }
  }

  return {
    tickets: (data as CareLogTicket[]) || [],
    count: count || 0
  }
}

/**
 * Get critical tickets (urgent + overdue)
 */
export async function getCriticalTickets(orgId?: string, limit: number = 10): Promise<TicketList> {
  const supabase = await createClient()
  
  let query = supabase
    .from('care_log_tickets')
    .select(`
      *,
      location:locations(name),
      organization:organizations(name),
      hardware:hardware(name, hardware_type),
      submitted_by_profile:profiles!care_log_tickets_submitted_by_fkey(first_name, last_name, email),
      assigned_to_profile:profiles!care_log_tickets_assigned_to_fkey(first_name, last_name, email)
    `, { count: 'exact' })

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const now = new Date().toISOString()
  const { data, count, error } = await query
    .or(`priority.eq.urgent,and(due_date.lt.${now},status.neq.resolved,status.neq.closed,status.neq.cancelled)`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching critical tickets:', error)
    return { tickets: [], count: 0 }
  }

  return {
    tickets: (data as CareLogTicket[]) || [],
    count: count || 0
  }
}

/**
 * Get device tickets (grouped by hardware type)
 */
export async function getDeviceTickets(orgId?: string): Promise<Array<{
  hardware_type: string
  ticket_count: number
  hardware_name: string
}>> {
  const supabase = await createClient()
  
  let query = supabase
    .from('care_log_tickets')
    .select('hardware_id, hardware:hardware!inner(hardware_type, name)')

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data } = await query.not('hardware_id', 'is', null)

  // Group by hardware type
  const grouped = new Map<string, { count: number, name: string }>()
  data?.forEach((ticket: any) => {
    const hw = ticket.hardware
    if (hw) {
      const key = hw.hardware_type
      if (!grouped.has(key)) {
        grouped.set(key, { count: 0, name: hw.name })
      }
      grouped.get(key)!.count++
    }
  })

  return Array.from(grouped.entries()).map(([hardware_type, data]) => ({
    hardware_type,
    ticket_count: data.count,
    hardware_name: data.name
  })).sort((a, b) => b.ticket_count - a.ticket_count)
}

/**
 * Get customer tickets (recent tickets grouped by client)
 */
export async function getCustomerTickets(orgId?: string, limit: number = 5): Promise<Array<{
  org_id: string
  org_name: string
  recent_tickets: CareLogTicket[]
  total_tickets: number
}>> {
  const supabase = await createClient()
  
  // If orgId provided, return single org
  if (orgId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    const { data: tickets, count } = await supabase
      .from('care_log_tickets')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return [{
      org_id: orgId,
      org_name: org?.name || 'Unknown',
      recent_tickets: (tickets as CareLogTicket[]) || [],
      total_tickets: count || 0
    }]
  }

  // Platform admin view - get all orgs
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .neq('name', 'Integrated LV')

  const results = []
  for (const org of orgs || []) {
    const { data: tickets, count } = await supabase
      .from('care_log_tickets')
      .select('*', { count: 'exact' })
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    results.push({
      org_id: org.id,
      org_name: org.name,
      recent_tickets: (tickets as CareLogTicket[]) || [],
      total_tickets: count || 0
    })
  }

  return results.sort((a, b) => b.total_tickets - a.total_tickets)
}
