-- Fix authentication system issues
-- This script corrects the users table structure and RLS policies

-- First, update the users table to properly handle Supabase Auth IDs
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Drop existing RLS policies that are too restrictive
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create more appropriate RLS policies
CREATE POLICY "Enable read access for authenticated users" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on id" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable delete for users based on id" ON users FOR DELETE USING (auth.uid() = id);

-- Allow service role to bypass RLS for admin operations
CREATE POLICY "Service role can manage all users" ON users FOR ALL USING (auth.role() = 'service_role');

-- Create a function to handle user creation after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile after auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert super admin directly (this will work even if auth user doesn't exist yet)
INSERT INTO users (id, email, name, role, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'superadmin@translateevent.com',
  'Super Administrador',
  'SUPER_ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'SUPER_ADMIN',
  name = 'Super Administrador',
  updated_at = NOW();
