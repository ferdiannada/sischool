-- ============================================
-- Verify User Password Function
-- For mock authentication
-- ============================================

CREATE OR REPLACE FUNCTION verify_user_password(user_email VARCHAR, user_password VARCHAR)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    full_name VARCHAR,
    phone VARCHAR,
    avatar_url TEXT,
    roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.avatar_url,
        ARRAY_AGG(r.name) as roles
    FROM public.users u
    LEFT JOIN public.user_roles ur ON u.id = ur.user_id
    LEFT JOIN public.roles r ON ur.role_id = r.id
    WHERE u.email = user_email
      AND u.is_active = true
      AND u.password_hash = crypt(user_password, u.password_hash)
    GROUP BY u.id, u.email, u.full_name, u.phone, u.avatar_url;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_user_password(VARCHAR, VARCHAR) TO anon, authenticated;
