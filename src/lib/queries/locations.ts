import { createClient } from '@/lib/supabase/server'
import type { Location, LocationWithDetails } from '@/types/database'

export async function getLocations(): Promise<LocationWithDetails[]> {
  const supabase = await createClient()
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error

  // Get counts for each location
  const locationsWithCounts = await Promise.all(
    (locations || []).map(async (location) => {
      const { count: hardwareCount } = await supabase
        .from('hardware')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', location.id)

      const { count: openTicketsCount } = await supabase
        .from('care_log_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', location.id)
        .eq('status', 'open')

      return {
        ...location,
        hardware_count: hardwareCount || 0,
        open_tickets_count: openTicketsCount || 0,
      }
    })
  )

  return locationsWithCounts
}

export async function getLocation(id: string): Promise<Location | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createLocation(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('locations')
    .insert(location)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLocation(id: string, updates: Partial<Location>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLocation(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

