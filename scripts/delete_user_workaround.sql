-- URGENSI: Gunakan script ini jika "Delete User" di Supabase Studio error.
-- CARA PAKAI:
-- 1. Ganti variable 'v_email_todelete' dengan email user yang mau dihapus.
-- 2. Run script ini di SQL Editor.

DO $$
DECLARE
    v_email_todelete text := 'siswa_baru@sekolah.id'; -- Ganti dengan email target
    v_user_record record;
BEGIN
    SELECT * INTO v_user_record FROM auth.users WHERE email = v_email_todelete LIMIT 1;

    IF v_user_record.id IS NULL THEN
        RAISE NOTICE 'User dengan email % tidak ditemukan.', v_email_todelete;
        RETURN;
    END IF;

    RAISE NOTICE 'Menghapus user: % (ID: %)', v_email_todelete, v_user_record.id;

    -- Delete from auth.users (Cascade will handle public.users, etc.)
    DELETE FROM auth.users WHERE id = v_user_record.id;

    RAISE NOTICE 'SUCCESS: User % berhasil dihapus.', v_email_todelete;
END $$;
