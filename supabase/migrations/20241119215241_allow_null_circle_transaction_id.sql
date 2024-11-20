-- migration_name: allow_null_circle_transaction_id
-- description: Allows the "circle_transaction_id" column in the "transactions" table to be nullable.

DO $$
BEGIN
  -- Check if the "circle_transaction_id" column is already nullable
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'circle_transaction_id'
      AND is_nullable = 'NO'
  ) THEN
    -- Alter the "circle_transaction_id" column to allow NULL values
    ALTER TABLE public.transactions
    ALTER COLUMN circle_transaction_id DROP NOT NULL;

    RAISE NOTICE 'Updated "circle_transaction_id" column to allow NULL values';
  ELSE
    RAISE NOTICE '"circle_transaction_id" column is already nullable';
  END IF;
END $$;
