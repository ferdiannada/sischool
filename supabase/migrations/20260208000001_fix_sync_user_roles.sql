-- Fix sync_user_roles_to_metadata to be more robust
-- This fixes the issue where creating a user fails because this trigger fails
-- when trying to update auth.users metadata

CREATE OR REPLACE FUNCTION public.sync_user_roles_to_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_id uuid;
    _roles text[];
    _primary_role text;
BEGIN
    -- Determine user_id based on operation
    IF (TG_OP = 'DELETE') THEN
        _user_id := OLD.user_id;
    ELSE
        _user_id := NEW.user_id;
    END IF;

    -- Fetch all roles for this user
    SELECT array_agg(r.name) INTO _roles
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id;

    -- Determine primary role (first one or null)
    _primary_role := _roles[1];

    -- Update auth.users metadata
    -- Wrapped in exception block to prevent blocking the transaction if auth update fails
    BEGIN
        UPDATE auth.users
        SET raw_user_meta_data = 
            jsonb_set(
                jsonb_set(
                    COALESCE(raw_user_meta_data, '{}'::jsonb),
                    '{roles}',
                    to_jsonb(COALESCE(_roles, ARRAY[]::text[]))
                ),
                '{primaryRole}',
                to_jsonb(COALESCE(_primary_role, 'no_role'))
            )
        WHERE id = _user_id;
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to sync roles to auth.users metadata: %', SQLERRM;
    END;

    RETURN NULL;
END;
$$;

-- Ensure ownership
ALTER FUNCTION public.sync_user_roles_to_metadata() OWNER TO postgres;

-- Re-define handle_new_user to be safe
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

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'User creation failed in trigger: % %', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

