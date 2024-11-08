-- migration_name: enable_realtime_for_transactions
-- description: Enables Realtime for the "transactions" table in the "public" schema

DO $$
BEGIN
  -- Check if the transactions table is already part of the supabase_realtime publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'transactions'
  ) THEN
    -- Add the transactions table to the supabase_realtime publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    RAISE NOTICE 'Added public.transactions to publication supabase_realtime';
  ELSE
    RAISE NOTICE 'public.transactions is already part of publication supabase_realtime';
  END IF;
END $$;
