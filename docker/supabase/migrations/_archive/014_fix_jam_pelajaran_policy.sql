-- ============================================
-- Fix Jam Pelajaran Policies
-- Use SECURITY DEFINER function to safely check roles
-- ============================================

-- 1. Create generic has_role function (if not exists or update)
CREATE OR REPLACE FUNCTION public.has_role(target_role text)
RETURNS BOOLEAN AS $$
DECLARE
    curr_uid UUID;
BEGIN
    -- Use the helper from 010 if available, else fallback
    BEGIN
        curr_uid := public.current_user_id();
    EXCEPTION WHEN OTHERS THEN
        curr_uid := auth.uid();
    END;

    IF curr_uid IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = curr_uid
        AND r.name = target_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to everyone
GRANT EXECUTE ON FUNCTION public.has_role(text) TO anon, authenticated, service_role;

-- 2. Update Policy on jam_pelajaran
DROP POLICY IF EXISTS "Enable write access for admin and tu" ON public.jam_pelajaran;

CREATE POLICY "Enable write access for admin and tu" ON public.jam_pelajaran
    FOR ALL
    TO authenticated
    USING (public.has_role('admin') OR public.has_role('tu'))
    WITH CHECK (public.has_role('admin') OR public.has_role('tu'));
