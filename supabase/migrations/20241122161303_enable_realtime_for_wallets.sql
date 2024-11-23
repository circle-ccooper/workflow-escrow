-- migration_name: enable_realtime_for_wallets
-- description: Enables Realtime for the "wallets" table in the "public" schema

DO $$
BEGIN
  -- Check if the wallets table is already part of the supabase_realtime publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'wallets'
  ) THEN
    -- Add the wallets table to the supabase_realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
    RAISE NOTICE 'Added public.wallets to publication supabase_realtime';
  ELSE
    RAISE NOTICE 'public.wallets is already part of publication supabase_realtime';
  END IF;
END $$;
