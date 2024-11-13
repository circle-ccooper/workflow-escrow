-- migration_name: add_image_png_mime_type_to_agreement_documents
-- description: Adds 'image/png' to the allowed MIME types for the 'agreement-documents' storage bucket

DO $$
DECLARE
  v_bucket_exists boolean;
BEGIN
 -- Check if bucket exists
 SELECT EXISTS (
   SELECT 1 FROM storage.buckets WHERE id = 'agreement-documents'
 ) INTO v_bucket_exists;

 -- Log the operation
 RAISE NOTICE 'Bucket agreement-documents exists: %', v_bucket_exists;

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
    10485760,  -- 10MB limit
    ARRAY[
      'image/png',
      'image/jpeg',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
  ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types
    WHERE buckets.file_size_limit IS DISTINCT FROM EXCLUDED.file_size_limit
    OR buckets.allowed_mime_types IS DISTINCT FROM EXCLUDED.allowed_mime_types;

  RAISE NOTICE 'Bucket agreement-documents configuration updated';
END $$;
