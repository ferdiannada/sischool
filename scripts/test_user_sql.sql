DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    new_email text := 'sql_test_user_' || extract(epoch from now())::text || '@example.com';
BEGIN
    RAISE NOTICE 'Attempting to create user % via SQL', new_email;

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
        new_user_id,
        'authenticated',
        'authenticated',
        new_email,
        '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN', -- Dummy hash
        now(),
        '',
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "SQL Test User", "primaryRole": "siswa"}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        NULL
    );

    RAISE NOTICE 'Success! User created with ID %', new_user_id;
    
    -- Verify public.users
    IF EXISTS (SELECT 1 FROM public.users WHERE id = new_user_id) THEN
        RAISE NOTICE 'Verification: public.user exists.';
    ELSE
        RAISE EXCEPTION 'Verification FAILED: public.user missing (Trigger failed silentiy?).';
    END IF;

    -- Verify role
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = new_user_id) THEN
        RAISE NOTICE 'Verification: public.user_role exists.';
    ELSE
        RAISE EXCEPTION 'Verification FAILED: public.user_role missing (Trigger failed silently?).';
    END IF;

    -- Cleanup
    DELETE FROM auth.users WHERE id = new_user_id;
    RAISE NOTICE 'Cleanup complete.';
END $$;
