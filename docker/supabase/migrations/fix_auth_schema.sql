-- Clean up Auth Schema conflicts

-- 1. Drop trigger on auth.users (if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop FK constraint on public.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 3. Drop auth schema
DROP SCHEMA IF EXISTS auth CASCADE;
