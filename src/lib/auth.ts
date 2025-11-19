import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ProfileWithMemberships, OrgMembership } from '@/types/database'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserProfile(): Promise<ProfileWithMemberships | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      org_memberships (
        id,
        org_id,
        role,
        created_at
      )
    `)
    .eq('id', user.id)
    .single()

  return profile as ProfileWithMemberships
}

export async function getUserOrganizations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: memberships } = await supabase
    .from('org_memberships')
    .select(`
      *,
      organizations (*)
    `)
    .eq('user_id', user.id)

  return memberships || []
}

export async function getUserLocations(userId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const targetUserId = userId || user?.id
  
  if (!targetUserId) {
    return []
  }

  const { data: assignments } = await supabase
    .from('location_assignments')
    .select(`
      *,
      locations (*)
    `)
    .eq('user_id', targetUserId)

  return assignments || []
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requirePlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) {
    redirect('/home')
  }
  
  return user
}

export async function requireOrgAdmin(orgId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user is platform admin first
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (profile?.is_platform_admin) {
    return user
  }

  // Check org admin role
  let query = supabase
    .from('org_memberships')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['org_admin', 'platform_admin'])

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data: memberships } = await query

  if (!memberships || memberships.length === 0) {
    redirect('/home')
  }
  
  return user
}

export async function canAccessLocation(locationId: string, userId?: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const targetUserId = userId || user?.id
  
  if (!targetUserId) {
    return false
  }

  // Check if user is platform admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', targetUserId)
    .single()

  if (profile?.is_platform_admin) {
    return true
  }

  // Check if user has org admin role for the location's org
  const { data: location } = await supabase
    .from('locations')
    .select('org_id')
    .eq('id', locationId)
    .single()

  if (location) {
    const { data: membership } = await supabase
      .from('org_memberships')
      .select('role')
      .eq('user_id', targetUserId)
      .eq('org_id', location.org_id)
      .in('role', ['org_admin', 'platform_admin'])
      .single()

    if (membership) {
      return true
    }
  }

  // Check if user has location assignment
  const { data: assignment } = await supabase
    .from('location_assignments')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('location_id', locationId)
    .single()

  return !!assignment
}

export async function isOrgAdmin(orgId?: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  // Check if user is platform admin first
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  if (profile?.is_platform_admin) {
    return true
  }

  // Check org admin role
  let query = supabase
    .from('org_memberships')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['org_admin', 'platform_admin'])

  if (orgId) {
    query = query.eq('org_id', orgId)
  }

  const { data: memberships } = await query

  return memberships ? memberships.length > 0 : false
}

