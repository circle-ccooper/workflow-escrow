-- First, we need to drop the existing unique constraint which includes the foreign key
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_auth_user_id_key;

-- Then drop the foreign key constraint itself
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_auth_user_id_fkey;

-- Add back the foreign key constraint with ON DELETE CASCADE
ALTER TABLE profiles
ADD CONSTRAINT profiles_auth_user_id_fkey 
    FOREIGN KEY (auth_user_id) 
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Re-add the unique constraint
ALTER TABLE profiles
ADD CONSTRAINT profiles_auth_user_id_key 
    UNIQUE (auth_user_id);

-- Add comment to document the change
COMMENT ON CONSTRAINT profiles_auth_user_id_fkey ON profiles IS 'Foreign key reference to auth.users table with CASCADE DELETE enabled';