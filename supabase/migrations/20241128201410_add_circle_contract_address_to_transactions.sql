-- migration_name: add_circle_contract_address_to_transactions
-- description: Adds a "circle_contract_address" column to the "transactions" table in the "public" schema

DO $$
BEGIN
  -- Check if the "circle_contract_address" column already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'circle_contract_address'
  ) THEN
    -- Add the "circle_contract_address" column to the "transactions" table
    ALTER TABLE public.transactions
    ADD COLUMN circle_contract_address VARCHAR;
    RAISE NOTICE 'Added column "circle_contract_address" to table "public.transactions"';
  ELSE
    RAISE NOTICE 'Column "circle_contract_address" already exists in table "public.transactions"';
  END IF;
END $$;
