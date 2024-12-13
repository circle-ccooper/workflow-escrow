ALTER TABLE profiles ADD COLUMN company_name TEXT;
COMMENT ON COLUMN profiles.company_name IS 'Optional company name for the profile';