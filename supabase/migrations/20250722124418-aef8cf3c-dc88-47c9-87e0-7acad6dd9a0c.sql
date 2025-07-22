-- Criar usuário admin via signup simulation
-- Como não podemos inserir diretamente na auth.users, vamos usar a função signUp
-- Primeiro, vamos garantir que o perfil admin exista
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Verificar se já existe um perfil admin
    SELECT user_id INTO admin_user_id 
    FROM profiles 
    WHERE email = 'alanwe650@gmail.com' AND role = 'admin' 
    LIMIT 1;
    
    -- Se não existir, criar um UUID placeholder para o admin
    IF admin_user_id IS NULL THEN
        admin_user_id := gen_random_uuid();
        
        INSERT INTO profiles (user_id, email, full_name, role, is_active) 
        VALUES (
            admin_user_id,
            'alanwe650@gmail.com',
            'Admin User',
            'admin',
            true
        );
    END IF;
    
    -- Atualizar para garantir que está ativo
    UPDATE profiles 
    SET is_active = true, role = 'admin'
    WHERE email = 'alanwe650@gmail.com';
END $$;