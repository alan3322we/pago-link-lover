-- Atualizar o perfil existente para garantir acesso admin
UPDATE profiles 
SET 
  role = 'admin',
  is_active = true,
  full_name = 'Admin User',
  updated_at = now()
WHERE email = 'alanwe650@gmail.com';