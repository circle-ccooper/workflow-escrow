-- migration_name: add_email_to_profiles
-- description: Adds a new column "email" to the "profiles" table in the "public" schema

DO $$
BEGIN
  -- Check if the column "email" already exists in the "profiles" table
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'email'
  ) THEN
    -- Add the "email" column to the "profiles" table
    ALTER TABLE public.profiles
    ADD COLUMN email varchar(320);

    RAISE NOTICE 'Added email column to profiles table';
  ELSE
    RAISE NOTICE 'email column already exists in profiles table';
  END IF;
END $$;
