import { createClient } from '@/lib/supabase/server'
import type { Hardware, HardwareWithRelations } from '@/types/database'

export async function getHardware(filters?: {
  locationId?: string
  status?: string
  search?: string
}): Promise<Hardware[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('hardware')
    .select('*')

  if (filters?.locationId) {
    query = query.eq('location_id', filters.locationId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,hardware_type.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getHardwareWithLocation(id: string): Promise<HardwareWithRelations | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('hardware')
    .select(`
      *,
      location:locations (*)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as any
}

export async function createHardware(hardware: Omit<Hardware, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('hardware')
    .insert(hardware)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateHardware(id: string, updates: Partial<Hardware>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('hardware')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteHardware(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('hardware')
    .delete()
    .eq('id', id)

  if (error) throw error
}

