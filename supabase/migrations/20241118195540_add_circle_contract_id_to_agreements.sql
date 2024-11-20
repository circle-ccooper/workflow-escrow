-- migration_name: add_circle_contract_id_to_escrow_agreements
-- description: Adds a new column "circle_contract_id" to the "escrow_agreements" table in the "public" schema

DO $$
BEGIN
  -- Check if the column "circle_contract_id" already exists in the "escrow_agreements" table
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'escrow_agreements'
      AND column_name = 'circle_contract_id'
  ) THEN
    -- Add the "circle_contract_id" column to the "escrow_agreements" table
    ALTER TABLE public.escrow_agreements
    ADD COLUMN circle_contract_id uuid;

    RAISE NOTICE 'Added circle_contract_id column to escrow_agreements table';
  ELSE
    RAISE NOTICE 'circle_contract_id column already exists in escrow_agreements table';
  END IF;
END $$;
