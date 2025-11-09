import { supabase, STORAGE_BUCKETS } from './supabase'

export interface UploadResult {
  path: string
  fullPath: string
  url: string
}

export async function uploadImage(
  file: File,
  bucket: keyof typeof STORAGE_BUCKETS,
  folder?: string
): Promise<UploadResult> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your environment variables.')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw error
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    path: data.path,
    fullPath: `${bucket}/${data.path}`,
    url: publicUrl,
  }
}

export async function deleteImage(
  path: string,
  bucket: keyof typeof STORAGE_BUCKETS
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your environment variables.')
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) throw error
}

export async function getImageUrl(
  path: string,
  bucket: keyof typeof STORAGE_BUCKETS
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check your environment variables.')
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}