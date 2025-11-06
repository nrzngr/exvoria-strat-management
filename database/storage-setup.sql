-- Supabase Storage Setup Script
-- Run this in your Supabase SQL editor to set up storage buckets and policies

-- Create storage buckets for different image types
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('map-thumbnails', 'map-thumbnails', true),
  ('strategy-images', 'strategy-images', true)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security (RLS) Policies
-- These policies allow public read access but require authentication for uploads

-- Map Thumbnails Bucket Policies
-- Allow public reads for map thumbnails
CREATE POLICY "Public map thumbnails are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'map-thumbnails');

-- Allow authenticated users to upload map thumbnails
CREATE POLICY "Authenticated users can upload map thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'map-thumbnails'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own map thumbnails
CREATE POLICY "Users can update own map thumbnails" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'map-thumbnails'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own map thumbnails
CREATE POLICY "Users can delete own map thumbnails" ON storage.objects
FOR DELETE USING (
  bucket_id = 'map-thumbnails'
  AND auth.role() = 'authenticated'
);

-- Strategy Images Bucket Policies
-- Allow public reads for strategy images
CREATE POLICY "Public strategy images are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'strategy-images');

-- Allow authenticated users to upload strategy images
CREATE POLICY "Authenticated users can upload strategy images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'strategy-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own strategy images
CREATE POLICY "Users can update own strategy images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'strategy-images'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own strategy images
CREATE POLICY "Users can delete own strategy images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'strategy-images'
  AND auth.role() = 'authenticated'
);

-- For this demo app without authentication, we can create more permissive policies
-- NOTE: In production, you should implement proper authentication

-- Allow anonymous uploads for map thumbnails (demo purposes only)
CREATE POLICY "Allow anonymous uploads to map thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'map-thumbnails'
);

-- Allow anonymous uploads for strategy images (demo purposes only)
CREATE POLICY "Allow anonymous uploads to strategy images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'strategy-images'
);

-- Allow anonymous updates for map thumbnails (demo purposes only)
CREATE POLICY "Allow anonymous updates to map thumbnails" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'map-thumbnails'
);

-- Allow anonymous updates for strategy images (demo purposes only)
CREATE POLICY "Allow anonymous updates to strategy images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'strategy-images'
);

-- Allow anonymous deletions for map thumbnails (demo purposes only)
CREATE POLICY "Allow anonymous deletions to map thumbnails" ON storage.objects
FOR DELETE USING (
  bucket_id = 'map-thumbnails'
);

-- Allow anonymous deletions for strategy images (demo purposes only)
CREATE POLICY "Allow anonymous deletions to strategy images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'strategy-images'
);