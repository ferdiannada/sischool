-- ============================================
-- JWT Authentication Functions
-- Enables server-side token generation
-- ============================================

-- 1. URL Safe Base64 Helper
CREATE OR REPLACE FUNCTION public.url_encode(data bytea) RETURNS text LANGUAGE sql AS $$
    SELECT translate(encode(data, 'base64'), '+/', '-_');
$$;

-- 2. URL Safe Base64 Helper for Text
CREATE OR REPLACE FUNCTION public.url_encode(data text) RETURNS text LANGUAGE sql AS $$
    SELECT translate(encode(data::bytea, 'base64'), '+/', '-_');
$$;

-- 3. Algorithm Signer
CREATE OR REPLACE FUNCTION public.sign_jwt(payload json, secret text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    header text := '{"alg":"HS256","typ":"JWT"}';
    segments text[];
BEGIN
    segments := current_setting('request.jwt.claim.sub', true); -- Dummy call to prevent unused warning if any/ ensure logic
    
    segments[1] := public.url_encode(header);
    segments[2] := public.url_encode(payload::text);
    segments[3] := public.url_encode(hmac(segments[1] || '.' || segments[2], secret, 'sha256'));
    
    RETURN segments[1] || '.' || segments[2] || '.' || segments[3];
END;
$$;

-- 4. Login RPC Function
-- Returns: JSON object with user details and signed token
CREATE OR REPLACE FUNCTION public.login(email text, password text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    _user public.users;
    _role_names text[];
    _token text;
    _result json;
    _secret text := 'your-super-secret-jwt-token-with-at-least-32-characters-long'; -- MUST MATCH DOCKER-COMPOSE
BEGIN
    -- Select user
    SELECT * INTO _user FROM public.users 
    WHERE public.users.email = login.email 
    AND public.users.is_active = true;

    IF _user IS NULL THEN
        RAISE EXCEPTION 'Invalid email or password';
    END IF;

    -- Verify password
    IF _user.password_hash != crypt(login.password, _user.password_hash) THEN
        RAISE EXCEPTION 'Invalid email or password';
    END IF;

    -- Get Roles
    SELECT array_agg(r.name) INTO _role_names
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user.id;

    -- Generate Token Payload
    -- exp: 1 day from now
    _token := public.sign_jwt(
        json_build_object(
            'role', 'authenticated',
            'sub', _user.id,
            'exp', extract(epoch from now() + interval '1 day')::integer,
            'iat', extract(epoch from now())::integer,
            'email', _user.email,
            'app_metadata', json_build_object('roles', _role_names)
        ),
        _secret
    );

    SELECT json_build_object(
        'user', json_build_object(
            'id', _user.id,
            'email', _user.email,
            'full_name', _user.full_name,
            'roles', _role_names,
            'avatar_url', _user.avatar_url
        ),
        'token', _token
    ) INTO _result;

    RETURN _result;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.login(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sign_jwt(json, text) TO service_role; -- Not for anon
