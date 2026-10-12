-- ============================================
-- Restrict Jam Pelajaran to Admin Only
-- Remove 'tu' role access
-- ============================================

-- 1. Create a simplified, robust admin check function
-- This avoids any dependencies on other functions and uses auth.uid() directly
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = (current_setting('request.jwt.claim.sub', true)::uuid)
        AND r.name = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin_safe() TO anon, authenticated, service_role;

-- 2. Drop previous policy
DROP POLICY IF EXISTS "Enable write access for admin and tu" ON public.jam_pelajaran;

-- 3. Create new Admin-Only policy
CREATE POLICY "Enable write access for admin only" ON public.jam_pelajaran
    FOR ALL
    TO authenticated
    USING (public.is_admin_safe())
    WITH CHECK (public.is_admin_safe());
