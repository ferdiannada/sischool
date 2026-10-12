-- URGENSI: Gunakan script ini jika "Add User" di Supabase Studio error.
-- CARA PAKAI:
-- 1. Ganti nilai di bagian "CONFIGURATION" di bawah.
-- 2. Run script ini di SQL Editor.

DO $$
DECLARE
    -- ========================================================
    -- CONFIGURATION (GANTI BAGIAN INI)
    -- ========================================================
    v_email text := 'siswa_baru@sekolah.id';       -- Email user baru
    v_password text := 'Password123!';             -- Password user
    v_full_name text := 'Nama Siswa Baru';         -- Nama Lengkap
    v_role text := 'siswa';                        -- Role: 'siswa', 'guru', 'tu', 'wali_murid'
    -- ========================================================

    v_user_id uuid := gen_random_uuid();
    v_encrypted_pw text;
BEGIN
    -- 1. Hash Password (menggunakan crypt bf, default supabase)
    v_encrypted_pw := crypt(v_password, gen_salt('bf'));

    RAISE NOTICE 'Creating user: % (%)', v_full_name, v_email;

    -- 2. Insert ke auth.users
    -- Trigger 'on_auth_user_created' akan otomatis:
    --   a. Membuat entry di public.users
    --   b. Assign role di public.user_roles
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_token,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_sent_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        v_encrypted_pw,
        now(), -- Email confirmed automatically
        '',
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('full_name', v_full_name, 'primaryRole', v_role),
        now(),
        now(),
        '',
        '',
        '',
        NULL
    );

    RAISE NOTICE 'SUCCESS! User created with ID: %', v_user_id;
END $$;
