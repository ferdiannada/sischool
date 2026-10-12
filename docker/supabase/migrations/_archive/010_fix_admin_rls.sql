-- ============================================
-- School AI Database Migration
-- Version: 010.1 - Fix Admin RLS Policies (Safe)
-- ============================================

-- Helper function to get current user ID safely
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
BEGIN
    -- Try to get from request.jwt.claim.sub (PostgREST)
    BEGIN
        RETURN current_setting('request.jwt.claim.sub', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create a helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    curr_uid UUID;
BEGIN
    curr_uid := public.current_user_id();
    IF curr_uid IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = curr_uid
        AND r.name = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_id() TO anon, authenticated, service_role;

-- Add policies for Admin on users table
DROP POLICY IF EXISTS admin_all_users ON public.users;
CREATE POLICY admin_all_users ON public.users
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Add policies for Admin on other tables (just in case)
DROP POLICY IF EXISTS admin_all_siswa ON public.siswa;
CREATE POLICY admin_all_siswa ON public.siswa
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_all_guru ON public.guru;
CREATE POLICY admin_all_guru ON public.guru
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Also need to allow inserting into user_roles for admins
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_user_roles ON public.user_roles;
CREATE POLICY admin_all_user_roles ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Allow reading user roles for self
DROP POLICY IF EXISTS read_own_user_roles ON public.user_roles;
CREATE POLICY read_own_user_roles ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = public.current_user_id());

-- Allow service role full access
DROP POLICY IF EXISTS service_role_all_user_roles ON public.user_roles;
CREATE POLICY service_role_all_user_roles ON public.user_roles
    FOR ALL
    TO service_role
    USING (true);
