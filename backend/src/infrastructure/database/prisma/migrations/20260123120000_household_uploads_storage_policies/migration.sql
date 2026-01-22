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
