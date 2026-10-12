-- Drop existing trigger if it exists (to ensure we re-create it correctly)
-- We need to check if it exists to avoid error, or just use DROP IF EXISTS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Re-define handle_new_user with STRICT search_path and exception handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role text := 'siswa';
    assigned_role text;
    role_id_val int;
BEGIN
    RAISE NOTICE 'handle_new_user: Starting for %', NEW.email;

    -- Check metadata
    IF NEW.raw_user_meta_data IS NULL THEN
        NEW.raw_user_meta_data := '{}'::jsonb;
    END IF;

    -- Extract role
    assigned_role := COALESCE(
        NEW.raw_user_meta_data->>'primaryRole',
        NEW.raw_user_meta_data->'roles'->>0,
        default_role
    );
    
    RAISE NOTICE 'handle_new_user: Assigned Role %', assigned_role;

    -- 1. Create Public Profile
    -- Use specific columns to avoid issues with extra columns
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
    SELECT id INTO role_id_val FROM public.roles WHERE name = assigned_role;
    
    IF role_id_val IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, role_id_val)
        ON CONFLICT (user_id, role_id) DO NOTHING;
        RAISE NOTICE 'handle_new_user: Role assigned';
    ELSE
        RAISE NOTICE 'handle_new_user: Role % not found, using default (siswa)', assigned_role;
        -- Fallback to default role if specific role not found (safety net)
        SELECT id INTO role_id_val FROM public.roles WHERE name = default_role;
        IF role_id_val IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role_id)
            VALUES (NEW.id, role_id_val)
            ON CONFLICT (user_id, role_id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Capture error and modify message to be visible in client if possible
    RAISE EXCEPTION 'User creation failed in trigger: % %', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
