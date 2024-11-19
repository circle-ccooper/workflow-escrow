-- migration_name: delete_smart_contracts_table
-- description: Deletes the "smart_contracts" table from the "public" schema

DO $$
BEGIN
  -- Check if the "smart_contracts" table exists in the "public" schema
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'smart_contracts'
  ) THEN
    -- Drop the "smart_contracts" table
    DROP TABLE public.smart_contracts;

    RAISE NOTICE 'Deleted smart_contracts table from public schema';
  ELSE
    RAISE NOTICE 'smart_contracts table does not exist in public schema';
  END IF;
END $$;
