-- Function to delete auth user when public user is deleted
CREATE OR REPLACE FUNCTION public.delete_auth_user_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete the user from auth.users
    -- This requires the function to be SECURITY DEFINER to access auth schema
    DELETE FROM auth.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

-- Grant execution to postgres (owner) - usually strict, but here needed for trigger
ALTER FUNCTION public.delete_auth_user_trigger() OWNER TO postgres;

-- Create Trigger
DROP TRIGGER IF EXISTS on_public_user_deleted ON public.users;
CREATE TRIGGER on_public_user_deleted
    AFTER DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.delete_auth_user_trigger();
