import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Storage bucket names
export const STORAGE_BUCKETS = {
  MAP_THUMBNAILS: 'map-thumbnails',
  STRATEGY_IMAGES: 'strategy-images',
} as const