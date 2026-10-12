DO $$
DECLARE
    v_user_id uuid := gen_random_uuid();
    v_email text := 'delete_test_' || extract(epoch from now())::text || '@example.com';
BEGIN
    -- 1. Create User (Known to work)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email, 
        crypt('password', gen_salt('bf')), now(), 
        '{"provider":"email"}'::jsonb, '{"full_name":"Delete Test"}'::jsonb, now(), now()
    );
    
    RAISE NOTICE 'User created: %', v_user_id;

    -- 2. Validate Public User Exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
        RAISE EXCEPTION 'Public user not created!';
    END IF;

    -- 3. Attempt Delete from AUTH (Simulating Studio action)
    RAISE NOTICE 'Attempting DELETE from auth.users...';
    DELETE FROM auth.users WHERE id = v_user_id;
    
    -- 4. Verify Deletion
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
        RAISE EXCEPTION 'Auth user still exists!';
    END IF;
    
    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
        RAISE EXCEPTION 'Public user still exists (Cascade failed)!';
    END IF;

    RAISE NOTICE 'SUCCESS: User deleted properly.';
END $$;
