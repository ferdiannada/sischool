-- Wrap handle_new_user in exception block to prevent blocking auth user creation
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

        -- Extract role
        assigned_role := COALESCE(
            NEW.raw_user_meta_data->>'primaryRole',
            NEW.raw_user_meta_data->'roles'->>0,
            default_role
        );
        
        RAISE NOTICE 'handle_new_user: Assigned Role %', assigned_role;

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
        SELECT id INTO role_id_val FROM public.roles WHERE name = assigned_role;
        
        IF role_id_val IS NOT NULL THEN
            INSERT INTO public.user_roles (user_id, role_id)
            VALUES (NEW.id, role_id_val)
            ON CONFLICT (user_id, role_id) DO NOTHING;
            RAISE NOTICE 'handle_new_user: Role assigned';
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
