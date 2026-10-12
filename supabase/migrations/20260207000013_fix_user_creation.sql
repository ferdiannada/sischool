-- Ensure roles exist (idempotent)
-- Use explicit IDs to match seed.sql expectations
INSERT INTO public.roles (id, name, description) VALUES
    (1, 'admin', 'Administrator sistem dengan akses penuh'),
    (2, 'tu', 'Tata Usaha - mengelola administrasi sekolah'),
    (3, 'guru', 'Guru mata pelajaran'),
    (4, 'wali_kelas', 'Wali kelas - guru yang bertanggung jawab atas kelas'),
    (5, 'siswa', 'Siswa/Pelajar'),
    (6, 'wali_murid', 'Orang tua/Wali dari siswa'),
    (7, 'ketua_kelas', 'Ketua kelas - siswa yang dipilih sebagai pemimpin kelas')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Also update by name if IDs differ (just in case)
-- Actually, ON CONFLICT (id) handles it.

-- Reset sequence
SELECT setval('public.roles_id_seq', (SELECT MAX(id) FROM public.roles));

-- Re-define handle_new_user just to be 100% sure it matches latest logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role text := 'siswa';
    assigned_role text;
    role_id_val int;
BEGIN
    RAISE NOTICE 'Handling new user: %', NEW.email;

    -- Check if metadata exists, if not use empty object
    IF NEW.raw_user_meta_data IS NULL THEN
        NEW.raw_user_meta_data := '{}'::jsonb;
    END IF;

    -- Extract role from metadata or use default
    assigned_role := COALESCE(
        NEW.raw_user_meta_data->>'primaryRole',
        NEW.raw_user_meta_data->'roles'->>0,
        default_role
    );

    RAISE NOTICE 'Assigned Role: %', assigned_role;

    -- 1. Create Public Profile
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;

    -- 2. Assign Role in public.user_roles
    SELECT id INTO role_id_val FROM public.roles WHERE name = assigned_role;
    
    IF role_id_val IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, role_id_val)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    ELSE
        RAISE NOTICE 'Role % not found in public.roles', assigned_role;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
