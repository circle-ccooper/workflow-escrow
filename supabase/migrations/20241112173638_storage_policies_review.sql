-- migration_name: create_storage_policies_for_agreement_documents
-- description: Create storage policies for agreement-documents bucket
-- First, ensure the bucket exists (though it should already exist)
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
  )
VALUES (
    'agreement-documents',
    'agreement-documents',
    false,
    10485760,
    ARRAY ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
  ) ON CONFLICT (id) DO
UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
-- Create new policies
CREATE POLICY "Enable upload for authenticated users" ON storage.objects FOR
INSERT WITH CHECK (
    bucket_id = 'agreement-documents'
    AND auth.role() = 'authenticated'
  );
CREATE POLICY "Enable read for authenticated users" ON storage.objects FOR
SELECT USING (
    bucket_id = 'agreement-documents'
    AND auth.role() = 'authenticated'
  );
CREATE POLICY "Enable delete for authenticated users" ON storage.objects FOR DELETE USING (
  bucket_id = 'agreement-documents'
  AND auth.role() = 'authenticated'
);
CREATE POLICY "Enable update for authenticated users" ON storage.objects FOR
UPDATE USING (
    bucket_id = 'agreement-documents'
    AND auth.role() = 'authenticated'
  ) WITH CHECK (
    bucket_id = 'agreement-documents'
    AND auth.role() = 'authenticated'
  );