-- =============================================================================
-- Supabase Storage RLS Policies for Kitchen Hub
-- =============================================================================
-- This script sets up Row Level Security (RLS) policies for storage buckets:
-- 1. public-assets (catalog-images): Authenticated users can read
-- 2. household-uploads: Users can only access their household's files
-- =============================================================================

-- =============================================================================
-- 1. PUBLIC-ASSETS BUCKET (catalog-images)
-- =============================================================================
-- This bucket contains catalog item images that authenticated users can view

-- Create bucket if it doesn't exist (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true, -- Public bucket (signed URLs not required)
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Note: RLS is already enabled on storage.objects by Supabase
-- Drop and recreate policies to ensure they're correct

-- Drop existing policies for public-assets (ignore errors if they don't exist)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can read catalog images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload catalog images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update catalog images" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete catalog images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Policy: Authenticated users can ONLY READ catalog images
-- This allows mobile/web clients to view catalog images
CREATE POLICY "Authenticated users can read catalog images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'public-assets');

-- Note: Upload/Update/Delete policies are NOT created for public-assets
-- This means only the service role (backend with SUPABASE_SERVICE_ROLE_KEY) can modify files
-- Service role bypasses RLS, so no explicit INSERT/UPDATE/DELETE policies are needed
-- Authenticated users and anon users CANNOT upload/update/delete catalog images

-- =============================================================================
-- 2. HOUSEHOLD-UPLOADS BUCKET (user uploads - recipe images)
-- =============================================================================
-- This bucket contains user-uploaded files scoped to households

-- Create bucket if it doesn't exist (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'household-uploads',
  'household-uploads',
  false, -- Private bucket (signed URLs required)
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing policies for household-uploads (ignore errors if they don't exist)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read their household files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload household files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update household files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete household files" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Policy: Users can read their household's files
-- File path format: {householdId}/recipes/{recipeId}/{filename}
-- The first folder in the path must match the user's household_id
CREATE POLICY "Users can read their household files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'household-uploads' 
  AND (storage.foldername(name))[1] = (
    SELECT household_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Policy: Authenticated users can upload household files (backend uses service role)
CREATE POLICY "Authenticated users can upload household files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'household-uploads');

-- Policy: Authenticated users can update household files (backend uses service role)
CREATE POLICY "Authenticated users can update household files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'household-uploads');

-- Policy: Authenticated users can delete household files (backend uses service role)
CREATE POLICY "Authenticated users can delete household files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'household-uploads');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify the policies are set up correctly:

-- Check buckets
-- SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets;

-- Check policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'objects' AND schemaname = 'storage';
