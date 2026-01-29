-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid NOT NULL PRIMARY KEY,
    email character varying(255),
    role character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- Mock auth.uid() function
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
  SELECT '00000000-0000-0000-0000-000000000000'::uuid; 
$$ LANGUAGE sql;

-- Mock auth.jwt() function
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb AS $$
  SELECT '{"sub": "00000000-0000-0000-0000-000000000000", "role": "authenticated"}'::jsonb;
$$ LANGUAGE sql;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create storage schema
CREATE SCHEMA IF NOT EXISTS storage;

-- Create storage.buckets table
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

-- Create storage.objects table (also referenced by Supabase)
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
