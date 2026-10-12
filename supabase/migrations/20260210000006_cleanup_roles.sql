-- Cleanup: Remove 'siswa' role from users who have other privileged roles
-- (admin, tu, guru, wali_kelas)
-- This fixes users who got 'siswa' by default during creation

DO $$
DECLARE
    r_siswa_id INT;
BEGIN
    -- Get Siswa Role ID
    SELECT id INTO r_siswa_id FROM public.roles WHERE name = 'siswa';

    IF r_siswa_id IS NOT NULL THEN
        -- Delete user_role 'siswa' IF the user has another role that is NOT 'siswa'
        -- Actually, we want to remove 'siswa' if they have 'admin', 'tu', 'guru', or 'wali_kelas'
        
        DELETE FROM public.user_roles ur
        WHERE role_id = r_siswa_id
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur2
            JOIN public.roles r2 ON ur2.role_id = r2.id
            WHERE ur2.user_id = ur.user_id
            AND r2.name IN ('admin', 'tu', 'guru', 'wali_kelas')
        );
        
        RAISE NOTICE 'Cleaned up redundant siswa roles';
    END IF;
END $$;
