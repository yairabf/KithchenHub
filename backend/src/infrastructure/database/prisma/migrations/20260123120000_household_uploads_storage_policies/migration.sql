-- Stub for local/shadow DB: Supabase provides storage schema in production.
-- Prisma shadow DB and plain Postgres do not have it, so create when missing.
CREATE SCHEMA IF NOT EXISTS storage;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_accessed_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Create private bucket for household uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('household-uploads', 'household-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Ensure RLS is enabled for storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Read policy (SELECT)
CREATE POLICY "Household members can read their files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'household-uploads'
  AND (
    split_part(name, '/', 2) IN (
      SELECT household_id::text
      FROM users
      WHERE id = auth.uid()
    )
  )
);

-- Write policy (INSERT)
CREATE POLICY "Household members can upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'household-uploads'
  AND (
    split_part(name, '/', 2) IN (
      SELECT household_id::text
      FROM users
      WHERE id = auth.uid()
    )
  )
);

-- Update policy (optional but recommended)
CREATE POLICY "Household members can update their files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'household-uploads'
  AND (
    split_part(name, '/', 2) IN (
      SELECT household_id::text
      FROM users
      WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  bucket_id = 'household-uploads'
  AND (
    split_part(name, '/', 2) IN (
      SELECT household_id::text
      FROM users
      WHERE id = auth.uid()
    )
  )
);

-- Delete policy (optional)
CREATE POLICY "Household members can delete their files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'household-uploads'
  AND (
    split_part(name, '/', 2) IN (
      SELECT household_id::text
      FROM users
      WHERE id = auth.uid()
    )
  )
);
