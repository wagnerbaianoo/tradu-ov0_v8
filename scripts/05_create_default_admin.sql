-- Create Default Admin User for TranslateEvent V5
-- This script creates a default admin user for initial system access

-- Insert default admin user
-- Note: This user will need to set their password through Supabase Auth
INSERT INTO users (
  id,
  email,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@translateevent.com',
  'Administrador do Sistema',
  'SUPER_ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'SUPER_ADMIN',
  updated_at = NOW();

-- Insert additional admin users if needed
INSERT INTO users (
  id,
  email,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'tradutor@translateevent.com',
  'Tradutor Principal',
  'TRANSLATOR',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Log the admin creation
SELECT log_system_event('info', 'Usuários padrão criados para acesso inicial ao sistema');

-- Display created users
SELECT 
  email,
  name,
  role,
  created_at
FROM users 
WHERE email IN ('admin@translateevent.com', 'tradutor@translateevent.com');
