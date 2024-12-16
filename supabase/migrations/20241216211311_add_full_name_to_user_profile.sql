-- migration_name: add_full_name_to_profiles
-- description: Adds a new column "full_name" to the "profiles" table in the "public" schema
DO $$ BEGIN -- Check if the column "full_name" already exists in the "profiles" table
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'full_name'
) THEN -- Add the "full_name" column to the "profiles" table
ALTER TABLE public.profiles
ADD COLUMN full_name varchar(255);
RAISE NOTICE 'Added full_name column to profiles table';
ELSE RAISE NOTICE 'full_name column already exists in profiles table';
END IF;
END $$;