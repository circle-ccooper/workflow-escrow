-- migration_name: adjust_storage_policies_for_agreement_documents_with_temp
-- description: Update storage policies to handle temporary file uploads for agreements
BEGIN;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE 
  policy_name text;
  v_count int := 0;
BEGIN 
  -- Count existing policies for logging
  SELECT COUNT(*) INTO v_count
  FROM pg_policies 
  WHERE tablename = 'objects' AND schemaname = 'storage';

  RAISE NOTICE 'Found % policies to remove', v_count;

  FOR policy_name IN (
    SELECT pol.policyname
    FROM pg_policies pol
    WHERE pol.tablename = 'objects' AND pol.schemaname = 'storage'
  ) LOOP
    RAISE NOTICE 'Dropping policy: %', policy_name;
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to clean up policies: %', SQLERRM;
END $$;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
COMMIT;
-- Create new simplified policies
-- Policy for uploads (both temp and final locations)
CREATE POLICY "Enable upload for authenticated users" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'agreement-documents'
        AND auth.role() = 'authenticated'
    );
-- Policy for reading files
CREATE POLICY "Enable read for authenticated users" ON storage.objects FOR
SELECT USING (
        bucket_id = 'agreement-documents'
        AND auth.role() = 'authenticated'
    );
-- Policy for deleting temp files
CREATE POLICY "Enable delete for authenticated users" ON storage.objects FOR DELETE USING (
    bucket_id = 'agreement-documents'
    AND auth.role() = 'authenticated'
);
-- Policy for updates
CREATE POLICY "Enable update for authenticated users" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'agreement-documents'
        AND auth.role() = 'authenticated'
    ) WITH CHECK (
        bucket_id = 'agreement-documents'
        AND auth.role() = 'authenticated'
    );
-- Verify the agreement-documents bucket exists
DO $$ BEGIN
INSERT INTO storage.buckets (id, name, public)
VALUES (
        'agreement-documents',
        'agreement-documents',
        false
    ) ON CONFLICT (id) DO NOTHING;
END $$;