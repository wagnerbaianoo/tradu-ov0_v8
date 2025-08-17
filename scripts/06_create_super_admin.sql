-- Criar usuário super admin padrão
-- Este script deve ser executado após a configuração inicial do Supabase

-- Inserir usuário super admin na tabela users
INSERT INTO users (
  id,
  email,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- UUID fixo para super admin
  'superadmin@translateevent.com',
  'Super Administrador',
  'SUPER_ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'SUPER_ADMIN',
  name = 'Super Administrador',
  updated_at = NOW();

-- Comentário: Após executar este script, você deve:
-- 1. Ir ao painel Supabase Auth (Authentication > Users)
-- 2. Criar um usuário com email: superadmin@translateevent.com
-- 3. Definir a senha: TranslateEvent2024!
-- 4. O sistema reconhecerá automaticamente o role SUPER_ADMIN
