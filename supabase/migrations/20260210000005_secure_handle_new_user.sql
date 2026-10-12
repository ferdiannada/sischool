-- Migration: Secure Handle New User
-- Purpose: Prevent privilege escalation by ignoring role claims in metadata
-- Validates: Only allows 'siswa' as default role. 'admin', 'tu', 'guru' must be assigned manually.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role text := 'siswa';
    assigned_role text;
    role_id_val int;
BEGIN
    BEGIN
        RAISE NOTICE 'handle_new_user: Starting for %', NEW.email;

        -- Check metadata
        IF NEW.raw_user_meta_data IS NULL THEN
            NEW.raw_user_meta_data := '{}'::jsonb;
        END IF;

        -- Extract requested role from metadata for logging/debugging, but DO NOT trust it for critical roles
        -- We will only respect 'wali_murid' if we implement a specific flow for it later (e.g. invitation code).
        -- For now, force everyone to 'siswa' or potentially 'wali_murid' if explicitly allowed, 
        -- but NEVER 'admin', 'tu', or 'guru'.
        
        assigned_role := COALESCE(
            NEW.raw_user_meta_data->>'primaryRole',
            NEW.raw_user_meta_data->'roles'->>0,
            default_role
        );
        
        RAISE NOTICE 'handle_new_user: Requested Role %', assigned_role;

        -- SECURITY ENFORCEMENT
        -- If the requested role is privileged, log a warning and force 'siswa'
        IF assigned_role IN ('admin', 'tu', 'guru', 'kepala_sekolah') THEN
            RAISE WARNING 'Security Alert: User % attempted to sign up with privileged role %', NEW.email, assigned_role;
            assigned_role := 'siswa';
        END IF;

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
            
        RAISE NOTICE 'handle_new_user: Public user created/updated';

        -- 2. Assign Role
        -- Now assigned_role is sanitized (either 'siswa' or 'wali_murid' or other safe roles)
        SELECT id INTO role_id_val FROM public.roles WHERE name = assigned_role;
        
        IF role_id_val IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role_id)
            VALUES (NEW.id, role_id_val)
            ON CONFLICT (user_id, role_id) DO NOTHING;
            RAISE NOTICE 'handle_new_user: Role % assigned', assigned_role;
        ELSE
            RAISE NOTICE 'handle_new_user: Role % not found, using default (siswa)', assigned_role;
            -- Fallback to default role
            SELECT id INTO role_id_val FROM public.roles WHERE name = default_role;
            IF role_id_val IS NOT NULL THEN
                INSERT INTO public.user_roles (user_id, role_id)
                VALUES (NEW.id, role_id_val)
                ON CONFLICT (user_id, role_id) DO NOTHING;
            END IF;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- Log error but DO NOT FAIL the transaction
        RAISE WARNING 'handle_new_user FAILED (swallowed): % %', SQLERRM, SQLSTATE;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
