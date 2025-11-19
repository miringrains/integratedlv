import { createClient } from '@/lib/supabase/client'

export async function uploadFile(
  file: File,
  bucket: string,
  folder: string,
  userId: string
): Promise<string> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${folder}/${userId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw error
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return publicUrl
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return uploadFile(file, 'user-avatars', userId, userId)
}

export async function uploadTicketAttachment(
  file: File,
  ticketId: string,
  userId: string
): Promise<string> {
  return uploadFile(file, 'ticket-attachments', ticketId, userId)
}

export async function uploadHardwarePhoto(
  file: File,
  hardwareId: string,
  userId: string
): Promise<string> {
  return uploadFile(file, 'hardware-photos', hardwareId, userId)
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw error
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient()
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return publicUrl
}

