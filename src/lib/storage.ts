import { createClient as createClientBrowser } from '@/lib/supabase/client'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Server-side upload function (bypasses RLS with service role)
export async function uploadFileServer(
  file: File,
  bucket: string,
  folder: string,
  userId: string
): Promise<string> {
  const supabase = createServiceRoleClient()
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
    
    // Provide more helpful error messages
    if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
      throw new Error(`Storage bucket "${bucket}" not found. Please create it in Supabase Dashboard → Storage.`)
    }
    
    if (error.message.includes('The resource already exists')) {
      // Retry with a slightly different filename
      const retryFileName = `${folder}/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: retryData, error: retryError } = await supabase.storage
        .from(bucket)
        .upload(retryFileName, file, {
          cacheControl: '3600',
          upsert: false,
        })
      
      if (retryError) {
        throw new Error(`Upload failed: ${retryError.message}`)
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(retryFileName)
      return publicUrl
    }
    
    // Handle file size errors
    if (error.message.includes('File size') || error.message.includes('too large')) {
      throw new Error(`File too large. Maximum size is 10MB.`)
    }
    
    // Handle permission errors (shouldn't happen with service role, but just in case)
    if (error.message.includes('permission') || error.message.includes('denied')) {
      throw new Error(`Permission denied: ${error.message}`)
    }
    
    throw new Error(`Upload failed: ${error.message}`)
  }

  // For private buckets, generate signed URLs (valid for 1 year)
  // This allows the URL to be stored in the database and used directly
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(fileName, 31536000) // 1 year expiration
  
  if (signedUrlError || !signedUrlData?.signedUrl) {
    console.error('Failed to generate signed URL:', signedUrlError)
    throw new Error('Failed to generate signed URL for uploaded file')
  }
  
  return signedUrlData.signedUrl
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

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('Failed to list buckets:', listError)
    throw new Error(`Storage error: ${listError.message}`)
  }

  const bucketExists = buckets?.some(b => b.name === bucket)
  if (!bucketExists) {
    console.error(`Bucket "${bucket}" does not exist. Available buckets:`, buckets?.map(b => b.name))
    throw new Error(`Storage bucket "${bucket}" does not exist. Please create it in Supabase Dashboard → Storage.`)
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    // Provide more helpful error messages
    if (error.message.includes('Bucket not found')) {
      throw new Error(`Storage bucket "${bucket}" not found. Please create it in Supabase Dashboard → Storage.`)
    }
    if (error.message.includes('The resource already exists')) {
      // Retry with a slightly different filename
      const retryFileName = `${folder}/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const { data: retryData, error: retryError } = await supabase.storage
        .from(bucket)
        .upload(retryFileName, file, {
          cacheControl: '3600',
          upsert: false,
        })
      
      if (retryError) {
        throw new Error(`Upload failed: ${retryError.message}`)
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(retryFileName)
      return publicUrl
    }
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  if (!publicUrl) {
    throw new Error('Failed to get public URL for uploaded file')
  }

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

/**
 * Generate a signed URL for a private storage file
 * Use this when displaying files from private buckets
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string | null> {
  const supabase = createClientBrowser()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  
  if (error || !data?.signedUrl) {
    console.error('Failed to generate signed URL:', error)
    return null
  }
  
  return data.signedUrl
}
