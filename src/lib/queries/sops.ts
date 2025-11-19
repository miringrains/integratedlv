import { createClient } from '@/lib/supabase/server'
import type { SOP } from '@/types/database'

export async function getSOPs(filters?: {
  orgId?: string
  hardwareType?: string
  search?: string
  isActive?: boolean
}): Promise<SOP[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('sops')
    .select('*')

  if (filters?.orgId) {
    query = query.eq('org_id', filters.orgId)
  }

  if (filters?.hardwareType) {
    query = query.eq('hardware_type', filters.hardwareType)
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getSOPById(id: string): Promise<SOP | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sops')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getSOPsForHardware(hardwareId: string): Promise<SOP[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('hardware_sops')
    .select(`
      sop_id,
      sops (*)
    `)
    .eq('hardware_id', hardwareId)

  if (error) throw error
  
  return data?.map((item: any) => item.sops).filter(Boolean) || []
}

export async function createSOP(sop: Omit<SOP, 'id' | 'created_at' | 'updated_at' | 'version'>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sops')
    .insert(sop)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSOP(id: string, updates: Partial<SOP>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sops')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSOP(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('sops')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function associateSOPWithHardware(sopId: string, hardwareId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('hardware_sops')
    .insert({
      sop_id: sopId,
      hardware_id: hardwareId,
    })

  if (error) throw error
}

export async function dissociateSOPFromHardware(sopId: string, hardwareId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('hardware_sops')
    .delete()
    .eq('sop_id', sopId)
    .eq('hardware_id', hardwareId)

  if (error) throw error
}

export async function getHardwareForSOP(sopId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('hardware_sops')
    .select(`
      hardware_id,
      hardware (*)
    `)
    .eq('sop_id', sopId)

  if (error) throw error
  
  return data?.map((item: any) => item.hardware).filter(Boolean) || []
}

