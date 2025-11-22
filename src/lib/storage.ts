import { createClient as createClientBrowser } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Server-side upload function (bypasses RLS with service role)
export async function uploadFileServer(
  file: File,
  bucket: string,
  folder: string,
  userId: string
): Promise<string> {
  const supabase = await createServerClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${folder}/${userId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw error
  }

  // For private buckets, generate a signed URL (valid for 1 year)
  // For public buckets, use public URL
  if (bucket === 'ticket-attachments') {
    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 31536000) // 1 year in seconds
    
    return signedData?.signedUrl || ''
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return publicUrl
}

// Client-side upload function (for browser uploads)
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string,
  userId: string
): Promise<string> {
  const supabase = createClientBrowser()
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

export async function uploadTicketAttachmentServer(
  file: File,
  ticketId: string,
  userId: string
): Promise<string> {
  return uploadFileServer(file, 'ticket-attachments', ticketId, userId)
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
  const supabase = createClientBrowser()
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw error
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClientBrowser()
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return publicUrl
}
