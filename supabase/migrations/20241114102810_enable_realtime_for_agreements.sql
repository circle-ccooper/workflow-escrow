-- migration_name: enable_realtime_for_agreements
-- description: Enables Realtime for the "escrow_agreements" table in the "public" schema

DO $$
BEGIN
  -- Check if the escrow_agreements table is already part of the supabase_realtime publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'escrow_agreements'
  ) THEN
    -- Add the escrow_agreements table to the supabase_realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_agreements;
    RAISE NOTICE 'Added public.escrow_agreements to publication supabase_realtime';
  ELSE
    RAISE NOTICE 'public.escrow_agreements is already part of publication supabase_realtime';
  END IF;
END $$;
